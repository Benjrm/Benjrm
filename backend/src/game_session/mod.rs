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
    tokio::{
        sync::{Mutex, RwLock},
        task::JoinHandle,
    },
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
        #[error("Command not allowed")]
        CommandNotAllowed = BAD_REQUEST,
        #[error("Invalid player secret")]
        InvalidPlayerSecret = FORBIDDEN,
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
        #[error("Question already answered")]
        AlreadyAnswered = BAD_GATEWAY,
        #[error("Invalid answer count")]
        InvalidAnswerCount = BAD_REQUEST,
        #[error("Question can't be answered")]
        CannotAnswer = BAD_REQUEST,
        #[error("Answer does not belong to this question")]
        InvalidAnswer = BAD_REQUEST,
        #[error("Time to answer is up")]
        TimeUp = BAD_REQUEST,
        #[error("No question to answer")]
        NoCurrentQuestion = BAD_REQUEST,
        #[error("No question left")]
        NoQuestionLeft = BAD_REQUEST,
        #[error("Quiz has no questions")]
        NoQuestions = BAD_REQUEST,
        #[error("No leaderboard to show")]
        NoLeaderboard = BAD_REQUEST,
    }
}

pub struct GameSessions {
    sessions: Arc<RwLock<HashMap<SessionCode, Arc<Mutex<GameSession>>>>>,
}

impl Clone for GameSessions {
    fn clone(&self) -> Self {
        Self {
            sessions: Arc::clone(&self.sessions),
        }
    }
}

pub struct GameSession {
    status: GameSessionStatus,
    host: GameSessionHost,
    players: Vec<GameSessionPlayer>,
    quiz: Option<Arc<Quiz<Question>>>,
}

