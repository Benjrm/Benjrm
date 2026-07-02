use {
    crate::{
        auth::User,
        error::Error,
        game_session::{
            AnswerStatistic, AnswerStatistics, Channel, ChoiceStatistics, Command,
            DisplayQuestionMessage, GameSession, GameSessionError, GameSessionHost,
            GameSessionPlayer, GameSessionStatus, GameSessions, HostCommand, HostMessage,
            LeaderboardEntry, Message, OrderStatistics, Player, PlayerCommand, PlayerMessage,
            SessionCode,
        },
        question::{
            Question, QuestionFilter, QuestionOptions,
            answer::{choice::entity::AnswerChoiceModel, order::AnswerOrderModel},
        },
        quiz::Quiz,
    },
    actix_web::rt,
    chrono::{TimeDelta, Utc},
    emojis::Emoji,
    futures::{StreamExt, stream::FuturesUnordered},
    sea_orm::ConnectionTrait,
    std::{collections::HashMap, sync::Arc, time::Duration},
    tokio::sync::{Mutex, RwLock},
    uuid::Uuid,
};

impl GameSessions {
    /// Creates a new instance of [`GameSessions`].
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    /// Creates a new game session.
    ///
    /// # Behavior
    ///
    /// - Optionally loads a quiz owned by the host
    /// - Initializes the session in [`GameSessionStatus::Waiting`]
    /// - Stores the session only in memory (not persisted)
    ///
    /// ## Session Codes
    /// - In debug builds, session codes are generated sequentially starting from 1.
    /// - In release builds, session codes are generated randomly and checked for uniqueness.
    ///    - If a unique code can't be generated after 10 attempts, an error is returned (rare situation).
    pub async fn create_session(
        &self,
        conn: &impl ConnectionTrait,
        host: User,
        quiz: Option<Uuid>,
    ) -> Result<(SessionCode, Arc<Mutex<GameSession>>), Error> {
        let quiz = match quiz {
            Some(quiz_id) => {
                let quiz = Quiz::<Question>::get(
                    conn,
                    host.id,
                    quiz_id,
                    &QuestionFilter {
                        hidden: Some(false),
                    },
                )
                .await?;
                Some(Arc::new(quiz))
            }
            None => None,
        };

        let mut sessions = self.sessions.write().await;
        let code = {
            #[cfg(debug_assertions)]
            {
                use std::sync::atomic::{AtomicU32, Ordering};
                static SESSION_CNT: AtomicU32 = AtomicU32::new(1);
                SESSION_CNT.fetch_add(1, Ordering::Relaxed)
            }

            #[cfg(not(debug_assertions))]
            {
                use rand::RngExt;
                let mut code = None;
                let mut rng = rand::rng();
                for _ in 0..10 {
                    let new_code: SessionCode = rng.random_range(100_0000..=9999_9999);
                    if !sessions.contains_key(&new_code) {
                        code = Some(new_code);
                        break;
                    }
                }
                code.ok_or(GameSessionError::CannotGenerateCode)?
            }
        };

        let game = GameSession {
            status: GameSessionStatus::Waiting(Vec::new()),
            host: host.into(),
            players: Vec::new(),
            quiz,
        };

        let game = Arc::new(Mutex::new(game));
        sessions.insert(code, Arc::clone(&game));

        Ok((code, game))
    }

    /// Retrieves a game session by its code.
    pub async fn get_session(
        &self,
        code: SessionCode,
    ) -> Result<Arc<Mutex<GameSession>>, GameSessionError> {
        let map = self.sessions.read().await;
        if let Some(game) = map.get(&code) {
            Ok(Arc::clone(game))
        } else {
            Err(GameSessionError::InvalidCode)
        }
    }

    /// Removes a session without closing it and without permission check.
    ///
    /// Intended for internal cleanup operations.
    pub async fn drop_session(&self, code: SessionCode) {
        let mut sessions = self.sessions.write().await;
        sessions.remove(&code);
    }

