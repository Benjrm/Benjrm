use {
    crate::{
        auth::User,
        error::Error,
        game_session::{
            Channel, Command, GameSession, GameSessionError, GameSessionHost, GameSessionPlayer,
            GameSessionStatus, GameSessions, HostCommand, HostMessage, Message, PlayerCommand,
            PlayerMessage, SessionCode,
        },
        question::{Question, QuestionFilter},
        quiz::Quiz,
    },
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
                    let player = self.players.swap_remove(pos);
                    player.channel.close().await;
                    if player.name.is_some() {
                        self.host.ok(cmd.id).await;
                        self.host
                            .msg(HostMessage::RemovePlayer { id: player.id }.into())
                            .await;
                    }
                } else {
                    self.host
                        .error(cmd.id, GameSessionError::PlayerNotFound)
                        .await;
                }
            }
        }
    }

    pub async fn set_player_channel<T: Channel<PlayerMessage> + 'static>(
        &mut self,
        id: Uuid,
        channel: T,
    ) {
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
                                .msg(
                                    HostMessage::RenamePlayer {
                                        id,
                                        name,
                                        emoji: player.emoji,
                                    }
                                    .into(),
                                )
                                .await
                        } else {
                            self.host
                                .msg(
                                    HostMessage::AddPlayer {
                                        id,
                                        name,
                                        emoji: player.emoji,
                                    }
                                    .into(),
                                )
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
}

impl GameSessionHost {
    pub async fn msg(&mut self, msg: Message<HostMessage>) {
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
                msg: HostMessage::Ok,
                timing: None,
            })
            .await;
        }
    }

    pub async fn error(&mut self, id: Option<u64>, err: impl Into<Error>) {
        if id.is_some() {
            self.msg(Message {
                id,
                msg: HostMessage::Error(err.into().into()),
                timing: None,
            })
            .await;
        }
    }
}

impl GameSessionPlayer {
    pub async fn msg(&mut self, msg: Message<PlayerMessage>) {
        if let Err(err) = self.channel.send(msg).await {
            log::error!("failed to send message to player {}: {err:?}", self.id)
        }
    }

    pub async fn ok(&mut self, id: Option<u64>) {
        if id.is_some() {
            self.msg(Message {
                id,
                msg: PlayerMessage::Ok,
                timing: None,
            })
            .await;
        }
    }

    pub async fn error(&mut self, id: Option<u64>, err: impl Into<Error>) {
        if id.is_some() {
            self.msg(Message {
                id,
                msg: PlayerMessage::Error(err.into().into()),
                timing: None,
            })
            .await;
        }
    }
}
