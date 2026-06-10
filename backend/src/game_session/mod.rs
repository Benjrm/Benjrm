use {
    crate::{
        auth::User,
        error::{ErrorResponse, impl_err},
        game_session::api::ws::WsChannelError,
        question::Question,
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

pub type SessionCode = u32;

impl_err! {
    enum GameSessionError {
        #[error("Invalid code")]
        InvalidCode = NOT_FOUND,
        #[error("Can't generate a game code")]
        CannotGenerateCode = INTERNAL_SERVER_ERROR,
        #[error("Forbidden")]
        Forbidden = FORBIDDEN,
        #[error("Name already taken")]
        NameAlreadyTaken = CONFLICT,
        #[error("Player not found")]
        PlayerNotFound = NOT_FOUND,
    }
}

pub struct GameSessions {
    sessions: RwLock<HashMap<SessionCode, Arc<Mutex<GameSession>>>>,
}

pub struct GameSession {
    status: GameSessionStatus,
    host: GameSessionHost,
    players: Vec<GameSessionPlayer>,
    quiz: Option<Arc<Quiz<Question>>>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum GameSessionStatus {
    Waiting,
    Closed,
}

pub struct GameSessionHost {
    user: User,
    channel: Option<Box<dyn Channel<HostMessage>>>,
}

impl From<User> for GameSessionHost {
    fn from(value: User) -> Self {
        Self {
            user: value,
            channel: None,
        }
    }
}

#[derive(Serialize)]
pub struct GameSessionPlayer {
    id: Uuid,
    name: Option<String>,
    #[serde(skip)]
    channel: Box<dyn Channel<PlayerMessage>>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<u64>,
    #[serde(flatten)]
    msg: T,
    #[serde(skip_serializing_if = "Option::is_none")]
    timing: Option<DateTime<Utc>>,
}

impl<T: Serialize> From<T> for Message<T> {
    fn from(value: T) -> Self {
        Self {
            id: None,
            msg: value,
            timing: None,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Command<T> {
    pub id: Option<u64>,
    #[serde(flatten)]
    pub command: T,
}

pub trait CommandTrait: Sized {
    fn parse_json(data: &[u8]) -> Result<Self, serde_json::Error>;
    fn pong(&self) -> Option<(u32, DateTime<Utc>)>;
}

#[derive(Debug, Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
pub enum HostMessage {
    Ok,
    Error(ErrorResponse),
    AddPlayer { id: Uuid, name: String },
    RenamePlayer { id: Uuid, name: String },
    RemovePlayer { id: Uuid },
}

#[derive(Debug, Deserialize)]
#[serde(
    tag = "command",
    content = "payload",
    rename_all = "camelCase",
    deny_unknown_fields
)]
pub enum HostCommand {
    Pong { id: u32, timestamp: DateTime<Utc> },
    KickPlayer { id: Uuid },
}

impl CommandTrait for Command<HostCommand> {
    fn parse_json(data: &[u8]) -> Result<Self, serde_json::Error> {
        serde_json::from_slice(data)
    }

    fn pong(&self) -> Option<(u32, DateTime<Utc>)> {
        match self.command {
            HostCommand::Pong { id, timestamp } => Some((id, timestamp)),
            _ => None,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
pub enum PlayerMessage {
    Ok,
    Error(ErrorResponse),
}

#[derive(Debug, Deserialize)]
#[serde(
    tag = "command",
    content = "payload",
    rename_all = "camelCase",
    deny_unknown_fields
)]
pub enum PlayerCommand {
    Pong { id: u32, timestamp: DateTime<Utc> },
    SetName { name: String },
}

impl CommandTrait for Command<PlayerCommand> {
    fn parse_json(data: &[u8]) -> Result<Self, serde_json::Error> {
        serde_json::from_slice(data)
    }

    fn pong(&self) -> Option<(u32, DateTime<Utc>)> {
        match self.command {
            PlayerCommand::Pong { id, timestamp } => Some((id, timestamp)),
            _ => None,
        }
    }
}
