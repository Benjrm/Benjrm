use {
    crate::{
        auth::User,
        game_session::{GameSession, GameSessionStatus, SessionCode},
    },
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
#[serde(rename_all = "camelCase")]
pub struct GameSessionDto {
    code: SessionCode,
    is_host: bool,
    started: bool,
    quiz: Option<Uuid>,
}

impl GameSession {
    /// Converts the [`GameSession`] into a [`GameSessionDto`] for sending to the client.
    pub fn to_dto(&self, code: SessionCode, user: Option<User>) -> GameSessionDto {
        let is_host = user.as_ref() == Some(&self.host.user);
        let quiz = match is_host {
            true => self.quiz.as_ref().map(|x| x.model.id),
            false => None,
        };
        GameSessionDto {
            code,
            is_host,
            started: !matches!(self.status, GameSessionStatus::Waiting(_)),
            quiz,
        }
    }
}

/// Initializes the REST and WebSocket routes for the game session API.
pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.configure(rest::init);
    cfg.configure(ws::init);
}