    /// Remove and closes a session.
    pub async fn delete_session(
        &self,
        user: &User,
        code: SessionCode,
    ) -> Result<(), GameSessionError> {
        let session = self.get_session(code).await?;

        {
            let mut session = session.lock().await;
            if &session.host.user != user {
                return Err(GameSessionError::Forbidden);
            }
            session.close().await;
        }

        self.drop_session(code).await;

        Ok(())
    }
}

impl Default for GameSessions {
    fn default() -> Self {
        Self::new()
    }
}

impl GameSession {
    /// Checks if the session is closed.
    pub fn is_closed(&self) -> bool {
        matches!(self.status, GameSessionStatus::Closed)
    }

    /// Closes the session and its host channel.
    pub async fn close(&mut self) {
        let status = std::mem::replace(&mut self.status, GameSessionStatus::Closed);
        if let Some(host_channel) = self.host.channel.take() {
            host_channel.close().await;
        }

        let futures = self.players.drain(..).map(|player| player.channel.close());

        if let GameSessionStatus::Waiting(joining) = status {
            let joining_futures = joining.into_iter().map(|joining| joining.cancel());
            let futures = futures.chain(joining_futures);
            execute_futures(futures).await;
        } else {
            execute_futures(futures).await;
        }
    }

    /// Checks if the given user is the host of the session and if the session is not closed.
    pub fn check_set_host_channel(&self, user: &User) -> Result<(), GameSessionError> {
        if self.is_closed() {
            return Err(GameSessionError::InvalidCode);
        }
        if &self.host.user != user {
            return Err(GameSessionError::Forbidden);
        }
        Ok(())
    }

