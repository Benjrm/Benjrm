use {
    crate::{
        auth::User,
        error::Error,
        game_session::{
            Channel, Command, DisplayQuestionMessage, GameSession, GameSessionError,
            GameSessionHost, GameSessionPlayer, GameSessionStatus, GameSessions, HostCommand,
            HostMessage, LeaderboardEntry, Message, PlayerCommand, PlayerMessage, SessionCode,
        },
        question::{Question, QuestionFilter, QuestionOptions},
        quiz::Quiz,
    },
    actix_web::rt,
    chrono::{TimeDelta, Utc},
    futures::{StreamExt, stream::FuturesUnordered},
    sea_orm::ConnectionTrait,
    std::{collections::HashMap, sync::Arc, time::Duration},
    tokio::sync::{Mutex, RwLock},
    uuid::Uuid,
};

impl GameSessions {
    pub fn new() -> Self {
        Self {
            sessions: RwLock::new(HashMap::new()),
        }
    }

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
            status: GameSessionStatus::Waiting,
            host: host.into(),
            players: Vec::new(),
            quiz,
        };

        let game = Arc::new(Mutex::new(game));
        sessions.insert(code, Arc::clone(&game));

        Ok((code, game))
    }

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

    pub async fn drop_session(&self, code: SessionCode) {
        let mut sessions = self.sessions.write().await;
        sessions.remove(&code);
    }

    pub async fn delete_session(
        &self,
        user: &User,
        code: SessionCode,
    ) -> Result<(), GameSessionError> {
        let mut sessions = self.sessions.write().await;
        let session = match sessions.get(&code) {
            Some(session) => Arc::clone(session),
            None => return Err(GameSessionError::InvalidCode),
        };

        let mut session = session.lock().await;
        if &session.host.user != user {
            return Err(GameSessionError::Forbidden);
        }

        sessions.remove(&code);
        drop(sessions);

        session.close().await;

        Ok(())
    }
}

impl Default for GameSessions {
    fn default() -> Self {
        Self::new()
    }
}

impl GameSession {
    pub fn is_closed(&self) -> bool {
        matches!(self.status, GameSessionStatus::Closed)
    }

    pub async fn close(&mut self) {
        self.status = GameSessionStatus::Closed;
        if let Some(host_channel) = self.host.channel.take() {
            host_channel.close().await;
        }
    }

    pub fn check_set_host_channel(&self, user: &User) -> Result<(), GameSessionError> {
        if self.is_closed() {
            return Err(GameSessionError::InvalidCode);
        }
        if &self.host.user != user {
            return Err(GameSessionError::Forbidden);
        }
        Ok(())
    }

