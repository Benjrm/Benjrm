use {
    crate::{
        app_data::TestAppData,
        quiz::{NewQuiz, QuizError, QuizFilter, UpdateQuiz, entity::QuizModel},
        update_value::{UpdateOption, UpdateValue},
    },
    chrono::{Duration, Utc},
    sea_orm::ConnectionTrait,
    uuid::Uuid,
};

pub async fn create_one(
    conn: &impl ConnectionTrait,
    user: Uuid,
    title: Option<String>,
    description: Option<String>,
    hidden: bool,
) -> Result<QuizModel, QuizError> {
    let input = NewQuiz {
        title: title.unwrap_or(String::from("Test Quiz")),
        description,
        hidden,
    };

    QuizModel::create(conn, user, input).await
}

#[actix_web::test]
async fn test_create_one() {
    let data = &TestAppData::test().await;
    let user = data.dummy_user_id().await;

    let quiz = create_one(&data.db, user, None, Some("desc".into()), false)
        .await
        .unwrap();

    assert_eq!(quiz.title, "Test Quiz");
    assert_eq!(quiz.description.as_deref(), Some("desc"));
    assert!(!quiz.hidden);
    assert_eq!(quiz.user, user);
    assert_eq!(quiz.created, quiz.modified);
    assert!((quiz.created - Utc::now()).abs() < Duration::seconds(5));
}

#[actix_web::test]
async fn test_get_many() {
    let data = &TestAppData::test().await;
    let user = data.dummy_user_id().await;

    create_one(
        &data.db,
        data.dummy_user_id().await,
        Some("Visible".into()),
        None,
        false,
    )
    .await
    .unwrap();
    create_one(
        &data.db,
        data.dummy_user_id().await,
        Some("Hidden".into()),
        None,
        true,
    )
    .await
    .unwrap();
    create_one(&data.db, user, Some("Visible".into()), None, false)
        .await
        .unwrap();
    create_one(&data.db, user, Some("Hidden".into()), None, true)
        .await
        .unwrap();

    let result = QuizModel::get_many(
        &data.db,
        user,
        &QuizFilter {
            hidden: Some(false),
        },
    )
    .await
    .unwrap();

    assert_eq!(result.len(), 1);
    assert_eq!(result[0].title, "Visible");

    let result = QuizModel::get_many(&data.db, user, &QuizFilter { hidden: Some(true) })
        .await
        .unwrap();

    assert_eq!(result.len(), 1);
    assert_eq!(result[0].title, "Hidden");

    let result = QuizModel::get_many(&data.db, user, &QuizFilter { hidden: None })
        .await
        .unwrap();

    assert_eq!(result.len(), 2);
}

#[actix_web::test]
async fn test_get_one() {
    let data = &TestAppData::test().await;
    let user = data.dummy_user_id().await;

    let quiz = create_one(&data.db, user, Some("Single".into()), None, false)
        .await
        .unwrap();
    create_one(&data.db, user, Some("Not fetched".into()), None, false)
        .await
        .unwrap();

    let fetched = QuizModel::get(&data.db, user, quiz.id).await.unwrap();
    assert_eq!(fetched, quiz);

    let other_user = data.dummy_user_id().await;
    let fetched = QuizModel::get(&data.db, other_user, quiz.id).await;
    assert!(matches!(fetched, Err(QuizError::Forbidden)));
}

#[actix_web::test]
async fn test_patch() {
    let data = &TestAppData::test().await;
    let user = data.dummy_user_id().await;

    let quiz = create_one(
        &data.db,
        user,
        Some("Old".into()),
        Some("old".into()),
        false,
    )
    .await
    .unwrap();

    let update_data = UpdateQuiz {
        title: UpdateValue::Set("New".into()),
        description: UpdateOption::Set(None),
        hidden: UpdateValue::Unset,
    };

    let updated = quiz.update(&data.db, update_data).await.unwrap();

    assert_eq!(updated.title, "New");
    assert_eq!(updated.description.as_deref(), None);
    assert!(!updated.hidden);
}

#[actix_web::test]
async fn test_delete() {
    let data = &TestAppData::test().await;
    let user = data.dummy_user_id().await;

    let quiz = create_one(&data.db, user, Some("Delete me".into()), None, false)
        .await
        .unwrap();

    QuizModel::get(&data.db, user, quiz.id)
        .await
        .unwrap()
        .delete(&data.db)
        .await
        .unwrap();

    let result = QuizModel::get(&data.db, user, quiz.id).await;
    assert!(matches!(result, Err(QuizError::NotFound)));
}