    /// Set the host channel and close the old one. Informs the new host of the currect state.
    /// Must only be called after successfully calling [`GameSession::check_set_host_channel`].
    pub async fn set_host_channel<T: Channel<HostMessage> + 'static>(&mut self, channel: T) {
        let channel = Box::new(channel);
        if let Some(old_channel) = self.host.channel.take() {
            old_channel.close().await;
        }
        self.host.channel = Some(channel);
        self.update_host().await;
    }

    /// Send all messages that are required to restore the state to the host.
    async fn update_host(&mut self) {
        let players = self.players.iter().map(Player::from).collect();
        self.host
            .msg(Message::from(&HostMessage::SetPlayers { players }))
            .await;

        let Some(quiz) = &self.quiz else { return };

        async fn send_leaderboard(
            host: &mut GameSessionHost,
            leaderboard: &Arc<Vec<LeaderboardEntry>>,
            is_final: bool,
        ) {
            host.msg(Message::from(&HostMessage::DisplayLeaderboard {
                leaderboard: Arc::clone(leaderboard),
                is_final,
            }))
            .await;
        }

        let (idx, timing) = match &self.status {
            GameSessionStatus::Waiting(_) => return,
            GameSessionStatus::Started => return,
            GameSessionStatus::Question { idx, started, .. } => (*idx, Some(*started)),
            GameSessionStatus::Leaderboard { idx, .. } => (*idx, None),
            GameSessionStatus::Podium(leaderboard) => {
                send_leaderboard(&mut self.host, leaderboard, true).await;
                self.host
                    .msg(Message::from(&HostMessage::DisplayPodium))
                    .await;
                return;
            }
            GameSessionStatus::Closed => return,
        };

        let question = Arc::new(DisplayQuestionMessage::new(
            &quiz.questions[idx],
            idx,
            quiz.questions.len(),
        ));

        // Send leaderboard before question if currently on question screen
        if let GameSessionStatus::Question {
            leaderboard: Some(leaderboard),
            ..
        } = &self.status
        {
            send_leaderboard(&mut self.host, leaderboard, false).await;
        }

        self.host
            .msg(Message {
                id: None,
                msg: &HostMessage::DisplayQuestion(question),
                timing,
            })
            .await;

        // Send leaderboard after question if question has finished
        if let GameSessionStatus::Leaderboard {
            statistics,
            leaderboard,
            is_final,
            ..
        } = &self.status
        {
            send_leaderboard(&mut self.host, leaderboard, *is_final).await;
            if let Some(statistics) = statistics {
                self.host
                    .msg(Message::from(&HostMessage::ShowStatistics(Arc::clone(
                        statistics,
                    ))))
                    .await;
            }
        }
    }

    /// Handles a command sent by the host of the session.
    ///
    /// This is where the session state is updated based on the host's commands, such as starting the game or moving to the next question.
    pub async fn handle_host_cmd(
        &mut self,
        cmd: Command<HostCommand>,
        arc: Arc<Mutex<Self>>,
        (sessions, code): &(GameSessions, SessionCode),
    ) -> Result<(), GameSessionError> {
        match cmd.command {
            HostCommand::Pong { .. } => (),
            HostCommand::KickPlayer { id } => {
                let pos = self
                    .players
                    .iter()
                    .position(|v| v.id == id)
                    .ok_or(GameSessionError::PlayerNotFound)?;
                let mut player = self.players.swap_remove(pos);
                player.msg(Message::from(&PlayerMessage::Kick)).await;
                player.channel.close().await;
                self.host
                    .msg(Message::from(&HostMessage::RemovePlayer { id: player.id }))
                    .await;
            }
            HostCommand::Start => {
                let GameSessionStatus::Waiting(joining) = &mut self.status else {
                    return Err(GameSessionError::AlreadyStarted);
                };

                let quiz = self.quiz.as_ref().ok_or(GameSessionError::QuizMissing)?;
                if quiz.questions.is_empty() {
                    return Err(GameSessionError::NoQuestions);
                }
                if self.players.is_empty() {
                    return Err(GameSessionError::NoPlayers);
                }

                for item in std::mem::take(joining) {
                    item.cancel().await;
                }

                self.status = GameSessionStatus::Started;
                self.notify_all_players(Message::from(&PlayerMessage::Start))
                    .await;
            }
            HostCommand::NextQuestion => self.next_question(None, arc).await?,
            HostCommand::ShowQuestion { id } => self.next_question(Some(id), arc).await?,
            HostCommand::ShowPodium => {
                let leaderboard = match &self.status {
                    GameSessionStatus::Leaderboard { leaderboard, .. } => Arc::clone(leaderboard),
                    _ => return Err(GameSessionError::NoLeaderboard),
                };
                self.status = GameSessionStatus::Podium(Arc::clone(&leaderboard));

                self.host
                    .msg(Message::from(&HostMessage::DisplayPodium))
                    .await;

                let player_iterator = self.players.iter_mut().map(|player| {
                    let leaderboard = Arc::clone(&leaderboard);
                    async move {
                        player
                            .msg(Message::from(&PlayerMessage::DisplayLeaderboard {
                                leaderboard,
                                is_final: true,
                            }))
                            .await;
                    }
                });
                execute_futures(player_iterator).await;
            }
            HostCommand::EndGame => {
                sessions.drop_session(*code).await;
                self.end_question(Some(true)).await;
                self.notify_all_players(Message::from(&PlayerMessage::GameEnded))
                    .await;
                self.close().await
            }
        }
        Ok(())
    }

    /// Moves the session to the next question.
    /// If `id` is [`None`], it will move to the next question in order.
    /// If `id` is [`Some(id)`](Option::Some<Uuid>), it will show the question with that id.
    ///
    /// If the session is currently in a question, it will end that question first.
    async fn next_question(
        &mut self,
        id: Option<Uuid>,
        arc: Arc<Mutex<Self>>,
    ) -> Result<(), GameSessionError> {
        match &mut self.status {
            GameSessionStatus::Waiting(_) => return Err(GameSessionError::NotStarted),
            GameSessionStatus::Started | GameSessionStatus::Leaderboard { .. } => (),
            GameSessionStatus::Question { abort_handle, .. } => {
                if let Some(abort_handle) = abort_handle.take() {
                    abort_handle.abort();
                }
                self.end_question(None).await;
            }
            GameSessionStatus::Podium(_) => return Err(GameSessionError::NoQuestionLeft),
            GameSessionStatus::Closed => return Err(GameSessionError::InvalidCode),
        }

        let quiz = self.quiz.clone().ok_or(GameSessionError::QuizMissing)?;

        let question = if let Some(id) = id {
            quiz.questions
                .iter()
                .position(|q| q.model.id == id)
                .ok_or(GameSessionError::QuestionNotFound)?
        } else {
            let question = match self.status {
                GameSessionStatus::Leaderboard { idx, .. } => idx + 1,
                _ => 0,
            };
            if question >= quiz.questions.len() {
                return Err(GameSessionError::NoQuestionLeft);
            }
            question
        };

        let offset_secs = 3u32;
        let started = Utc::now() + TimeDelta::seconds(offset_secs as i64);
        let abort_handle = quiz.questions[question]
            .model
            .r#type
            .default_answer_duration()
            .map(move |duration| {
                rt::spawn(async move {
                    tokio::time::sleep(Duration::from_secs((duration + offset_secs) as u64)).await;
                    let mut session = arc.lock().await;

                    if let GameSessionStatus::Question { idx, answers, .. } = &session.status
                        && *idx == question
                        && session.players.len() > *answers
                    {
                        session.end_question(None).await;
                    }
                })
            });

        let leaderboard = match &self.status {
            GameSessionStatus::Leaderboard { leaderboard, .. } => Some(Arc::clone(leaderboard)),
            _ => None,
        };
        let options_len = quiz.questions[question].options.len();
        self.status = GameSessionStatus::Question {
            idx: question,
            started,
            answers: 0,
            answer_distribution: vec![0; options_len],
            abort_handle,
            leaderboard,
        };

        let total_questions = quiz.questions.len();
        let question = Arc::new(DisplayQuestionMessage::new(
            &quiz.questions[question],
            question,
            total_questions,
        ));

        self.host
            .msg(Message {
                id: None,
                msg: &HostMessage::DisplayQuestion(Arc::clone(&question)),
                timing: Some(started),
            })
            .await;
        self.notify_all_players(Message {
            id: None,
            msg: &PlayerMessage::DisplayQuestion(question),
            timing: Some(started),
        })
        .await;

        Ok(())
    }

    /// Checks if the session is currently in a state where a new player can join.
    /// Also checks if the given name is already taken by another player in the session.
    pub fn check_add_player(&self, name: &str) -> Result<(), GameSessionError> {
        if !matches!(self.status, GameSessionStatus::Waiting(_)) {
            return Err(GameSessionError::AlreadyStarted);
        }
        if self.players.iter().any(|player| player.name == name) {
            return Err(GameSessionError::NameAlreadyTaken);
        }
        Ok(())
    }

    /// Add a new player and remove the channel from the list of joining players.
    /// Must only be called after successfully calling [`GameSession::check_add_player`].
    pub async fn add_player<T: Channel<PlayerMessage> + 'static>(
        &mut self,
        cmd_id: Option<u64>,
        id: Uuid,
        channel: T,
        name: String,
        emoji: Option<&'static Emoji>,
    ) {
        if let GameSessionStatus::Waiting(joining) = &mut self.status
            && let Some(pos) = joining.iter().position(|x| x.id() == channel.id())
        {
            joining.swap_remove(pos);
        }
        let secret = Uuid::new_v4();

        let mut player = GameSessionPlayer {
            id,
            secret,
            name,
            emoji,
            channel: Box::new(channel),
            points: 0,
            last_question: None,
        };

        player
            .msg(Message {
                id: cmd_id,
                msg: &PlayerMessage::ConnectResponse {
                    id,
                    secret,
                    name: player.name.clone(),
                    emoji,
                },
                timing: None,
            })
            .await;

        self.host
            .msg(Message::from(&HostMessage::AddPlayer(Player::from(
                &player,
            ))))
            .await;

        self.players.push(player);
    }

    /// Send messages to restore the current state to a player.
    /// [`PlayerMessage::QuestionResult`] is not included because it's basically a response to [`PlayerCommand::AnswerQuestion`] and is not persisted.
    pub async fn update_player(&mut self, player_id: Uuid) {
        let Ok(player) = Self::get_player_mut(&mut self.players, player_id) else {
            return;
        };
        let Some(quiz) = &self.quiz else {
            return;
        };

        match &self.status {
            GameSessionStatus::Waiting(_) => (),
            GameSessionStatus::Started | GameSessionStatus::Leaderboard { .. } => {
                player.msg(Message::from(&PlayerMessage::Start)).await
            }
            GameSessionStatus::Question { idx, started, .. } => {
                player.msg(Message::from(&PlayerMessage::Start)).await;

                let question = Arc::new(DisplayQuestionMessage::new(
                    &quiz.questions[*idx],
                    *idx,
                    quiz.questions.len(),
                ));
                player
                    .msg(Message {
                        id: None,
                        msg: &PlayerMessage::DisplayQuestion(question),
                        timing: Some(*started),
                    })
                    .await;
            }
            GameSessionStatus::Podium(leaderboard) => {
                player.msg(Message::from(&PlayerMessage::Start)).await;
                player
                    .msg(Message::from(&PlayerMessage::DisplayLeaderboard {
                        leaderboard: Arc::clone(leaderboard),
                        is_final: true,
                    }))
                    .await;
            }
            GameSessionStatus::Closed => player.msg(Message::from(&PlayerMessage::GameEnded)).await,
        }
    }

    /// Handles a command sent by the players of the session.
    pub async fn handle_player_cmd(
        &mut self,
        cmd: Command<PlayerCommand>,
        _arc: Arc<Mutex<Self>>,
        id: &Uuid,
    ) -> Result<(), GameSessionError> {
        match cmd.command {
            PlayerCommand::Pong { .. } => (),
            PlayerCommand::SetName { name, emoji } => {
                let mut name_in_use = false;
                let mut this_player = None;
                for player in self.players.iter_mut() {
                    if player.name == name && player.id != *id {
                        name_in_use = true;

                        if this_player.is_some() {
                            break;
                        }
                    }

                    if player.id == *id {
                        this_player = Some(player);

                        if name_in_use {
                            break;
                        }
                    }
                }

                let player = this_player.ok_or(GameSessionError::PlayerNotFound)?;
                if name_in_use {
                    return Err(GameSessionError::NameAlreadyTaken);
                }

                if let Some(emoji) = emoji {
                    let emoji = emojis::get(&emoji).ok_or(GameSessionError::InvalidEmoji)?;
                    player.emoji = Some(emoji);
                } else {
                    player.emoji = None;
                }
                player.name = name;

                // `handle_player_cmd` is only called if the player is already joined, so a `SetName` command is always a rename
                self.host
                    .msg(Message::from(&HostMessage::RenamePlayer(Player::from(
                        &*player,
                    ))))
                    .await;
            }
            PlayerCommand::Reconnect { .. } => Err(GameSessionError::CommandNotAllowed)?,
            PlayerCommand::AnswerQuestion { answer } => {
                let player = Self::get_player_mut(&mut self.players, *id)?;
                if matches!(self.status, GameSessionStatus::Leaderboard { .. }) {
                    return Err(GameSessionError::TimeUp);
                }
                let GameSessionStatus::Question {
                    idx,
                    started,
                    answers,
                    answer_distribution,
                    abort_handle,
                    ..
                } = &mut self.status
                else {
                    return Err(GameSessionError::NoCurrentQuestion);
                };
                let quiz = self.quiz.as_mut().ok_or(GameSessionError::QuizMissing)?;
                let question = &quiz.questions[*idx];

                let correct = question.options.get_correct(&answer)?;
                let mut points = question.options.get_points(correct);

                let mut answer_in_time = true;
                if let Some(duration) = question.model.r#type.default_answer_duration() {
                    let elapsed = (Utc::now() - *started).num_milliseconds() as f64;
                    let max_time = (duration as f64) * 1000f64;
                    if elapsed <= max_time {
                        let factor = ((max_time - elapsed) / max_time) + 0.1;
                        points = (points as f64 * factor.min(1.0)) as u32;
                    } else {
                        points = 0;
                        answer_in_time = false;
                    }
                }

                player.add_points(points, question.model.id)?;

                if answer_in_time {
                    match &question.options {
                        QuestionOptions::Slide => (),
                        QuestionOptions::SingleChoice(_) | QuestionOptions::MultipleChoice(_) => {
                            let mut visited = Vec::with_capacity(answer.len());
                            for answer in answer {
                                if let Some(pos) = question.options.position(answer)
                                    && !visited.contains(&pos)
                                {
                                    if let Some(item) = answer_distribution.get_mut(pos) {
                                        *item += 1;
                                    }
                                    visited.push(pos);
                                }
                            }
                        }
                        QuestionOptions::Order(_) => {
                            if let Some(item) = answer_distribution.get_mut(correct) {
                                *item += 1;
                            }
                        }
                    }

                    *answers += 1;
                    if *answers == self.players.len() {
                        if let Some(handle) = abort_handle {
                            handle.abort();
                        }
                        self.end_question(None).await;
                    }
                }
            }
        }
        Ok(())
    }

    /// Retrieves a mutable reference to a player in the session by their ID.
    pub fn get_player_mut(
        players: &mut [GameSessionPlayer],
        id: Uuid,
    ) -> Result<&mut GameSessionPlayer, GameSessionError> {
        players
            .iter_mut()
            .find(|v| v.id == id)
            .ok_or(GameSessionError::PlayerNotFound)
    }

    /// Broadcasts a message to all players in a session.
    ///
    /// Futures are executed concurrently with bounded parallelism (by using [`execute_futures`]).
    pub async fn notify_all_players(&mut self, msg: Message<'_, PlayerMessage>) {
        let iterator = self
            .players
            .iter_mut()
            .map(|player| player.msg(msg.clone()));
        execute_futures(iterator).await
    }

    /// Ends the current question, calculates points for players, and sends the results to both the host and players.
    pub async fn end_question(&mut self, is_final: Option<bool>) {
        let GameSessionStatus::Question {
            idx,
            answers,
            answer_distribution,
            ..
        } = &self.status
        else {
            return;
        };
        let Some(quiz) = &self.quiz else {
            return;
        };

        let is_final = is_final.unwrap_or(*idx + 1 >= quiz.questions.len());
        let question = &quiz.questions[*idx];

        let statistics =
            match &question.options {
                QuestionOptions::Slide => None,
                QuestionOptions::SingleChoice(models) => Some(AnswerStatistics::SingleChoice(
                    ChoiceStatistics::new(models, answer_distribution, *answers),
                )),
                QuestionOptions::MultipleChoice(models) => Some(AnswerStatistics::MultipleChoice(
                    ChoiceStatistics::new(models, answer_distribution, *answers),
                )),
                QuestionOptions::Order(models) => Some(AnswerStatistics::Order(
                    OrderStatistics::new(models, answer_distribution, *answers),
                )),
            };

        let statistics = statistics.map(Arc::new);
        if let Some(statistics) = &statistics {
            self.host
                .msg(Message::from(&HostMessage::ShowStatistics(Arc::clone(
                    statistics,
                ))))
                .await;
        }

        let correct_answers = Arc::new(question.options.correct_answer_list());
        let mut leaderboard = Vec::with_capacity(self.players.len());

        let iterator = self.players.iter_mut().map(|player| {
            let points = player.apply_points(question.model.id);
            leaderboard.push(LeaderboardEntry {
                id: player.id,
                name: player.name.clone(),
                emoji: player.emoji,
                total_points: player.points,
                points,
            });

            let correct_answers = Arc::clone(&correct_answers);
            async move {
                player
                    .msg(Message::from(&PlayerMessage::QuestionResult {
                        question: question.model.id,
                        correct_answers,
                        total_points: player.points,
                        points,
                    }))
                    .await;
            }
        });
        execute_futures(iterator).await;

        leaderboard.sort();
        let leaderboard = Arc::new(leaderboard);
        self.status = GameSessionStatus::Leaderboard {
            idx: *idx,
            statistics,
            leaderboard: Arc::clone(&leaderboard),
            is_final,
        };

        self.host
            .msg(Message::from(&HostMessage::DisplayLeaderboard {
                leaderboard,
                is_final,
            }))
            .await;
    }
}

