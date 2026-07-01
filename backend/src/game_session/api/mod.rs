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

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct NewSession {
    quiz: Option<Uuid>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameSessionDto {
    code: SessionCode,
    is_host: bool,
    started: bool,
    quiz: Option<Uuid>,
}

impl GameSession {
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

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.configure(rest::init);
    cfg.configure(ws::init);
}
