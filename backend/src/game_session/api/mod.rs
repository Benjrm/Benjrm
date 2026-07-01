use {
    crate::game_session::{GameSession, SessionCode},
    serde::{Deserialize, Serialize},
    uuid::Uuid,
};

mod rest;
pub mod ws;

/// A struct representing the payload for creating a new game session.
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct NewSession {
    /// If provided, the new game session will be associated with the specified quiz.
    quiz: Option<Uuid>,
}

/// A struct representing the data sent to the client when a game session is created.
#[derive(Serialize)]
pub struct GameSessionDto {
    code: SessionCode,
    quiz: Option<Uuid>,
}

impl GameSession {
    /// Converts the [`GameSession`] into a [`GameSessionDto`] for sending to the client.
    pub fn to_dto(&self, code: SessionCode) -> GameSessionDto {
        GameSessionDto {
            code,
            quiz: self.quiz.as_ref().map(|x| x.model.id),
        }
    }
}

/// Initializes the REST and WebSocket routes for the game session API.
pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.configure(rest::init);
    cfg.configure(ws::init);
}