impl GameSessionHost {
    /// Sends a message to the host of the session.
    pub async fn msg(&mut self, msg: Message<'_, HostMessage>) {
        if let Some(channel) = &mut self.channel
            && let Err(err) = channel.send(msg).await
        {
            log::error!("notify host error: {err:?}");
        }
    }
}

impl GameSessionPlayer {
    /// Checks if the provided secret matches the player's secret.
    pub fn check_set_channel(&self, secret: Uuid) -> Result<(), GameSessionError> {
        if self.secret != secret {
            return Err(GameSessionError::InvalidPlayerSecret);
        }
        Ok(())
    }

    /// Sets the player's communication channel, replacing any existing channel and sending a connection response message to the player.
    pub async fn set_channel<T: Channel<PlayerMessage> + 'static>(
        &mut self,
        cmd_id: Option<u64>,
        channel: T,
    ) {
        let old_channel = std::mem::replace(&mut self.channel, Box::new(channel));
        old_channel.close().await;
        self.msg(Message {
            id: cmd_id,
            msg: &PlayerMessage::ConnectResponse {
                id: self.id,
                secret: self.secret,
                name: self.name.clone(),
                emoji: self.emoji,
            },
            timing: None,
        })
        .await;
    }

    /// Sends a message to the player.
    pub async fn msg(&mut self, msg: Message<'_, PlayerMessage>) {
        if let Err(err) = self.channel.send(msg).await {
            log::error!("failed to send message to player {}: {err:?}", self.id)
        }
    }

    /// Adds points for the player for a specific question.
    /// If the player has already answered that question, it returns an error.
    /// Points don't get applied until [`GameSessionPlayer::apply_points`] is called for that question.
    pub fn add_points(&mut self, points: u32, question: Uuid) -> Result<(), GameSessionError> {
        if let Some((_, uuid)) = self.last_question
            && uuid == question
        {
            return Err(GameSessionError::AlreadyAnswered);
        }
        self.last_question = Some((points, question));
        Ok(())
    }

    /// Applies the points from the last answered question to the player's total points.
    pub fn apply_points(&mut self, question: Uuid) -> u32 {
        let mut points = 0;
        if let Some((new_points, uuid)) = self.last_question
            && uuid == question
        {
            self.points += new_points;
            points = new_points
        }
        self.last_question = None;
        points
    }
}

