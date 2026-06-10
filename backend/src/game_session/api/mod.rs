use {
    crate::game_session::{GameSession, SessionCode},
    serde::{Deserialize, Serialize},
    uuid::Uuid,
};

mod rest;
pub mod ws;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct NewSession {
    quiz: Option<Uuid>,
}

#[derive(Serialize)]
pub struct GameSessionDto {
    code: SessionCode,
    quiz: Option<Uuid>,
}

impl GameSession {
    pub fn to_dto(&self, code: SessionCode) -> GameSessionDto {
        GameSessionDto {
            code,
            quiz: self.quiz.as_ref().map(|x| x.model.id),
        }
    }
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.configure(rest::init);
    cfg.configure(ws::init);
}
