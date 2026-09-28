use {
    crate::{
        app_data::AppDataTrait,
        game_session::{
            AnswerStatistics, GameSession, GameSessionError, LeaderboardEntry, SessionCode,
        },
    },
    chrono::{DateTime, Utc},
    emojis::Emoji,
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
            let json = &serde_json::json!(&event);
            if let Some(reqwest) = &self.shadow {
                let res = reqwest
                    .post(format!("http://localhost:80/_api/v1/event/{code}")) // TODO: Select a node that makes sense
                    .json(json)
                    .send()
                    .await
                    .unwrap();

                if !res.status().is_success() {
                    match res.text().await {
                        Ok(err) => {
                            log::error!("Error syncing shadow: {err:?}");
                            log::error!("Json was: {json}");
                        }
                        Err(err) => log::error!("Unable to read syncing error: {err:?}"),
                    }

                    #[cfg(not(debug_assertions))]
                    {
                        if !matches!(event, ShadowEvent::Init { .. }) {
                            log::warn!("Retransmitting full session: {}", self.code);

                            match self
                                .shadow_event(
                                    ShadowEvent::Init {
                                        session: unsafe { self.clone_unsafe() },
                                    },
                                    self.code,
                                )
                                .await
                            {
                                Ok(_) => {
                                    log::info!("Session sync error recovered!")
                                }
                                Err(err) => {
                                    log::error!("Can't recover from session sync error: {err:?}")
                                }
                            }
                        } else {
                            log::error!("Can't recover from session sync error...")
                        }
                    }
                }
            }
            Ok(())
        };
        Box::pin(future)
    }

    pub async fn restore(
        code: SessionCode,
        app_data: Arc<impl AppDataTrait>,
        reqwest: Arc<reqwest::Client>,
    ) -> Result<(), GameSessionError> {
        let shadow = {
            let mut shadow_sessions = app_data.shadow_sessions().sessions.write().await;
            let Some(shadow) = shadow_sessions.remove(&code) else {
                return Err(GameSessionError::ShadowNotFound);
            };

            shadow
        };

        {
            let mut shadow = shadow.lock().await;
            shadow.shadow = Some(reqwest);

            shadow
                .shadow_event(
                    ShadowEvent::Init {
                        session: unsafe { shadow.clone_unsafe() },
                    },
                    code,
                )
                .await?;
        }

        let mut sessions = app_data.game_sessions().sessions.write().await;
        if let Some(session) = sessions.insert(code, shadow) {
            log::info!("Replacing session {code} with a shadow session! Closing the old one...");
            session.lock().await.close().await;
        }

        Ok(())
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