impl QuestionOptions {
    /// Calculates the points for a given answer based on how many correct elements were identified.
    /// The scoring system is normalized to a total of **1000 points per question**.
    ///
    /// The final score is computed by multiplying the result from [`get_correct`](Self::get_correct) with the per-option score.
    pub fn get_points(&self, correct: usize) -> u32 {
        let total_points = 1000;
        let points_per_option = match self {
            QuestionOptions::Slide => 0,
            QuestionOptions::SingleChoice(_) => total_points,
            QuestionOptions::MultipleChoice(models) => total_points / models.len(),
            QuestionOptions::Order(models) => total_points / (models.len() - 1),
        };

        (correct * points_per_option).min(total_points) as u32
    }

    /// Calculates the number of correct options for a given answer based on the question type.
    ///
    /// **Hint:**
    /// - [`Slide`](QuestionOptions::Slide) questions can't be answered and always return an error.
    /// - [`SingleChoice`](QuestionOptions::SingleChoice) returns `1` if correct, otherwise `0`.
    /// - [`MultipleChoice`](QuestionOptions::MultipleChoice) counts how many selections match the
    ///   correctness state (selected correct + unselected incorrect).
    /// - [`Order`](QuestionOptions::Order) counts how many adjacent pairs are in the correct order.
    pub fn get_correct(&self, answer: &[Uuid]) -> Result<usize, GameSessionError> {
        match self {
            QuestionOptions::Slide => Err(GameSessionError::CannotAnswer),
            QuestionOptions::SingleChoice(models) => {
                if answer.len() != 1 {
                    return Err(GameSessionError::InvalidAnswerCount);
                }
                match models.iter().find(|x| x.id == answer[0]) {
                    Some(answer) if answer.correct => Ok(1),
                    Some(_) => Ok(0),
                    None => Err(GameSessionError::InvalidAnswer),
                }
            }
            QuestionOptions::MultipleChoice(models) => {
                for id in answer {
                    if !models.iter().any(|x| x.id == *id) {
                        return Err(GameSessionError::InvalidAnswer);
                    }
                }
                let mut correct: isize = 0;
                for option in models {
                    if option.correct == answer.contains(&option.id) {
                        correct += 1;
                    } else {
                        correct -= 1;
                    }
                }
                Ok(correct.max(0) as usize)
            }
            QuestionOptions::Order(models) => {
                if models.len() != answer.len() || answer.len() < 2 {
                    return Err(GameSessionError::InvalidAnswerCount);
                }
                let mut correct = 0;
                for i in 0..(models.len() - 1) {
                    let current = answer
                        .iter()
                        .position(|x| *x == models[i].id)
                        .ok_or(GameSessionError::InvalidAnswer)?;
                    let next = answer
                        .iter()
                        .position(|x| *x == models[i + 1].id)
                        .ok_or(GameSessionError::InvalidAnswer)?;
                    if next == current + 1 {
                        correct += 1;
                    }
                }
                Ok(correct)
            }
        }
    }

