use {
    crate::game_session::{GameSession, GameSessionError, LeaderboardEntry, SessionCode},
    chrono::{DateTime, Utc},
    emojis::Emoji,
    reqwest::StatusCode,
    serde::{Deserialize, Serialize},
    std::{pin::Pin, sync::Arc},
    uuid::Uuid,
};

pub mod api;

impl GameSession {
    pub fn shadow_event(
        &self,
        event: ShadowEvent,
        code: SessionCode,
    ) -> Pin<Box<impl Future<Output = Result<(), GameSessionError>>>> {
        let future = async move {
            if let Some(reqwest) = &self.shadow {
                let res = reqwest
                    .post(format!("http://localhost:80/_api/v1/event/{code}")) // TODO: Select a node that makes sense
                    .json(&serde_json::json!(&event))
                    .send()
                    .await
                    .unwrap();

                if !matches!(res.status(), StatusCode::OK) {
                    log::warn!("Retransmitting full session: {}", self.code);
                    if !matches!(event, ShadowEvent::Init { .. })
                        && let Err(err) = self
                            .shadow_event(
                                ShadowEvent::Init {
                                    session: unsafe { self.clone_unsafe() },
                                },
                                self.code,
                            )
                            .await
                    {
                        log::error!("Can't sync with shadow... : {err:?}");
                    }
                }
            }
            Ok(())
        };
        Box::pin(future)
    }
}

#[derive(Serialize, Deserialize)]
pub enum ShadowEvent {
    Init {
        session: GameSession,
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
