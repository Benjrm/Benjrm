use {
    crate::{
        AppData,
        error::Result,
        quiz::{NewQuiz, QuizFilter, UpdateQuiz, entity::Quiz},
    },
    actix_web::{HttpResponse, delete, get, patch, post, put, web},
    uuid::Uuid,
};

#[post("/quizzes")]
async fn create_one(
    quiz: web::Json<NewQuiz>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse> {
    let quiz = Quiz::create(&app_data.db, app_data.dummy_user(), quiz.into_inner()).await?;
    Ok(HttpResponse::Created().json(quiz))
}

#[get("/quizzes")]
async fn get_many(
    app_data: web::Data<AppData>,
    filter: web::Query<QuizFilter>,
) -> Result<HttpResponse> {
    let quizzes = Quiz::get_many(&app_data.db, app_data.dummy_user(), &filter.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quizzes))
}

#[get("/quizzes/{id}")]
async fn get_one(id: web::Path<Uuid>, app_data: web::Data<AppData>) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, app_data.dummy_user(), id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quiz))
}

#[patch("/quizzes/{id}")]
async fn patch(
    id: web::Path<Uuid>,
    update_quiz: web::Json<UpdateQuiz>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, app_data.dummy_user(), id.into_inner()).await?;
    let quiz = quiz.update(&app_data.db, update_quiz.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quiz))
}

#[put("/quizzes/{id}")]
async fn put(
    id: web::Path<Uuid>,
    new_quiz: web::Json<NewQuiz>,
    app_data: web::Data<AppData>,
) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, app_data.dummy_user(), id.into_inner()).await?;
    let quiz = quiz
        .update(&app_data.db, new_quiz.into_inner().into())
        .await?;
    Ok(HttpResponse::Ok().json(quiz))
}

#[delete("/quizzes/{id}")]
async fn delete(id: web::Path<Uuid>, app_data: web::Data<AppData>) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, app_data.dummy_user(), id.into_inner()).await?;
    quiz.delete(&app_data.db).await?;
    Ok(HttpResponse::NoContent().finish())
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(create_one);
    cfg.service(get_many);
    cfg.service(get_one);
    cfg.service(patch);
    cfg.service(put);
    cfg.service(delete);
}