    /// Returns a list of the correct answer IDs for the question.
    ///
    /// **Hint:**
    /// - [`Slide`](QuestionOptions::Slide) questions don't have correct answers, so this will return an empty list.
    /// - [`SingleChoice`](QuestionOptions::SingleChoice) and [`MultipleChoice`](QuestionOptions::MultipleChoice) questions return the IDs of the correct options.
    /// - [`Order`](QuestionOptions::Order) questions return the IDs of the options in the correct order.
    pub fn correct_answer_list(&self) -> Vec<Uuid> {
        match self {
            QuestionOptions::Slide => Vec::new(),
            QuestionOptions::SingleChoice(models) | QuestionOptions::MultipleChoice(models) => {
                models.iter().filter(|x| x.correct).map(|x| x.id).collect()
            }
            QuestionOptions::Order(models) => models.iter().map(|x| x.id).collect(),
        }
    }

    /// Returns the number of answer options for the question.
    pub fn len(&self) -> usize {
        match self {
            QuestionOptions::Slide => 0,
            QuestionOptions::SingleChoice(models) | QuestionOptions::MultipleChoice(models) => {
                models.len()
            }
            QuestionOptions::Order(models) => models.len(),
        }
    }

    /// Returns the position of a specific answer ID within the question's options if found.
    pub fn position(&self, id: Uuid) -> Option<usize> {
        match self {
            QuestionOptions::Slide => None,
            QuestionOptions::SingleChoice(models) | QuestionOptions::MultipleChoice(models) => {
                models.iter().position(|x| x.id == id)
            }
            QuestionOptions::Order(models) => models.iter().position(|x| x.id == id),
        }
    }
}

