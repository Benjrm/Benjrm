use {
    crate::{
        app_data::TestAppData,
        question::{
            NewQuestion, NewQuestionOptions, Question, QuestionError, QuestionFilter,
            QuestionOptions, UpdateQuestion, UpdateQuestionOptions,
            answer::{
                choice::{NewAnswerChoice, UpdateAnswerChoice, UpdateAnswerChoiceEnum},
                order::{UpdateAnswerOrder, UpdateAnswerOrderEnum},
            },
            core::neighbors::Position,
            entity::QuestionType::{self},
        },
        quiz::{entity::QuizModel, test::create_one},
        update_value::UpdateValue::Unset,
    },
    sea_orm::{DatabaseTransaction, TransactionTrait},
};

#[actix_web::test]
pub async fn create_question_slide() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let new_question = NewQuestion {
        question: "Slide".into(),
        hidden: true,
        position: None,
        options: NewQuestionOptions::Slide,
    };
    let question = quiz
        .clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();
    let question = quiz
        .get_question(&data.db, question.model.id)
        .await
        .unwrap()
        .get_answers(&data.db)
        .await
        .unwrap();

    let quiz = QuizModel::get(&data.db, user, quiz.id).await.unwrap();

    assert_eq!(quiz.id, question.model.quiz);
    assert_eq!(question.model.created, question.model.modified);
    assert_eq!(quiz.modified, question.model.modified);
    assert_eq!(question.model.question, String::from("Slide"));
    assert_eq!(question.model.r#type, QuestionType::Slide);
    assert_eq!(QuestionType::Slide.get_answer_table(), QuestionType::Slide);
}

#[actix_web::test]
async fn delete_choice_question() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let new_question = NewQuestion {
        question: "Question".into(),
        hidden: true,
        position: None,
        options: NewQuestionOptions::SingleChoice {
            options: vec![
                NewAnswerChoice {
                    text: "A".into(),
                    correct: false,
                },
                NewAnswerChoice {
                    text: "B".into(),
                    correct: true,
                },
            ],
        },
    };
    let question = quiz
        .clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();
    question
        .model
        .clone()
        .delete(quiz.clone(), &data.db)
        .await
        .unwrap();

    let question = quiz.get_question(&data.db, question.model.id).await;
    assert!(matches!(question, Err(QuestionError::NotFound)));

    let updated_quiz = QuizModel::get(&data.db, user, quiz.id).await.unwrap();
    assert!(quiz.modified < updated_quiz.modified)
}

#[actix_web::test]
async fn delete_quiz_with_choice_questions() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let new_question = NewQuestion {
        question: "Slide".into(),
        hidden: true,
        position: None,
        options: NewQuestionOptions::SingleChoice {
            options: vec![
                NewAnswerChoice {
                    text: "A".into(),
                    correct: false,
                },
                NewAnswerChoice {
                    text: "B".into(),
                    correct: true,
                },
            ],
        },
    };
    quiz.clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();

    let new_question = NewQuestion {
        question: "Slide".into(),
        hidden: true,
        position: None,
        options: NewQuestionOptions::Slide,
    };
    quiz.clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();

    quiz.clone().delete(&data.db).await.unwrap();
    let questions = quiz
        .get_questions(&data.db, &QuestionFilter::default())
        .await
        .unwrap();
    assert!(questions.is_empty());
}

#[actix_web::test]
async fn change_choice_type() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    macro_rules! test_change_choice {
        ($from:ident, $to: ident) => {
            let options = vec![
                NewAnswerChoice {
                    text: "a".into(),
                    correct: true,
                },
                NewAnswerChoice {
                    text: "b".into(),
                    correct: false,
                },
            ];
            let new_question = NewQuestion {
                question: "question".into(),
                hidden: false,
                position: None,
                options: NewQuestionOptions::$from { options },
            };
            let question = quiz
                .clone()
                .create_question(&data.db, new_question)
                .await
                .unwrap();
            let question_id = question.model.id;
            let QuestionOptions::$from { options } = question.options.clone() else {
                panic!();
            };

            let new_options: Vec<_> = options
                .iter()
                .map(|x| {
                    UpdateAnswerChoiceEnum::Update(UpdateAnswerChoice {
                        id: x.id,
                        text: Unset,
                        correct: Unset,
                    })
                })
                .collect();
            let update_question = UpdateQuestion {
                question: Unset,
                hidden: Unset,
                position: None,
                options: Some(UpdateQuestionOptions::$to {
                    options: new_options,
                }),
            };
            question
                .update(quiz.clone(), &data.db, update_question)
                .await
                .unwrap();

            let question = quiz
                .get_question(&data.db, question_id)
                .await
                .unwrap()
                .get_answers(&data.db)
                .await
                .unwrap();

            let QuestionOptions::$to {
                options: new_options,
            } = question.options
            else {
                panic!()
            };
            for i in 0..2 {
                assert_eq!(options[i].id, new_options[i].id);
                assert_eq!(options[i].text, new_options[i].text);
                assert_eq!(options[i].correct, new_options[i].correct);
            }
        };
    }

    test_change_choice!(SingleChoice, MultipleChoice);
    test_change_choice!(MultipleChoice, SingleChoice);
}

