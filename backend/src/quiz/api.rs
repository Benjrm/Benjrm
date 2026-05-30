use {
    crate::{
        AppData,
        auth::User,
        error::Result,
        quiz::{NewQuiz, QuizFilter, UpdateQuiz, entity::Quiz},
    },
    actix_web::{HttpResponse, web},
    uuid::Uuid,
};

async fn create_one(
    quiz: web::Json<NewQuiz>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let quiz = Quiz::create(&app_data.db, user.id, quiz.into_inner()).await?;
    Ok(HttpResponse::Created().json(quiz))
}

async fn get_many(
    app_data: web::Data<AppData>,
    filter: web::Query<QuizFilter>,
    user: User,
) -> Result<HttpResponse> {
    let quizzes = Quiz::get_many(&app_data.db, user.id, &filter.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quizzes))
}

async fn get_one(
    id: web::Path<Uuid>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, user.id, id.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quiz))
}

async fn patch(
    id: web::Path<Uuid>,
    update_quiz: web::Json<UpdateQuiz>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, user.id, id.into_inner()).await?;
    let quiz = quiz.update(&app_data.db, update_quiz.into_inner()).await?;
    Ok(HttpResponse::Ok().json(quiz))
}

async fn put(
    id: web::Path<Uuid>,
    new_quiz: web::Json<NewQuiz>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, user.id, id.into_inner()).await?;
    let quiz = quiz
        .update(&app_data.db, new_quiz.into_inner().into())
        .await?;
    Ok(HttpResponse::Ok().json(quiz))
}

async fn delete(
    id: web::Path<Uuid>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let quiz = Quiz::get(&app_data.db, user.id, id.into_inner()).await?;
    quiz.delete(&app_data.db).await?;
    Ok(HttpResponse::NoContent().finish())
}

pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(
        web::resource("/quizzes")
            .route(web::post().to(create_one))
            .route(web::get().to(get_many)),
    );
    cfg.service(
        web::resource("/quizzes/{id}")
            .route(web::get().to(get_one))
            .route(web::patch().to(patch))
            .route(web::put().to(put))
            .route(web::delete().to(delete)),
    );
}