impl ChoiceStatistics {
    /// Creates a new instance of [`ChoiceStatistics`] based on the provided answer models, distribution of answers, and total number of answers.
    pub fn new(models: &[AnswerChoiceModel], distribution: &[usize], answers: usize) -> Self {
        let answer_statistic = models
            .iter()
            .enumerate()
            .map(|(i, model)| AnswerStatistic {
                option: model.id,
                votes: distribution[i],
                correct: model.correct,
            })
            .collect();

        Self {
            answers,
            answer_statistic,
        }
    }
}

impl OrderStatistics {
    /// Creates a new instance of [`OrderStatistics`] based on the provided answer models, distribution of answers, and total number of answers.
    pub fn new(models: &[AnswerOrderModel], distribution: &[usize], answers: usize) -> Self {
        Self {
            answers,
            correct: models.iter().map(|x| x.id).collect(),
            answer_statistic: distribution.to_vec(),
        }
    }
}

/// Executes up to 64 futures in parallel.
/// After a future completes, it will start the next one from the iterator until all futures are completed.
async fn execute_futures<T>(mut iterator: T)
where
    T: Iterator,
    T::Item: Future<Output = ()>,
{
    let mut futures = FuturesUnordered::new();

    while futures.len() < 64
        && let Some(future) = iterator.next()
    {
        futures.push(future);
    }

    while futures.next().await.is_some() {
        if let Some(future) = iterator.next() {
            futures.push(future);
        }
    }
}
