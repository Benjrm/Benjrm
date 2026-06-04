use {
    crate::{
        AppData,
        auth::User,
        error::Result,
        game_session::{GameSessionError, api::NewSession},
    },
    actix_web::{HttpResponse, web},
    std::sync::Arc,
};

async fn create_one(
    app_data: web::Data<AppData>,
    user: User,
    create: web::Json<NewSession>,
) -> Result<HttpResponse> {
    let (code, session) = app_data
        .game_sessions
        .create_session(&app_data.db, &user, create.quiz)
        .await?;
    let session = session.lock().await;
    Ok(HttpResponse::Created().json(session.to_dto(code)))
}

async fn get_one(
    app_data: web::Data<AppData>,
    user: User,
    code: web::Path<u32>,
) -> Result<HttpResponse> {
    let code = code.into_inner();
    let session = app_data.game_sessions.get_session(code).await?;

    let session = session.lock().await;
    if session.host.id != user.id {
        return Err(GameSessionError::Forbidden.into());
    }
    Ok(HttpResponse::Ok().json(session.to_dto(code)))
}

async fn delete(
    app_data: web::Data<AppData>,
    user: User,
    code: web::Path<u32>,
) -> Result<HttpResponse> {
    app_data
        .game_sessions
        .delete_session(&user, code.into_inner())
        .await?;

    Ok(HttpResponse::NoContent().finish())
}

async fn get_quiz(
    app_data: web::Data<AppData>,
    user: User,
    code: web::Path<u32>,
) -> Result<HttpResponse> {
    let session = app_data
        .game_sessions
        .get_session(code.into_inner())
        .await?;

    let session = session.lock().await;
    if session.host.id != user.id {
        return Err(GameSessionError::Forbidden.into());
    }

    match &session.quiz {
        Some(quiz) => Ok(HttpResponse::Ok().json(Arc::clone(quiz))),
        None => Ok(HttpResponse::NotFound().finish()),
    }
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(web::resource("/sessions").route(web::post().to(create_one)));
    cfg.service(
        web::resource("/sessions/{code}")
            .route(web::get().to(get_one))
            .route(web::delete().to(delete)),
    );
    cfg.service(web::resource("/sessions/{code}/quiz").route(web::get().to(get_quiz)));
}