#[actix_web::test]
async fn change_slide_to_single_choice() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let new_question = NewQuestion {
        question: "test".into(),
        hidden: false,
        position: None,
        options: NewQuestionOptions::Slide,
    };
    let question = quiz
        .clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();
    let question_id = question.model.id;

    let options = vec![
        NewAnswerChoice {
            text: "a".into(),
            correct: true,
        },
        NewAnswerChoice {
            text: "b".into(),
            correct: false,
        },
    ];
    let update_options = options
        .clone()
        .into_iter()
        .map(UpdateAnswerChoiceEnum::New)
        .collect();
    let update_question = UpdateQuestion {
        question: Unset,
        hidden: Unset,
        position: None,
        options: Some(UpdateQuestionOptions::SingleChoice {
            options: update_options,
        }),
    };
    question
        .update(quiz.clone(), &data.db, update_question)
        .await
        .unwrap();

    let question = quiz
        .get_question(&data.db, question_id)
        .await
        .unwrap()
        .get_answers(&data.db)
        .await
        .unwrap();
    let QuestionOptions::SingleChoice {
        options: new_options,
    } = question.options
    else {
        panic!()
    };
    for i in 0..2 {
        assert_eq!(options[i].text, new_options[i].text);
        assert_eq!(options[i].correct, new_options[i].correct);
    }
}

#[actix_web::test]
async fn change_single_choice_to_slide() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let options = vec![
        NewAnswerChoice {
            text: "a".into(),
            correct: true,
        },
        NewAnswerChoice {
            text: "b".into(),
            correct: false,
        },
    ];
    let new_question = NewQuestion {
        question: "test".into(),
        hidden: false,
        position: None,
        options: NewQuestionOptions::SingleChoice { options },
    };
    let question = quiz
        .clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();
    let question_id = question.model.id;

    let update_question = UpdateQuestion {
        question: Unset,
        hidden: Unset,
        position: None,
        options: Some(UpdateQuestionOptions::Slide),
    };
    question
        .clone()
        .update(quiz.clone(), &data.db, update_question)
        .await
        .unwrap();
    let old_question = question.model;

    let question = quiz
        .get_question(&data.db, question_id)
        .await
        .unwrap()
        .get_answers(&data.db)
        .await
        .unwrap();
    assert!(matches!(question.options, QuestionOptions::Slide));

    let answers = old_question.get_answers(&data.db).await.unwrap().options;
    let QuestionOptions::SingleChoice { options } = answers else {
        panic!()
    };
    assert!(options.is_empty());
}

