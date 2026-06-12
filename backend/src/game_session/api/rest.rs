use {
    crate::{
        AppData,
        auth::User,
        error::Result,
        game_session::{GameSessionError, GameSessionPlayer, SessionCode, api::NewSession},
    },
    actix_web::{HttpResponse, web},
    emojis::Emoji,
    serde::Serialize,
    std::sync::Arc,
    uuid::Uuid,
};

async fn create_one(
    app_data: web::Data<AppData>,
    user: User,
    create: web::Json<NewSession>,
) -> Result<HttpResponse> {
    let (code, session) = app_data
        .game_sessions
        .create_session(&app_data.db, user, create.quiz)
        .await?;
    let session = session.lock().await;
    Ok(HttpResponse::Created().json(session.to_dto(code)))
}

async fn create_one_with_quiz(
    app_data: web::Data<AppData>,
    user: User,
    quiz: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let (code, session) = app_data
        .game_sessions
        .create_session(&app_data.db, user, Some(quiz.into_inner()))
        .await?;
    let session = session.lock().await;
    Ok(HttpResponse::Created().json(session.to_dto(code)))
}

async fn get_one(
    app_data: web::Data<AppData>,
    user: User,
    code: web::Path<SessionCode>,
) -> Result<HttpResponse> {
    let code = code.into_inner();
    let session = app_data.game_sessions.get_session(code).await?;

    let session = session.lock().await;
    if session.host.user != user {
        return Err(GameSessionError::Forbidden.into());
    }
    Ok(HttpResponse::Ok().json(session.to_dto(code)))
}

async fn get_one_with_quiz(
    app_data: web::Data<AppData>,
    user: User,
    path: web::Path<(Uuid, SessionCode)>,
) -> Result<HttpResponse> {
    let (quiz_id, code) = path.into_inner();
    let session = app_data.game_sessions.get_session(code).await?;

    let session = session.lock().await;
    match &session.quiz {
        Some(quiz) if quiz.model.id == quiz_id => (),
        _ => return Err(GameSessionError::InvalidCode.into()),
    }
    if session.host.user != user {
        return Err(GameSessionError::Forbidden.into());
    }
    Ok(HttpResponse::Ok().json(session.to_dto(code)))
}

async fn delete(
    app_data: web::Data<AppData>,
    user: User,
    code: web::Path<SessionCode>,
) -> Result<HttpResponse> {
    app_data
        .game_sessions
        .delete_session(&user, code.into_inner())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

async fn delete_with_quiz(
    app_data: web::Data<AppData>,
    user: User,
    path: web::Path<(Uuid, SessionCode)>,
) -> Result<HttpResponse> {
    let (quiz_id, code) = path.into_inner();
    let session = app_data.game_sessions.get_session(code).await?;

    let mut session = session.lock().await;
    match &session.quiz {
        Some(quiz) if quiz.model.id == quiz_id => (),
        _ => return Err(GameSessionError::InvalidCode.into()),
    }
    if session.host.user != user {
        return Err(GameSessionError::Forbidden.into());
    }
    app_data.game_sessions.drop_session(code).await;
    session.close().await;

    Ok(HttpResponse::NoContent().finish())
}

async fn get_quiz(
    app_data: web::Data<AppData>,
    user: User,
    code: web::Path<SessionCode>,
) -> Result<HttpResponse> {
    let session = app_data
        .game_sessions
        .get_session(code.into_inner())
        .await?;

    let session = session.lock().await;
    if session.host.user != user {
        return Err(GameSessionError::Forbidden.into());
    }

    match &session.quiz {
        Some(quiz) => Ok(HttpResponse::Ok().json(Arc::clone(quiz))),
        None => Ok(HttpResponse::NotFound().finish()),
    }
}

async fn get_quiz_with_quiz_id(
    app_data: web::Data<AppData>,
    user: User,
    path: web::Path<(Uuid, SessionCode)>,
) -> Result<HttpResponse> {
    let (quiz_id, code) = path.into_inner();
    let session = app_data.game_sessions.get_session(code).await?;

    let session = session.lock().await;
    match &session.quiz {
        Some(quiz) if quiz.model.id == quiz_id => (),
        _ => return Err(GameSessionError::InvalidCode.into()),
    }
    if session.host.user != user {
        return Err(GameSessionError::Forbidden.into());
    }

    match &session.quiz {
        Some(quiz) => Ok(HttpResponse::Ok().json(Arc::clone(quiz))),
        None => Ok(HttpResponse::NotFound().finish()),
    }
}

fn player_list_response(
    user: &User,
    host: &User,
    players: &[GameSessionPlayer],
) -> Result<HttpResponse> {
    if user != host {
        return Err(GameSessionError::Forbidden.into());
    }

    #[derive(Serialize)]
    struct Player {
        id: Uuid,
        name: String,
        emoji: Option<&'static Emoji>,
    }
    let mut res_players = Vec::new();
    for player in players {
        if let Some(name) = &player.name {
            res_players.push(Player {
                id: player.id,
                name: name.clone(),
                emoji: player.emoji,
            })
        }
    }
    Ok(HttpResponse::Ok().json(res_players))
}

async fn get_players(
    app_data: web::Data<AppData>,
    user: User,
    code: web::Path<SessionCode>,
) -> Result<HttpResponse> {
    let session = app_data
        .game_sessions
        .get_session(code.into_inner())
        .await?;

    let session = session.lock().await;
    player_list_response(&user, &session.host.user, &session.players)
}

async fn get_players_with_quiz(
    app_data: web::Data<AppData>,
    user: User,
    path: web::Path<(Uuid, SessionCode)>,
) -> Result<HttpResponse> {
    let (quiz_id, code) = path.into_inner();
    let session = app_data.game_sessions.get_session(code).await?;

    let session = session.lock().await;
    match &session.quiz {
        Some(quiz) if quiz.model.id == quiz_id => (),
        _ => return Err(GameSessionError::InvalidCode.into()),
    }
    player_list_response(&user, &session.host.user, &session.players)
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(web::resource("/sessions").route(web::post().to(create_one)));
    cfg.service(
        web::resource("/quizzes/{quiz}/sessions").route(web::post().to(create_one_with_quiz)),
    );
    cfg.service(
        web::resource("/sessions/{code}")
            .route(web::get().to(get_one))
            .route(web::delete().to(delete)),
    );
    cfg.service(
        web::resource("/quizzes/{quiz}/sessions/{code}")
            .route(web::get().to(get_one_with_quiz))
            .route(web::delete().to(delete_with_quiz)),
    );
    cfg.service(web::resource("/sessions/{code}/quiz").route(web::get().to(get_quiz)));
    cfg.service(
        web::resource("/quizzes/{quiz}/sessions/{code}/quiz")
            .route(web::get().to(get_quiz_with_quiz_id)),
    );
    cfg.service(web::resource("/sessions/{code}/players").route(web::get().to(get_players)));
    cfg.service(
        web::resource("/quizzes/{quiz}/sessions/{code}/players")
            .route(web::get().to(get_players_with_quiz)),
    );
}
