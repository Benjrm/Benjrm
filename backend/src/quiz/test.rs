use {
    crate::{
        AppData,
        quiz::{NewQuiz, QuizError, QuizFilter, UpdateQuiz, entity::Quiz},
        update_value::{UpdateOption, UpdateValue},
    },
    chrono::{Duration, Utc},
    uuid::Uuid,
};

#[actix_web::test]
async fn test_create_one() {
    let conn = &AppData::test().await.db;
    let user = Uuid::new_v4();

    let input = NewQuiz {
        title: "Test Quiz".into(),
        description: Some("desc".into()),
        hidden: false,
    };

    let quiz = Quiz::create(conn, user, input).await.unwrap();

    assert_eq!(quiz.title, "Test Quiz");
    assert_eq!(quiz.description.as_deref(), Some("desc"));
    assert_eq!(quiz.hidden, false);
    assert_eq!(quiz.user, user);
    assert_eq!(quiz.created, quiz.modified);
    assert!((quiz.created - Utc::now()).abs() < Duration::seconds(5));
}

#[actix_web::test]
async fn test_get_many() {
    let conn = &AppData::test().await.db;
    let user = Uuid::new_v4();

    let input = vec![
        NewQuiz {
            title: "Visible".into(),
            description: None,
            hidden: false,
        },
        NewQuiz {
            title: "Hidden".into(),
            description: Some("desc".into()),
            hidden: true,
        },
    ];

    for quiz in input {
        Quiz::create(conn, user, quiz.clone()).await.unwrap();
        Quiz::create(conn, Uuid::new_v4(), quiz).await.unwrap();
    }

    let result = Quiz::get_many(
        conn,
        user,
        &QuizFilter {
            hidden: Some(false),
        },
    )
    .await
    .unwrap();

    assert_eq!(result.len(), 1);
    assert_eq!(result[0].title, "Visible");

    let result = Quiz::get_many(conn, user, &QuizFilter { hidden: Some(true) })
        .await
        .unwrap();

    assert_eq!(result.len(), 1);
    assert_eq!(result[0].title, "Hidden");

    let result = Quiz::get_many(conn, user, &QuizFilter { hidden: None })
        .await
        .unwrap();

    assert_eq!(result.len(), 2);
}

#[actix_web::test]
async fn test_get_one() {
    let conn = &AppData::test().await.db;
    let user = Uuid::new_v4();

    let quiz = Quiz::create(
        conn,
        user,
        NewQuiz {
            title: "Single".into(),
            description: None,
            hidden: false,
        },
    )
    .await
    .unwrap();

    let fetched = Quiz::get(conn, user, quiz.id).await.unwrap();
    assert_eq!(fetched, quiz);

    let other_user = Uuid::new_v4();
    let fetched = Quiz::get(conn, other_user, quiz.id).await;
    assert!(matches!(fetched, Err(QuizError::Forbidden)));
}

#[actix_web::test]
async fn test_patch() {
    let conn = &AppData::test().await.db;
    let user = Uuid::new_v4();

    let quiz = Quiz::create(
        conn,
        user,
        NewQuiz {
            title: "Old".into(),
            description: Some("old".into()),
            hidden: false,
        },
    )
    .await
    .unwrap();

    let update_data = UpdateQuiz {
        title: UpdateValue::Set("New".into()),
        description: UpdateOption::Set(None),
        hidden: UpdateValue::Unset,
    };

    let updated = quiz.update(conn, update_data).await.unwrap();

    assert_eq!(updated.title, "New");
    assert_eq!(updated.description.as_deref(), None);
    assert_eq!(updated.hidden, false);
}

#[actix_web::test]
async fn test_delete() {
    let conn = &AppData::test().await.db;
    let user = Uuid::new_v4();

    let quiz = Quiz::create(
        conn,
        user,
        NewQuiz {
            title: "Delete me".into(),
            description: None,
            hidden: false,
        },
    )
    .await
    .unwrap();

    Quiz::get(conn, user, quiz.id)
        .await
        .unwrap()
        .delete(conn)
        .await
        .unwrap();

    let result = Quiz::get(conn, user, quiz.id).await;
    assert!(matches!(result, Err(QuizError::NotFound)));
}