#[derive(Debug)]
pub enum GameSessionStatus {
    Waiting(Vec<Box<dyn Joining>>),
    Started,
    Question {
        idx: usize,
        started: DateTime<Utc>,
        answers: usize,
        /// This field behaves a bit different depending on the question type.
        ///
        /// # SingleChoice and MultipleChoice
        /// This list has one entry for each answer option. Each entry is a counter of how many players have selected this option.
        ///
        /// # Order
        /// The list has as many entries as there are answer options.
        /// The index represents the count of correct option relationships (two options in the correct order) and the entry is a counter of how many players had this count of correct options.
        answer_distribution: Vec<usize>,
        abort_handle: Option<JoinHandle<()>>,
        leaderboard: Option<Arc<Vec<LeaderboardEntry>>>,
    },
    Leaderboard {
        idx: usize,
        statistics: Option<Arc<AnswerStatistics>>,
        leaderboard: Arc<Vec<LeaderboardEntry>>,
        is_final: bool,
    },
    Podium(Arc<Vec<LeaderboardEntry>>),
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

pub struct GameSessionPlayer {
    id: Uuid,
    secret: Uuid,
    name: String,
    emoji: Option<&'static Emoji>,
    channel: Box<dyn Channel<PlayerMessage>>,
    points: u32,
    last_question: Option<(u32, Uuid)>,
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

#[async_trait::async_trait]
pub trait Joining: Debug + Send {
    /// Cancel joining (i.e. kick player).
    async fn cancel(self: Box<Self>);
    fn id(&self) -> u64;
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

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Command<T> {
    pub id: Option<u64>,
    #[serde(flatten)]
    pub command: T,
}

pub trait CommandTrait: Sized {
    fn parse_json(data: &[u8]) -> Result<Self, serde_json::Error>;
    fn pong(&self) -> Option<(u32, DateTime<Utc>)>;
    fn id(&self) -> Option<u64>;
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
pub enum HostMessage {
    Ok,
    Error(ErrorResponse),
    AddPlayer(Player),
    RenamePlayer(Player),
    #[serde(rename_all = "camelCase")]
    RemovePlayer {
        id: Uuid,
    },
    #[serde(rename_all = "camelCase")]
    SetPlayers {
        players: Vec<Player>,
    },
    DisplayQuestion(Arc<DisplayQuestionMessage>),
    #[serde(rename_all = "camelCase")]
    DisplayLeaderboard {
        leaderboard: Arc<Vec<LeaderboardEntry>>,
        is_final: bool,
    },
    DisplayPodium,
    ShowStatistics(Arc<AnswerStatistics>),
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Player {
    pub id: Uuid,
    pub name: String,
    pub emoji: Option<&'static Emoji>,
}

impl From<&GameSessionPlayer> for Player {
    fn from(value: &GameSessionPlayer) -> Self {
        Self {
            id: value.id,
            name: value.name.clone(),
            emoji: value.emoji,
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LeaderboardEntry {
    pub id: Uuid,
    pub name: String,
    pub emoji: Option<&'static Emoji>,
    pub total_points: u32,
    pub points: u32,
}

impl PartialEq for LeaderboardEntry {
    fn eq(&self, other: &Self) -> bool {
        self.total_points == other.total_points
    }
}

impl Eq for LeaderboardEntry {}

impl Ord for LeaderboardEntry {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        other.total_points.cmp(&self.total_points)
    }
}

impl PartialOrd for LeaderboardEntry {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum AnswerStatistics {
    SingleChoice(ChoiceStatistics),
    MultipleChoice(ChoiceStatistics),
    Order(OrderStatistics),
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ChoiceStatistics {
    answers: usize,
    answer_statistic: Vec<AnswerStatistic>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderStatistics {
    answers: usize,
    correct: Vec<Uuid>,
    answer_statistic: Vec<usize>,
}

#[derive(Debug, Clone, Serialize)]
pub struct AnswerStatistic {
    pub option: Uuid,
    pub votes: usize,
    pub correct: bool,
}

#[derive(Debug, Clone, Deserialize)]
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
    ShowPodium,
    EndGame,
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

    fn id(&self) -> Option<u64> {
        self.id
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "command", content = "payload", rename_all = "camelCase")]
pub enum PlayerMessage {
    Ok,
    Error(ErrorResponse),
    Kick,
    #[serde(rename_all = "camelCase")]
    ConnectResponse {
        id: Uuid,
        secret: Uuid,
        name: String,
        emoji: Option<&'static Emoji>,
    },
    Start,
    GameEnded,
    DisplayQuestion(Arc<DisplayQuestionMessage>),
    #[serde(rename_all = "camelCase")]
    QuestionResult {
        question: Uuid,
        correct_answers: Arc<Vec<Uuid>>,
        points: u32,
        total_points: u32,
    },
    #[serde(rename_all = "camelCase")]
    DisplayLeaderboard {
        leaderboard: Arc<Vec<LeaderboardEntry>>,
        is_final: bool,
    },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(
    tag = "command",
    content = "payload",
    rename_all = "camelCase",
    deny_unknown_fields
)]
pub enum PlayerCommand {
    Pong { id: u32, timestamp: DateTime<Utc> },
    SetName { name: String, emoji: Option<String> },
    Reconnect { id: Uuid, secret: Uuid },
    AnswerQuestion { answer: Vec<Uuid> },
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

    fn id(&self) -> Option<u64> {
        self.id
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
    index: usize,
    total_questions: usize,
}

impl DisplayQuestionMessage {
    pub fn new(value: &Question, index: usize, total_questions: usize) -> Self {
        Self {
            id: value.model.id,
            question: value.model.question.clone(),
            options: DisplayQuestionOptions::from(&value.options),
            seconds: value.model.r#type.default_answer_duration(),
            index,
            total_questions,
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
    id: Uuid,
    answer: String,
}

impl From<&AnswerChoiceModel> for AnswerOption {
    fn from(value: &AnswerChoiceModel) -> Self {
        Self {
            id: value.id,
            answer: value.answer.clone(),
        }
    }
}

impl From<&AnswerOrderModel> for AnswerOption {
    fn from(value: &AnswerOrderModel) -> Self {
        Self {
            id: value.id,
            answer: value.answer.clone(),
        }
    }
}
