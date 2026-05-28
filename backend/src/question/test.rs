use crate::{
    app_data::TestAppData,
    question::{
        NewQuestion, NewQuestionOptions, QuestionError, QuestionOptions, UpdateQuestion,
        UpdateQuestionOptions,
        answer::choice::{NewAnswerChoice, UpdateAnswerChoice, UpdateAnswerChoiceEnum},
        entity::QuestionType::{self},
    },
    quiz::{entity::QuizModel, test::create_one},
    update_value::UpdateValue::Unset,
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
pub async fn create_choice_question() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;

    macro_rules! test_choice_types {
        ($id:ident) => {
            let quiz = create_one(&data.db, user, None, None, false).await.unwrap();
            let quiz_modification = quiz.modified;

            let new_question = NewQuestion {
                question: "Question".into(),
                hidden: true,
                position: None,
                options: NewQuestionOptions::$id { options: vec![] },
            };
            let result = quiz.clone().create_question(&data.db, new_question).await;
            assert!(matches!(result, Err(QuestionError::NoCorrectAnswer)));
            let quiz = QuizModel::get(&data.db, user, quiz.id).await.unwrap();
            assert_eq!(quiz.modified, quiz_modification);

            let new_question = NewQuestion {
                question: "Question".into(),
                hidden: true,
                position: None,
                options: NewQuestionOptions::$id {
                    options: vec![
                        NewAnswerChoice {
                            text: "A".into(),
                            correct: false,
                        },
                        NewAnswerChoice {
                            text: "B".into(),
                            correct: false,
                        },
                        NewAnswerChoice {
                            text: "C".into(),
                            correct: false,
                        },
                        NewAnswerChoice {
                            text: "D".into(),
                            correct: false,
                        },
                    ],
                },
            };
            let result = quiz.clone().create_question(&data.db, new_question).await;
            assert!(matches!(result, Err(QuestionError::NoCorrectAnswer)));
            let quiz = QuizModel::get(&data.db, user, quiz.id).await.unwrap();
            assert_eq!(quiz.modified, quiz_modification);

            let new_question = NewQuestion {
                question: "Question".into(),
                hidden: true,
                position: None,
                options: NewQuestionOptions::$id {
                    options: vec![
                        NewAnswerChoice {
                            text: "A".into(),
                            correct: false,
                        },
                        NewAnswerChoice {
                            text: "B".into(),
                            correct: true,
                        },
                        NewAnswerChoice {
                            text: "C".into(),
                            correct: false,
                        },
                        NewAnswerChoice {
                            text: "D".into(),
                            correct: false,
                        },
                        NewAnswerChoice {
                            text: "E".into(),
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
            assert_eq!(question.model.r#type, QuestionType::$id);
            let quiz = QuizModel::get(&data.db, user, quiz.id).await.unwrap();
            assert!(quiz.modified > quiz_modification);

            let options = match question.options {
                QuestionOptions::$id { options } => options,
                _ => panic!("Type missmatch"),
            };

            assert_eq!(
                QuestionType::$id.get_answer_table(),
                QuestionType::SingleChoice
            );

            assert_eq!(options[0].correct, false);
            assert_eq!(options[1].correct, true);
            assert_eq!(options[2].correct, false);
            assert_eq!(options[3].correct, false);
            assert_eq!(options[4].correct, true);

            assert_eq!(options[0].text, String::from("A"));
            assert_eq!(options[1].text, String::from("B"));
            assert_eq!(options[2].text, String::from("C"));
            assert_eq!(options[3].text, String::from("D"));
            assert_eq!(options[4].text, String::from("E"));
        };
    }

    test_choice_types!(SingleChoice);
    test_choice_types!(MultipleChoice);
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
    let questions = quiz.get_questions(&data.db).await.unwrap();
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
                options: NewQuestionOptions::SingleChoice { options },
            };
            let question = quiz
                .clone()
                .create_question(&data.db, new_question)
                .await
                .unwrap();
            let question_id = question.model.id;
            let QuestionOptions::SingleChoice { options } = question.options.clone() else {
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
                options: Some(UpdateQuestionOptions::MultipleChoice {
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

            let QuestionOptions::MultipleChoice {
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
