use {
    crate::{
        app_data::TestAppData,
        question::{
            NewQuestion, NewQuestionOptions, Question, QuestionFilter, QuestionOptions,
            answer::{choice::NewAnswerChoice, order::NewAnswerOrder},
        },
        quiz::{NewQuiz, Quiz, QuizError, QuizFilter, UpdateQuiz, entity::QuizModel},
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

#[actix_web::test]
async fn test_get_complete() {
    let data = &TestAppData::test().await;
    let user = data.dummy_user_id().await;

    let quiz = create_one(&data.db, user, Some("Quiz".into()), None, false)
        .await
        .unwrap();
    let quiz_id = quiz.id;

    let questions = vec![
        NewQuestion {
            question: "slide".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::Slide,
        },
        NewQuestion {
            question: "hidden slide".into(),
            hidden: true,
            position: None,
            options: NewQuestionOptions::Slide,
        },
        NewQuestion {
            question: "single choice".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::SingleChoice(vec![
                NewAnswerChoice {
                    answer: "true".into(),
                    correct: true,
                },
                NewAnswerChoice {
                    answer: "false".into(),
                    correct: false,
                },
            ]),
        },
        NewQuestion {
            question: "hidden single choice".into(),
            hidden: true,
            position: None,
            options: NewQuestionOptions::SingleChoice(vec![
                NewAnswerChoice {
                    answer: "true".into(),
                    correct: true,
                },
                NewAnswerChoice {
                    answer: "false".into(),
                    correct: false,
                },
            ]),
        },
        NewQuestion {
            question: "multiple choice".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::MultipleChoice(vec![
                NewAnswerChoice {
                    answer: "true1".into(),
                    correct: true,
                },
                NewAnswerChoice {
                    answer: "true2".into(),
                    correct: true,
                },
                NewAnswerChoice {
                    answer: "false".into(),
                    correct: false,
                },
            ]),
        },
        NewQuestion {
            question: "order".into(),
            hidden: false,
            position: None,
            options: NewQuestionOptions::Order(vec![
                NewAnswerOrder {
                    answer: "item1".into(),
                },
                NewAnswerOrder {
                    answer: "item2".into(),
                },
                NewAnswerOrder {
                    answer: "item3".into(),
                },
            ]),
        },
    ];
    for question in questions.clone() {
        quiz.clone()
            .create_question(&data.db, question)
            .await
            .unwrap();
    }

    let check_get = async |hidden: Option<bool>| {
        let quiz = Quiz::<Question>::get(&data.db, user, quiz_id, &QuestionFilter { hidden })
            .await
            .unwrap();

        assert_eq!(quiz.model.title, "Quiz");
        assert_eq!(quiz.model.description, None);
        let mut quiz_question_iter = quiz.questions.into_iter();
        for question in &questions {
            if let Some(hidden) = hidden
                && question.hidden != hidden
            {
                continue;
            }

            let quiz_question = quiz_question_iter.next().unwrap();
            assert_eq!(question.hidden, quiz_question.model.hidden);
            assert_eq!(question.question, quiz_question.model.question);

            match (&question.options, quiz_question.options) {
                (NewQuestionOptions::Slide, QuestionOptions::Slide) => (),
                (
                    NewQuestionOptions::SingleChoice(new_options),
                    QuestionOptions::SingleChoice(options),
                )
                | (
                    NewQuestionOptions::MultipleChoice(new_options),
                    QuestionOptions::MultipleChoice(options),
                ) => {
                    assert_eq!(new_options.len(), options.len());
                    for (new, current) in new_options.iter().zip(options.iter()) {
                        assert_eq!(new.answer, current.answer);
                        assert_eq!(new.correct, current.correct);
                    }
                }
                (NewQuestionOptions::Order(new_options), QuestionOptions::Order(options)) => {
                    assert_eq!(new_options.len(), options.len());
                    for (new, current) in new_options.iter().zip(options.iter()) {
                        assert_eq!(new.answer, current.answer);
                    }
                }
                _ => panic!(),
            }
        }
        assert!(quiz_question_iter.next().is_none());
    };

    check_get(None).await;
    check_get(Some(true)).await;
    check_get(Some(false)).await;
}
