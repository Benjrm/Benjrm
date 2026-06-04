use {
    crate::{
        auth::User,
        error::Error,
        game_session::{
            Channel, GameSession, GameSessionError, GameSessionStatus, GameSessions, HostMessage,
            Message,
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
        host: &User,
        quiz: Option<Uuid>,
    ) -> Result<(u32, Arc<Mutex<GameSession>>), Error> {
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
                let new_code: u32 = rng.random_range(0..=9999_9999);
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
            quiz,
        };

        let game = Arc::new(Mutex::new(game));
        sessions.insert(code, Arc::clone(&game));

        Ok((code, game))
    }

    pub async fn get_session(
        &self,
        code: u32,
    ) -> Result<Arc<Mutex<GameSession>>, GameSessionError> {
        let map = self.sessions.read().await;
        if let Some(game) = map.get(&code) {
            Ok(Arc::clone(game))
        } else {
            Err(GameSessionError::InvalidCode)
        }
    }

    pub async fn delete_session(&self, user: &User, code: u32) -> Result<(), GameSessionError> {
        let mut sessions = self.sessions.write().await;
        let session = match sessions.get(&code) {
            Some(session) => Arc::clone(session),
            None => return Err(GameSessionError::InvalidCode),
        };

        let mut session = session.lock().await;
        if session.host.id != user.id {
            return Err(GameSessionError::Forbidden);
        }

        session.close().await;
        sessions.remove(&code);
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
        if self.host.id != user.id {
            return Err(GameSessionError::Forbidden);
        }
        Ok(())
    }

    pub async fn set_host_channel<T: Channel<HostMessage> + 'static>(
        &mut self,
        user: &User,
        channel: T,
    ) -> Result<(), GameSessionError> {
        let channel = Box::new(channel);
        match self.check_set_host_channel(user) {
            Ok(_) => (),
            Err(err) => {
                channel.close().await;
                return Err(err);
            }
        }
        self.host.channel = Some(channel);
        Ok(())
    }

    pub async fn notify_host(&mut self, msg: Message<HostMessage>) {
        #[allow(clippy::collapsible_if)]
        if let Some(channel) = &mut self.host.channel {
            if let Err(err) = channel.send(msg).await {
                log::error!("notify host error: {err:?}");
            }
        }
    }
}
