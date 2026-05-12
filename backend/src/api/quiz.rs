use {
    crate::{
        AppData,
        api::DUMMY_USER_UUID,
        core::{Result, quiz},
    },
    actix_web::{HttpResponse, delete, get, patch, post, put, web},
    uuid::Uuid,
};

#[post("/quizzes")]
async fn create_one(
    quiz: web::Json<quiz::NewQuiz>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse> {
    let model = quiz::create_one(&app_data.db, *DUMMY_USER_UUID, quiz.into_inner()).await?;
    Ok(HttpResponse::Created().json(model))
}

#[put("/quizzes")]
async fn create_many(
    new_quizzes: web::Json<Vec<quiz::NewQuiz>>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse> {
    let models = quiz::create_many(
        &app_data.db,
        *DUMMY_USER_UUID,
        new_quizzes.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Created().json(models))
}

#[get("/quizzes")]
async fn get_many(
    app_data: web::Data<AppData>,
    filter: web::Query<quiz::QuizFilter>,
) -> Result<HttpResponse> {
    let quizzes =
        quiz::get_many(&app_data.db, *DUMMY_USER_UUID, filter.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quizzes))
}

#[get("/quizzes/{id}")]
async fn get_one(id: web::Path<Uuid>, app_data: web::Data<AppData>) -> Result<HttpResponse> {
    let quiz = quiz::get_one(&app_data.db, *DUMMY_USER_UUID, id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quiz))
}

#[patch("/quizzes/{id}")]
async fn patch(
    id: web::Path<Uuid>,
    quiz: web::Json<quiz::PatchQuiz>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse> {
    let model = quiz::patch(
        &app_data.db,
        *DUMMY_USER_UUID,
        id.into_inner(),
        quiz.into_inner(),
    )
    .await?;
    Ok(HttpResponse::Ok().json(model))
}

#[delete("/quizzes/{id}")]
async fn delete(id: web::Path<Uuid>, app_data: web::Data<AppData>) -> Result<HttpResponse> {
    quiz::delete(&app_data.db, *DUMMY_USER_UUID, id.into_inner()).await?;
    Ok(HttpResponse::NoContent().finish())
}

pub(super) fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(create_one);
    cfg.service(create_many);
    cfg.service(get_many);
    cfg.service(get_one);
    cfg.service(patch);
    cfg.service(delete);
}
