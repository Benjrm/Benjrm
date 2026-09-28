use {
    crate::{
        AppData,
        app_data::AppDataTrait,
        game_session::{
            GameSession, GameSessionError, GameSessionPlayer, GameSessionStatus, SessionCode,
            shadow::ShadowEvent,
        },
    },
    actix_web::{HttpResponse, web},
    std::sync::Arc,
    tokio::sync::Mutex,
};

async fn handle_event(
    app_data: web::Data<AppData>,
    event: web::Json<ShadowEvent>,
    code: web::Path<SessionCode>,
) -> crate::error::Result<HttpResponse> {
    let event = event.into_inner();
    let code = code.into_inner();

    match event {
        ShadowEvent::Init { session } => {
            let mut sessions = app_data.shadow_sessions().sessions.write().await;
            if sessions.contains_key(&code) {
                log::error!("Session already exists, overwriting shadow session...")
            };

            sessions.insert(code, Arc::new(Mutex::new(session)));

            return Ok(HttpResponse::Ok().finish());
        }
        ShadowEvent::EndGame => {
            let mut sessions = app_data.shadow_sessions().sessions.write().await;
            if sessions.remove(&code).is_none() {
                log::warn!("Error while deleteing ShadowSession, session does not exist...");
            }
            return Ok(HttpResponse::Ok().finish());
        }
        _ => (),
    }

    let sessions = app_data.shadow_sessions().sessions.read().await;
    let Some(session) = sessions.get(&code) else {
        Err(GameSessionError::ShadowNotFound)?
    };

    let mut session = session.lock().await;

    match event {
        ShadowEvent::Init { .. } | ShadowEvent::EndGame => unreachable!(),
        ShadowEvent::KickPlayer { player } => {
            if let Some(player_index) = session.players.iter().position(|p| p.id == player) {
                session.players.swap_remove(player_index);
            };
        }
        ShadowEvent::StartQuiz => {
            session.status = GameSessionStatus::Started;
        }
        ShadowEvent::NextQuestion {
            question: idx,
            started,
            options_len,
            leaderboard,
        } => {
            session.status = GameSessionStatus::Question {
                idx,
                started,
                answers: 0,
                answer_distribution: vec![0; options_len],
                abort_handle: None,
                leaderboard,
            }
        }
        ShadowEvent::Leaderboard {
            idx,
            statistics,
            leaderboard,
            is_final,
        } => {
            session.status = GameSessionStatus::Leaderboard {
                idx,
                statistics: statistics.map(Arc::new),
                leaderboard: Arc::new(leaderboard),
                is_final,
            }
        }
        ShadowEvent::ShowPodium => {
            if let GameSessionStatus::Leaderboard { leaderboard, .. } = &session.status {
                session.status = GameSessionStatus::Podium(Arc::clone(leaderboard))
            } else {
                return Err(GameSessionError::ShadowInvalidSessionStatus)?;
            };
        }
        ShadowEvent::RenamePlayer {
            player,
            name,
            emoji,
        } => {
            if let Some(player) = session.players.iter_mut().find(|p| p.id == player) {
                player.name = name;
                player.emoji = emoji
            } else {
                Err(GameSessionError::PlayerNotFound)?
            }
        }
        ShadowEvent::PlayerAddPoints {
            player,
            points,
            question,
        } => {
            if let Some(player) = session.players.iter_mut().find(|p| p.id == player) {
                player.last_question = Some((points, question));
            } else {
                Err(GameSessionError::PlayerNotFound)?
            }
        }
        ShadowEvent::UpdateAnswers {
            answers: new_answers,
            distribution: new_distribution,
        } => {
            if let GameSessionStatus::Question {
                answers,
                answer_distribution,
                ..
            } = &mut session.status
            {
                *answers = new_answers;
                *answer_distribution = new_distribution;
            } else {
                Err(GameSessionError::ShadowInvalidSessionStatus)?
            }
        }
        ShadowEvent::AddPlayer {
            id,
            secret,
            name,
            emoji,
        } => {
            if session
                .players
                .iter()
                .find(|player| player.id == id)
                .is_none()
            {
                session.players.push(GameSessionPlayer {
                    id,
                    secret,
                    name,
                    emoji,
                    channel: None,
                    channel_id: 0,
                    points: 0,
                    last_question: None,
                });
            } else {
                Err(GameSessionError::ShadowPlayerAlreadyPresent)?
            }
        }
    }

    Ok(HttpResponse::Ok().finish())
}

async fn kill_restore(
    app_data: web::Data<AppData>,
    code: web::Path<SessionCode>,
    reqwest: web::Data<reqwest::Client>,
) -> crate::error::Result<HttpResponse> {
    GameSession::restore(
        code.into_inner(),
        app_data.into_inner(),
        reqwest.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().finish())
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/event/{code}").route(web::post().to(handle_event)));
    cfg.service(web::resource("/kill_restore/{code}").route(web::get().to(kill_restore)));
}
