use {
    crate::{
        auth::User,
        game_session::{
            AnswerStatistics, GameSession, GameSessionHost, GameSessionPlayer, GameSessionStatus,
            LeaderboardEntry, PlayableQuiz, SessionCode,
        },
    },
    chrono::{DateTime, Utc},
    emojis::Emoji,
    serde::{Deserialize, Serialize},
    std::sync::Arc,
    uuid::Uuid,
};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ShadowGameSession {
    pub status: ShadowGameSessionStatus,
    pub host: ShadowGameSessionHost,
    pub players: Vec<ShadowGameSessionPlayer>,
    pub quiz: Option<Arc<PlayableQuiz>>,
    pub code: SessionCode,
}

impl From<&GameSession> for ShadowGameSession {
    fn from(value: &GameSession) -> Self {
        Self {
            status: (&value.status).into(),
            host: (&value.host).into(),
            players: value
                .players
                .iter()
                .map(ShadowGameSessionPlayer::from)
                .collect(),
            quiz: value.quiz.clone(),
            code: value.code,
        }
    }
}

impl From<&ShadowGameSession> for GameSession {
    fn from(value: &ShadowGameSession) -> Self {
        Self {
            status: (&value.status).into(),
            host: (&value.host).into(),
            players: value.players.iter().map(GameSessionPlayer::from).collect(),
            quiz: value.quiz.clone(),
            code: value.code,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ShadowGameSessionPlayer {
    pub id: Uuid,
    pub secret: Uuid,
    pub name: String,
    pub emoji: Option<&'static Emoji>,
    pub points: u32,
    pub last_question: Option<(u32, Uuid)>,
}

impl From<&GameSessionPlayer> for ShadowGameSessionPlayer {
    fn from(value: &GameSessionPlayer) -> Self {
        Self {
            id: value.id,
            secret: value.secret,
            name: value.name.clone(),
            emoji: value.emoji,
            points: value.points,
            last_question: value.last_question,
        }
    }
}

impl From<&ShadowGameSessionPlayer> for GameSessionPlayer {
    fn from(value: &ShadowGameSessionPlayer) -> Self {
        Self {
            id: value.id,
            secret: value.secret,
            name: value.name.clone(),
            emoji: value.emoji,
            channel: None,
            channel_id: 0,
            points: value.points,
            last_question: value.last_question,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ShadowGameSessionHost {
    user: User,
}

impl From<&GameSessionHost> for ShadowGameSessionHost {
    fn from(value: &GameSessionHost) -> Self {
        Self {
            user: value.user.clone(),
        }
    }
}

impl From<&ShadowGameSessionHost> for GameSessionHost {
    fn from(value: &ShadowGameSessionHost) -> Self {
        Self {
            user: value.user.clone(),
            channel_id: 0,
            channel: None,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum ShadowGameSessionStatus {
    Waiting,
    Started,
    Question {
        idx: usize,
        started: DateTime<Utc>,
        answers: usize,
        answer_distribution: Vec<usize>,
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

impl From<&GameSessionStatus> for ShadowGameSessionStatus {
    fn from(value: &GameSessionStatus) -> Self {
        match value {
            GameSessionStatus::Waiting(_joinings) => ShadowGameSessionStatus::Waiting,
            GameSessionStatus::Started => ShadowGameSessionStatus::Started,
            GameSessionStatus::Question {
                idx,
                started,
                answers,
                answer_distribution,
                abort_handle: _abort_handle,
                leaderboard,
            } => ShadowGameSessionStatus::Question {
                idx: *idx,
                started: *started,
                answers: *answers,
                answer_distribution: answer_distribution.clone(),
                leaderboard: leaderboard.as_ref().map(Arc::clone),
            },
            GameSessionStatus::Leaderboard {
                idx,
                statistics,
                leaderboard,
                is_final,
            } => ShadowGameSessionStatus::Leaderboard {
                idx: *idx,
                statistics: statistics.as_ref().map(Arc::clone),
                leaderboard: Arc::clone(leaderboard),
                is_final: *is_final,
            },
            GameSessionStatus::Podium(items) => ShadowGameSessionStatus::Podium(Arc::clone(items)),
            GameSessionStatus::Closed => ShadowGameSessionStatus::Closed,
        }
    }
}

impl From<&ShadowGameSessionStatus> for GameSessionStatus {
    fn from(value: &ShadowGameSessionStatus) -> Self {
        match value {
            ShadowGameSessionStatus::Waiting => GameSessionStatus::Waiting(Vec::new()),
            ShadowGameSessionStatus::Started => GameSessionStatus::Started,
            ShadowGameSessionStatus::Question {
                idx,
                started,
                answers,
                answer_distribution,
                leaderboard,
            } => {
                GameSessionStatus::Question {
                    idx: *idx,
                    started: *started,
                    answers: *answers,
                    answer_distribution: answer_distribution.clone(),
                    abort_handle: None, // TODO: Start abort_handle
                    leaderboard: leaderboard.clone(),
                }
            }

            ShadowGameSessionStatus::Leaderboard {
                idx,
                statistics,
                leaderboard,
                is_final,
            } => GameSessionStatus::Leaderboard {
                idx: *idx,
                statistics: statistics.as_ref().map(Arc::clone),
                leaderboard: Arc::clone(leaderboard),
                is_final: *is_final,
            },
            ShadowGameSessionStatus::Podium(items) => GameSessionStatus::Podium(Arc::clone(items)),
            ShadowGameSessionStatus::Closed => GameSessionStatus::Closed,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum ShadowEvent {
    Init {
        session: ShadowGameSession,
    },
    KickPlayer {
        player: Uuid,
    },
    StartQuiz,
    NextQuestion {
        question: usize,
        started: DateTime<Utc>,
        options_len: usize,
        leaderboard: Option<Arc<Vec<LeaderboardEntry>>>,
    },
    Leaderboard {
        idx: usize,
        statistics: Option<AnswerStatistics>,
        leaderboard: Vec<LeaderboardEntry>,
        is_final: bool,
    },
    ShowPodium,
    EndGame,
    RenamePlayer {
        player: Uuid,
        name: String,
        emoji: Option<&'static Emoji>,
    },
    PlayerAddPoints {
        player: Uuid,
        points: u32,
        question: Uuid,
    },
    UpdateAnswers {
        answers: usize,
        distribution: Vec<usize>,
    },
    AddPlayer {
        id: Uuid,
        secret: Uuid,
        name: String,
        emoji: Option<&'static Emoji>,
    },
}