#[actix_web::test]
async fn change_single_choice_to_order_to_single_choice() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let options = vec![
        NewAnswerChoice {
            text: "a".into(),
            correct: true,
        },
        NewAnswerChoice {
            text: "b".into(),
            correct: true,
        },
        NewAnswerChoice {
            text: "c".into(),
            correct: true,
        },
        NewAnswerChoice {
            text: "d".into(),
            correct: true,
        },
    ];
    let new_question = NewQuestion {
        question: "tt".into(),
        hidden: false,
        position: None,
        options: NewQuestionOptions::SingleChoice { options },
    };
    let question = quiz
        .clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();

    let QuestionOptions::SingleChoice { options } = question.options.clone() else {
        panic!();
    };
    let new_options: Vec<_> = options
        .iter()
        .map(|x| {
            UpdateAnswerOrderEnum::Update(UpdateAnswerOrder {
                id: x.id,
                text: Unset,
            })
        })
        .collect();
    let update_question = UpdateQuestion {
        question: Unset,
        hidden: Unset,
        position: None,
        options: Some(UpdateQuestionOptions::Order {
            options: new_options,
        }),
    };
    let question = question
        .update(quiz.clone(), &data.db, update_question)
        .await
        .unwrap();

    let QuestionOptions::Order {
        options: new_options,
    } = question.options.clone()
    else {
        panic!();
    };
    for i in 0..options.len() {
        assert_eq!(options[i].id, new_options[i].id);
        assert_eq!(options[i].text, new_options[i].text);
    }

    let new_options: Vec<_> = new_options
        .iter()
        .map(|x| {
            UpdateAnswerChoiceEnum::Update(UpdateAnswerChoice {
                id: x.id,
                text: Unset,
                correct: Unset,
            })
        })
        .collect();

    let update_question = UpdateQuestion {
        question: Unset,
        hidden: Unset,
        position: None,
        options: Some(UpdateQuestionOptions::SingleChoice {
            options: new_options,
        }),
    };
    let question = question
        .update(quiz, &data.db, update_question)
        .await
        .unwrap();

    let QuestionOptions::SingleChoice {
        options: new_options,
    } = question.options
    else {
        panic!();
    };
    for i in 0..options.len() {
        assert_eq!(options[i].id, new_options[i].id);
        assert_eq!(options[i].text, new_options[i].text);
        assert_eq!(options[i].correct, new_options[i].correct);
    }
}

#[actix_web::test]
async fn create_and_reorder_questions() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    async fn insert_new_slide(
        quiz: &QuizModel,
        conn: &DatabaseTransaction,
        question: &str,
        position: Option<Position>,
    ) -> Question {
        let slide = NewQuestion {
            question: question.into(),
            hidden: false,
            position,
            options: NewQuestionOptions::Slide,
        };

        quiz.clone().create_question(conn, slide).await.unwrap()
    }
    let txn = data.db.begin().await.unwrap();
    let first = insert_new_slide(&quiz, &txn, "first", None).await;
    let last = insert_new_slide(&quiz, &txn, "last", None).await;
    let second =
        insert_new_slide(&quiz, &txn, "second", Some(Position::Prev(first.model.id))).await;
    let third = insert_new_slide(&quiz, &txn, "third", Some(Position::Next(last.model.id))).await;
    let before_first = insert_new_slide(
        &quiz,
        &txn,
        "before_first",
        Some(Position::Next(first.model.id)),
    )
    .await;

    txn.commit().await.unwrap();

    let questions = quiz
        .get_questions(&data.db, &QuestionFilter::default())
        .await
        .unwrap();

    assert_eq!(questions[0].id, before_first.model.id);
    assert_eq!(questions[1].id, first.model.id);
    assert_eq!(questions[2].id, second.model.id);
    assert_eq!(questions[3].id, third.model.id);
    assert_eq!(questions[4].id, last.model.id);

    let second = quiz
        .get_question(&data.db, second.model.id)
        .await
        .unwrap()
        .get_answers(&data.db)
        .await
        .unwrap();
    second
        .clone()
        .update(
            quiz.clone(),
            &data.db,
            UpdateQuestion {
                question: Unset,
                hidden: Unset,
                position: Some(Position::Prev(third.model.id)),
                options: None,
            },
        )
        .await
        .unwrap();

    let last = quiz
        .get_question(&data.db, last.model.id)
        .await
        .unwrap()
        .get_answers(&data.db)
        .await
        .unwrap();
    last.clone()
        .update(
            quiz.clone(),
            &data.db,
            UpdateQuestion {
                question: Unset,
                hidden: Unset,
                position: Some(Position::Next(before_first.model.id)),
                options: None,
            },
        )
        .await
        .unwrap();

    let questions = quiz
        .get_questions(&data.db, &QuestionFilter::default())
        .await
        .unwrap();

    assert_eq!(questions[0].id, last.model.id);
    assert_eq!(questions[1].id, before_first.model.id);
    assert_eq!(questions[2].id, first.model.id);
    assert_eq!(questions[3].id, third.model.id);
    assert_eq!(questions[4].id, second.model.id);
}
