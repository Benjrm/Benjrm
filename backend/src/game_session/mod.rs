use {
    crate::{
        auth::User, error::impl_err, game_session::api::ws::WsChannelError, question::Question,
        quiz::Quiz,
    },
    chrono::{DateTime, Utc},
    serde::{Deserialize, Serialize},
    std::{
        collections::HashMap,
        fmt::Debug,
        sync::{
            Arc,
            atomic::{AtomicU64, Ordering},
        },
    },
    tokio::sync::{Mutex, RwLock},
    uuid::Uuid,
};

mod api;
mod core;
#[cfg(test)]
mod test;

pub use api::init;

impl_err! {
    enum GameSessionError {
        #[error("Invalid code")]
        InvalidCode = NOT_FOUND,
        #[error("Can't generate a game code")]
        CannotGenerateCode = INTERNAL_SERVER_ERROR,
        #[error("Forbidden")]
        Forbidden = FORBIDDEN,
    }
}

pub struct GameSessions {
    sessions: RwLock<HashMap<u32, Arc<Mutex<GameSession>>>>,
}

pub struct GameSession {
    status: GameSessionStatus,
    host: GameSessionHost,
    quiz: Option<Arc<Quiz<Question>>>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum GameSessionStatus {
    Waiting,
    Closed,
}

pub struct GameSessionHost {
    id: Uuid,
    channel: Option<Box<dyn Channel<HostMessage>>>,
}

impl From<&User> for GameSessionHost {
    fn from(value: &User) -> Self {
        Self {
            id: value.id,
            channel: None,
        }
    }
}

#[async_trait::async_trait]
pub trait Channel<Msg: Serialize>: Send {
    async fn send(&mut self, msg: Message<Msg>) -> Result<(), ChannelError>;
    async fn close(self: Box<Self>);
    fn id(&self) -> u64;

    fn generate_id() -> u64
    where
        Self: Sized,
    {
        static ID_SOURCE: AtomicU64 = AtomicU64::new(0);
        ID_SOURCE.fetch_add(1, Ordering::Relaxed)
    }
}

#[derive(Debug)]
pub enum ChannelError {
    Ws(WsChannelError),
}

impl From<WsChannelError> for ChannelError {
    fn from(value: WsChannelError) -> Self {
        Self::Ws(value)
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Message<T: Serialize> {
    #[serde(flatten)]
    msg: T,
    timing: Option<DateTime<Utc>>,
}

impl<T: Serialize> From<T> for Message<T> {
    fn from(value: T) -> Self {
        Self {
            msg: value,
            timing: None,
        }
    }
}

pub trait Command: Sized {
    fn parse_json(data: &[u8]) -> Result<Self, serde_json::Error>;
    fn pong(&self) -> Option<(u32, DateTime<Utc>)>;
}

#[derive(Debug, Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
pub enum HostMessage {}

#[derive(Debug, Deserialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
pub enum HostCommand {
    Pong { id: u32, timestamp: DateTime<Utc> },
}

impl Command for HostCommand {
    fn parse_json(data: &[u8]) -> Result<Self, serde_json::Error> {
        serde_json::from_slice(data)
    }

    fn pong(&self) -> Option<(u32, DateTime<Utc>)> {
        match self {
            Self::Pong { id, timestamp } => Some((*id, *timestamp)),
        }
    }
}
