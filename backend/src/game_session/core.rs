use {
    crate::{
        auth::User,
        error::Error,
        game_session::{
            Channel, Command, DisplayQuestionMessage, GameSession, GameSessionError,
            GameSessionHost, GameSessionPlayer, GameSessionStatus, GameSessions, HostCommand,
            HostMessage, Message, PlayerCommand, PlayerMessage, SessionCode,
        },
        question::{Question, QuestionFilter},
        quiz::Quiz,
    },
    chrono::{Duration, Utc},
    futures::{StreamExt, stream::FuturesUnordered},
    rand::RngExt,
    sea_orm::ConnectionTrait,
    std::{collections::HashMap, sync::Arc},
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
            let mut code = None;

            let mut rng = rand::rng();
            for _ in 0..10 {
                let new_code: SessionCode = rng.random_range(0..=9999_9999);
                if !sessions.contains_key(&new_code) {
                    code = Some(new_code);
                    break;
                }
            }

            code.ok_or(GameSessionError::CannotGenerateCode)?
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
        self.status == GameSessionStatus::Closed
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

    pub async fn handle_host_cmd(&mut self, cmd: Command<HostCommand>, _payload: SessionCode) {
        match cmd.command {
            HostCommand::Pong { .. } => (),
            HostCommand::KickPlayer { id } => {
                if let Some(pos) = self.players.iter().position(|v| v.id == id) {
                    let mut player = self.players.swap_remove(pos);
                    player.msg(Message::from(&PlayerMessage::Kick)).await;
                    player.channel.close().await;
                    if player.name.is_some() {
                        self.host
                            .msg(Message::from(&HostMessage::RemovePlayer { id: player.id }))
                            .await;
                    }
                    self.host.ok(cmd.id).await;
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

                    let quiz = self.quiz.as_ref().ok_or(GameSessionError::QuizMissing)?;

                    if quiz.questions.is_empty() {
                        return Err(GameSessionError::NoQuestions);
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

                let mut i = 0;
                while i < self.players.len() {
                    if self.players[i].name.is_none() {
                        let mut player = self.players.swap_remove(i);
                        player.msg(Message::from(&PlayerMessage::Kick)).await;
                        player.channel.close().await;
                    } else {
                        i += 1;
                    }
                }

                self.status = GameSessionStatus::Started;
                self.notify_all_players(Message::from(&PlayerMessage::Start))
                    .await;
                self.host.ok(cmd.id).await;
            }
            HostCommand::NextQuestion => match self.next_question(None).await {
                Ok(()) => self.host.ok(cmd.id).await,
                Err(err) => self.host.error(cmd.id, err).await,
            },
            HostCommand::ShowQuestion { id } => match self.next_question(Some(id)).await {
                Ok(()) => self.host.ok(cmd.id).await,
                Err(err) => self.host.error(cmd.id, err).await,
            },
        }
    }

    async fn next_question(&mut self, id: Option<Uuid>) -> Result<(), GameSessionError> {
        match self.status {
            GameSessionStatus::Closed => return Err(GameSessionError::InvalidCode),
            GameSessionStatus::Waiting => return Err(GameSessionError::NotStarted),
            GameSessionStatus::Started | GameSessionStatus::Question(_) => (),
        }

        let quiz = self.quiz.as_ref().ok_or(GameSessionError::QuizMissing)?;

        let question = if let Some(id) = id {
            quiz.questions
                .iter()
                .position(|q| q.model.id == id)
                .ok_or(GameSessionError::QuestionNotFound)?
        } else {
            let question = if let GameSessionStatus::Question(i) = self.status {
                i + 1
            } else {
                0
            };
            if question >= quiz.questions.len() {
                return Err(GameSessionError::QuestionNotFound);
            }
            question
        };
        self.status = GameSessionStatus::Question(question);

        let question = Arc::new(DisplayQuestionMessage::from(&quiz.questions[question]));
        let timing: Option<chrono::prelude::DateTime<Utc>> =
            Some(Utc::now() + Duration::seconds(3));

        self.host
            .msg(Message {
                id: None,
                msg: &HostMessage::DisplayQuestion(Arc::clone(&question)),
                timing,
            })
            .await;
        self.notify_all_players(Message {
            id: None,
            msg: &PlayerMessage::DisplayQuestion(question),
            timing,
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
        match self.get_player_mut(id) {
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
                };
                self.players.push(player);
            }
        }

        Ok(())
    }

    pub async fn handle_player_cmd(&mut self, cmd: Command<PlayerCommand>, id: Uuid) {
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
        }
    }

    pub fn get_player_mut(&mut self, id: Uuid) -> Option<&mut GameSessionPlayer> {
        self.players.iter_mut().find(|v| v.id == id)
    }

    pub async fn notify_all_players(&mut self, msg: Message<'_, PlayerMessage>) {
        let mut futures = FuturesUnordered::new();
        let mut iterator = self
            .players
            .iter_mut()
            .filter(|player| player.name.is_some())
            .map(|player| player.msg(msg.clone()));

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
}
