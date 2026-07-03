use {
    crate::{
        AppData,
        auth::User,
        error::Result,
        question::{NewQuestion, QuestionFilter, UpdateQuestion},
        quiz::entity::QuizModel,
    },
    actix_web::{HttpResponse, web},
    uuid::Uuid,
};

/// Creates a new question for a quiz.
async fn create_one(
    question: web::Json<NewQuestion>,
    app_data: web::Data<AppData>,
    user: User,
    id: web::Path<Uuid>,
) -> Result<HttpResponse> {
    let quiz = QuizModel::get(&app_data.db, user.id, id.into_inner()).await?;
    let question = quiz
        .create_question(&app_data.db, question.into_inner())
        .await?;

    Ok(HttpResponse::Created().json(question))
}

/// Retrieves a specific question from a quiz, along with its answers.
async fn get_one(
    id: web::Path<(Uuid, Uuid)>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let (quiz_id, question_id) = id.into_inner();

    let quiz = QuizModel::get(&app_data.db, user.id, quiz_id).await?;
    let question = quiz.get_question(&app_data.db, question_id).await?;
    let question = question.get_answers(&app_data.db).await?;

    Ok(HttpResponse::Ok().json(question))
}

/// Retrieves all questions without their answers for a quiz, optionally filtered by the provided query parameters.
async fn get_many(
    id: web::Path<Uuid>,
    app_data: web::Data<AppData>,
    user: User,
    filter: web::Query<QuestionFilter>,
) -> Result<HttpResponse> {
    let quiz = QuizModel::get(&app_data.db, user.id, id.into_inner()).await?;
    let questions = quiz
        .get_questions(&app_data.db, &filter.into_inner())
        .await?;
    Ok(HttpResponse::Ok().json(questions))
}

/// Updates a specific question in a quiz.
async fn patch(
    id: web::Path<(Uuid, Uuid)>,
    update_question: web::Json<UpdateQuestion>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let (quiz_id, question_id) = id.into_inner();

    let quiz = QuizModel::get(&app_data.db, user.id, quiz_id).await?;
    let question = quiz.get_question(&app_data.db, question_id).await?;
    let question = question.get_answers(&app_data.db).await?;
    let question = question
        .update(quiz, &app_data.db, update_question.into_inner())
        .await?;

    Ok(HttpResponse::Ok().json(question))
}

/// Updates a specific question in a quiz by replacing it with a new question. The new question will inherit the position and id of the old question.
///
/// **Hint:** Internally this function updates a question. The old question is not deleted, but the values are replaced with new ones.
async fn put(
    id: web::Path<(Uuid, Uuid)>,
    new_question: web::Json<NewQuestion>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let (quiz_id, question_id) = id.into_inner();

    let quiz = QuizModel::get(&app_data.db, user.id, quiz_id).await?;
    let question = quiz.get_question(&app_data.db, question_id).await?;
    let question = question.get_answers(&app_data.db).await?;
    let question = question
        .update(quiz, &app_data.db, new_question.into_inner().into())
        .await?;

    Ok(HttpResponse::Ok().json(question))
}

/// Deletes a specific question from a quiz.
async fn delete(
    id: web::Path<(Uuid, Uuid)>,
    app_data: web::Data<AppData>,
    user: User,
) -> Result<HttpResponse> {
    let (quiz_id, question_id) = id.into_inner();

    let quiz = QuizModel::get(&app_data.db, user.id, quiz_id).await?;
    let question = quiz.get_question(&app_data.db, question_id).await?;
    question.delete(quiz, &app_data.db).await?;

    Ok(HttpResponse::NoContent().finish())
}

/// Initializes the REST routes for the question API.
pub fn init(cfg: &mut actix_web::web::ServiceConfig) {
    cfg.service(
        web::resource("/quizzes/{quiz}/questions")
            .route(web::post().to(create_one))
            .route(web::get().to(get_many)),
    );
    cfg.service(
        web::resource("/quizzes/{quiz}/questions/{question}")
            .route(web::get().to(get_one))
            .route(web::patch().to(patch))
            .route(web::put().to(put))
            .route(web::delete().to(delete)),
    );
}
