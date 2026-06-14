use {
    crate::{
        auth::User,
        error::{ErrorResponse, impl_err},
        game_session::api::ws::WsChannelError,
        question::{
            Question, QuestionOptions,
            answer::{choice::entity::AnswerChoiceModel, order::AnswerOrderModel},
        },
        quiz::Quiz,
    },
    chrono::{DateTime, Utc},
    emojis::Emoji,
    rand::seq::SliceRandom,
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
        #[error("Invalid Emoji")]
        InvalidEmoji = BAD_REQUEST,
        #[error("Player not found")]
        PlayerNotFound = NOT_FOUND,
        #[error("Game session not started")]
        NotStarted = BAD_REQUEST,
        #[error("Game session already started")]
        AlreadyStarted = BAD_REQUEST,
        #[error("Quiz is missing")]
        QuizMissing = BAD_REQUEST,
        #[error("Question not found")]
        QuestionNotFound = NOT_FOUND,
        #[error("No players")]
        NoPlayers = BAD_REQUEST,
        #[error("Quiz already started")]
        SessionAlreadyStarted = BAD_REQUEST,
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
    Started,
    Question(usize),
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
    emoji: Option<&'static Emoji>,
    #[serde(skip)]
    channel: Box<dyn Channel<PlayerMessage>>,
}

#[async_trait::async_trait]
pub trait Channel<Msg: Serialize>: Send {
    async fn send(&mut self, msg: Message<'_, Msg>) -> Result<(), ChannelError>;
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Message<'a, T: Serialize> {
    #[serde(skip_serializing_if = "Option::is_none")]
    id: Option<u64>,
    #[serde(flatten)]
    msg: &'a T,
    #[serde(skip_serializing_if = "Option::is_none")]
    timing: Option<DateTime<Utc>>,
}

impl<T: Serialize> Clone for Message<'_, T> {
    fn clone(&self) -> Self {
        Self {
            id: self.id,
            msg: self.msg,
            timing: self.timing,
        }
    }
}

impl<'a, T: Serialize> From<&'a T> for Message<'a, T> {
    fn from(value: &'a T) -> Self {
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
    AddPlayer {
        id: Uuid,
        name: String,
        emoji: Option<&'static Emoji>,
    },
    RenamePlayer {
        id: Uuid,
        name: String,
        emoji: Option<&'static Emoji>,
    },
    RemovePlayer {
        id: Uuid,
    },
    DisplayQuestion(Arc<DisplayQuestionMessage>),
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
    Start,
    NextQuestion,
    ShowQuestion { id: Uuid },
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
    Kick,
    Start,
    DisplayQuestion(Arc<DisplayQuestionMessage>),
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
    SetName { name: String, emoji: Option<String> },
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DisplayQuestionMessage {
    id: Uuid,
    question: String,
    #[serde(flatten)]
    options: DisplayQuestionOptions,
    seconds: Option<u32>,
}

impl From<&Question> for DisplayQuestionMessage {
    fn from(value: &Question) -> Self {
        Self {
            id: value.model.id,
            question: value.model.question.clone(),
            options: DisplayQuestionOptions::from(&value.options),
            seconds: value.model.r#type.default_answer_duration(),
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "options", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DisplayQuestionOptions {
    Slide,
    SingleChoice(Vec<AnswerOption>),
    MultipleChoice(Vec<AnswerOption>),
    Order(Vec<AnswerOption>),
}

impl From<&QuestionOptions> for DisplayQuestionOptions {
    fn from(value: &QuestionOptions) -> Self {
        match value {
            QuestionOptions::Slide => Self::Slide,
            QuestionOptions::SingleChoice(models) => {
                Self::SingleChoice(models.iter().map(Into::into).collect())
            }
            QuestionOptions::MultipleChoice(models) => {
                Self::MultipleChoice(models.iter().map(Into::into).collect())
            }
            QuestionOptions::Order(models) => {
                let mut options: Vec<_> = models.iter().map(Into::into).collect();
                options.shuffle(&mut rand::rng());
                Self::Order(options)
            }
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AnswerOption {
    answer: String,
}

impl From<&AnswerChoiceModel> for AnswerOption {
    fn from(value: &AnswerChoiceModel) -> Self {
        Self {
            answer: value.answer.clone(),
        }
    }
}

impl From<&AnswerOrderModel> for AnswerOption {
    fn from(value: &AnswerOrderModel) -> Self {
        Self {
            answer: value.answer.clone(),
        }
    }
}