    pub async fn set_host_channel<T: Channel<HostMessage> + 'static>(&mut self, channel: T) {
        let channel = Box::new(channel);
        if let Some(old_channel) = self.host.channel.take() {
            old_channel.close().await;
        }
        self.host.channel = Some(channel);
    }

    pub async fn handle_host_cmd(
        &mut self,
        cmd: Command<HostCommand>,
        arc: Arc<Mutex<Self>>,
        _payload: SessionCode,
    ) {
        match cmd.command {
            HostCommand::Pong { .. } => (),
            HostCommand::KickPlayer { id } => {
                if let Some(pos) = self.players.iter().position(|v| v.id == id) {
                    let mut player = self.players.swap_remove(pos);
                    player.msg(Message::from(&PlayerMessage::Kick)).await;
                    player.channel.close().await;
                    if player.name.is_some() {
                        self.host.ok(cmd.id).await;
                        self.host
                            .msg(Message::from(&HostMessage::RemovePlayer { id: player.id }))
                            .await;
                    }
                } else {
                    self.host
                        .error(cmd.id, GameSessionError::PlayerNotFound)
                        .await;
                }
            }
            HostCommand::Start => {
                let check_error = || {
                    if !matches!(self.status, GameSessionStatus::Waiting) {
                        return Err(GameSessionError::AlreadyStarted);
                    }

                    if self.quiz.is_none() {
                        return Err(GameSessionError::QuizMissing);
                    }

                    if self.players.is_empty() || !self.players.iter().any(|x| x.name.is_some()) {
                        return Err(GameSessionError::NoPlayers);
                    }

                    Ok(())
                };

                if let Err(err) = check_error() {
                    self.host.error(cmd.id, err).await;
                    return;
                }

                self.status = GameSessionStatus::Started;
                self.notify_all_players(Message::from(&PlayerMessage::Start))
                    .await;
                self.host.ok(cmd.id).await;
            }
            HostCommand::NextQuestion => match self.next_question(None, arc).await {
                Ok(()) => self.host.ok(cmd.id).await,
                Err(err) => self.host.error(cmd.id, err).await,
            },
            HostCommand::ShowQuestion { id } => match self.next_question(Some(id), arc).await {
                Ok(()) => self.host.ok(cmd.id).await,
                Err(err) => self.host.error(cmd.id, err).await,
            },
            HostCommand::EndGame => {
                self.end_question(Some(true)).await;
                self.notify_all_players(Message::from(&PlayerMessage::GameEnded))
                    .await;
                self.status = GameSessionStatus::Closed;
                self.host.ok(cmd.id).await;
            }
        }
    }

    async fn next_question(
        &mut self,
        id: Option<Uuid>,
        arc: Arc<Mutex<Self>>,
    ) -> Result<(), GameSessionError> {
        match &mut self.status {
            GameSessionStatus::Closed => return Err(GameSessionError::InvalidCode),
            GameSessionStatus::Waiting => return Err(GameSessionError::NotStarted),
            GameSessionStatus::Started | GameSessionStatus::Leaderboard { .. } => (),
            GameSessionStatus::Question { abort_handle, .. } => {
                if let Some(abort_handle) = abort_handle.take() {
                    abort_handle.abort();
                }
                self.end_question(None).await;
            }
        }

        let quiz = self.quiz.clone().ok_or(GameSessionError::QuizMissing)?;

        let question = if let Some(id) = id {
            quiz.questions
                .iter()
                .position(|q| q.model.id == id)
                .ok_or(GameSessionError::QuestionNotFound)?
        } else {
            let question = match self.status {
                GameSessionStatus::Leaderboard { idx } => idx + 1,
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
        self.status = GameSessionStatus::Question {
            idx: question,
            started,
            answers: 0,
            abort_handle,
        };

        let total_questions = quiz.questions.len();
        let question = Arc::new(DisplayQuestionMessage::new(
            &quiz.questions[question],
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

    pub async fn set_player_channel<T: Channel<PlayerMessage> + 'static>(
        &mut self,
        id: Uuid,
        channel: T,
    ) -> Result<(), GameSessionError> {
        if !matches!(self.status, GameSessionStatus::Waiting) {
            return Err(GameSessionError::AlreadyStarted);
        }
        match Self::get_player_mut(&mut self.players, id) {
            Some(player) => {
                let old_channel = std::mem::replace(&mut player.channel, Box::new(channel));
                old_channel.close().await;
            }
            None => {
                let player = GameSessionPlayer {
                    id,
                    name: None,
                    emoji: None,
                    channel: Box::new(channel),
                    points: 0,
                    last_question: None,
                };
                self.players.push(player);
            }
        }

        Ok(())
    }

    pub async fn handle_player_cmd(
        &mut self,
        cmd: Command<PlayerCommand>,
        _arc: Arc<Mutex<Self>>,
        id: Uuid,
    ) {
        match cmd.command {
            PlayerCommand::Pong { .. } => (),
            PlayerCommand::SetName { name, emoji } => {
                let mut name_in_use = false;
                let mut this_player = None;
                for player in self.players.iter_mut() {
                    if player.name.as_ref() == Some(&name) && player.id != id {
                        name_in_use = true;

                        if this_player.is_some() {
                            break;
                        }
                    }

                    if player.id == id {
                        this_player = Some(player);

                        if name_in_use {
                            break;
                        }
                    }
                }

                if let Some(player) = this_player {
                    if name_in_use {
                        player
                            .error(cmd.id, GameSessionError::NameAlreadyTaken)
                            .await;
                    } else {
                        let has_name = player.name.is_some();
                        if let Some(emoji) = emoji {
                            player.emoji = emojis::get(&emoji);
                            if player.emoji.is_none() {
                                player.error(cmd.id, GameSessionError::InvalidEmoji).await;
                                return;
                            }
                        } else {
                            player.emoji = None;
                        }
                        player.name = Some(name.clone());
                        if has_name {
                            self.host
                                .msg(Message::from(&HostMessage::RenamePlayer {
                                    id,
                                    name,
                                    emoji: player.emoji,
                                }))
                                .await
                        } else {
                            self.host
                                .msg(Message::from(&HostMessage::AddPlayer {
                                    id,
                                    name,
                                    emoji: player.emoji,
                                }))
                                .await
                        }
                        player.ok(cmd.id).await;
                    }
                }
            }
            PlayerCommand::AnswerQuestion { answer } => {
                let Some(player) = Self::get_player_mut(&mut self.players, id) else {
                    return;
                };
                if matches!(self.status, GameSessionStatus::Leaderboard { .. }) {
                    player.error(cmd.id, GameSessionError::TimeUp).await;
                    return;
                }
                let GameSessionStatus::Question {
                    idx,
                    started,
                    answers,
                    abort_handle,
                } = &mut self.status
                else {
                    player
                        .error(cmd.id, GameSessionError::NoCurrentQuestion)
                        .await;
                    return;
                };
                let Some(quiz) = &self.quiz else {
                    player.error(cmd.id, GameSessionError::QuizMissing).await;
                    return;
                };
                let question = &quiz.questions[*idx];

                let mut points = match question.options.get_points(&answer) {
                    Ok(points) => points,
                    Err(err) => {
                        player.error(cmd.id, err).await;
                        return;
                    }
                };

                if let Some(duration) = question.model.r#type.default_answer_duration() {
                    let elapsed = (Utc::now() - *started).num_milliseconds() as f64;
                    let max_time = (duration as f64) * 1000f64;
                    if elapsed <= max_time {
                        let factor = ((max_time - elapsed) / max_time) + 0.1;
                        points = (points as f64 * factor.min(1.0)) as u32;
                    } else {
                        points = 0;
                    }
                }

                match player.add_points(points, question.model.id) {
                    Ok(_) => {
                        player.ok(cmd.id).await;
                        *answers += 1;
                        if *answers == self.players.len() {
                            if let Some(handle) = abort_handle {
                                handle.abort();
                            }
                            self.end_question(None).await;
                        }
                    }
                    Err(err) => player.error(cmd.id, err).await,
                }
            }
        }
    }

    pub fn get_player_mut(
        players: &mut [GameSessionPlayer],
        id: Uuid,
    ) -> Option<&mut GameSessionPlayer> {
        players.iter_mut().find(|v| v.id == id)
    }

    pub async fn notify_all_players(&mut self, msg: Message<'_, PlayerMessage>) {
        let iterator = self
            .players
            .iter_mut()
            .map(|player| player.msg(msg.clone()));
        execute_futures(iterator).await
    }

    pub async fn end_question(&mut self, is_final: Option<bool>) {
        let GameSessionStatus::Question { idx, .. } = &self.status else {
            return;
        };
        let Some(quiz) = &self.quiz else {
            return;
        };

        let is_final = is_final.unwrap_or(*idx + 1 >= quiz.questions.len());
        let question = &quiz.questions[*idx];
        let correct_answers = Arc::new(question.options.correct_answer_list());

        let mut leaderboard = Vec::with_capacity(self.players.len());

        let iterator = self.players.iter_mut().filter_map(|player| {
            let points = player.apply_points(question.model.id);
            // a player without name isn't joined
            player.name.clone().map(|name| {
                leaderboard.push(LeaderboardEntry {
                    id: player.id,
                    name,
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
            })
        });
        execute_futures(iterator).await;

        leaderboard.sort();
        self.status = GameSessionStatus::Leaderboard { idx: *idx };

        let leaderboard = Arc::new(leaderboard);
        self.host
            .msg(Message::from(&HostMessage::DisplayLeaderboard {
                leaderboard: Arc::clone(&leaderboard),
                is_final,
            }))
            .await;

        if is_final {
            let player_iterator = self.players.iter_mut().map(|player| {
                let leaderboard = Arc::clone(&leaderboard);
                async move {
                    player
                        .msg(Message::from(&PlayerMessage::DisplayLeaderboard {
                            leaderboard,
                            is_final,
                        }))
                        .await;
                }
            });
            execute_futures(player_iterator).await;
        }
    }
}

impl GameSessionHost {
    pub async fn msg(&mut self, msg: Message<'_, HostMessage>) {
        if let Some(channel) = &mut self.channel
            && let Err(err) = channel.send(msg).await
        {
            log::error!("notify host error: {err:?}");
        }
    }

    pub async fn ok(&mut self, id: Option<u64>) {
        if id.is_some() {
            self.msg(Message {
                id,
                msg: &HostMessage::Ok,
                timing: None,
            })
            .await;
        }
    }

    pub async fn error(&mut self, id: Option<u64>, err: impl Into<Error>) {
        if id.is_some() {
            self.msg(Message {
                id,
                msg: &HostMessage::Error(err.into().into()),
                timing: None,
            })
            .await;
        }
    }
}

impl GameSessionPlayer {
    pub async fn msg(&mut self, msg: Message<'_, PlayerMessage>) {
        if let Err(err) = self.channel.send(msg).await {
            log::error!("failed to send message to player {}: {err:?}", self.id)
        }
    }

    pub async fn ok(&mut self, id: Option<u64>) {
        if id.is_some() {
            self.msg(Message {
                id,
                msg: &PlayerMessage::Ok,
                timing: None,
            })
            .await;
        }
    }

    pub async fn error(&mut self, id: Option<u64>, err: impl Into<Error>) {
        if id.is_some() {
            self.msg(Message {
                id,
                msg: &PlayerMessage::Error(err.into().into()),
                timing: None,
            })
            .await;
        }
    }

    pub fn add_points(&mut self, points: u32, question: Uuid) -> Result<(), GameSessionError> {
        if let Some((_, uuid)) = self.last_question
            && uuid == question
        {
            return Err(GameSessionError::AlreadyAnswered);
        }
        self.last_question = Some((points, question));
        Ok(())
    }

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
    pub fn get_points(&self, answer: &[Uuid]) -> Result<u32, GameSessionError> {
        let total_points = 1000;
        match self {
            QuestionOptions::Slide => Err(GameSessionError::CannotAnswer),
            QuestionOptions::SingleChoice(models) => {
                if answer.len() != 1 {
                    return Err(GameSessionError::InvalidAnswerCount);
                }
                match models.iter().find(|x| x.id == answer[0]) {
                    Some(answer) if answer.correct => Ok(total_points),
                    Some(_) => Ok(0),
                    None => Err(GameSessionError::InvalidAnswer),
                }
            }
            QuestionOptions::MultipleChoice(models) => {
                let points_per_option = (total_points / models.len() as u32) as i32;
                for id in answer {
                    if !models.iter().any(|x| x.id == *id) {
                        return Err(GameSessionError::InvalidAnswer);
                    }
                }
                let mut points: i32 = 0;
                for option in models {
                    if option.correct == answer.contains(&option.id) {
                        points += points_per_option
                    } else {
                        points -= points_per_option
                    }
                }
                Ok(points.max(0) as u32)
            }
            QuestionOptions::Order(models) => {
                let points_per_option = total_points / (models.len() - 1) as u32;
                if models.len() != answer.len() || answer.len() < 2 {
                    return Err(GameSessionError::InvalidAnswerCount);
                }
                let mut points = 0;
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
                        points += points_per_option;
                    }
                }
                Ok(points)
            }
        }
    }

    pub fn correct_answer_list(&self) -> Vec<Uuid> {
        match self {
            QuestionOptions::Slide => Vec::new(),
            QuestionOptions::SingleChoice(models) | QuestionOptions::MultipleChoice(models) => {
                models.iter().filter(|x| x.correct).map(|x| x.id).collect()
            }
            QuestionOptions::Order(models) => models.iter().map(|x| x.id).collect(),
        }
    }
}

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
