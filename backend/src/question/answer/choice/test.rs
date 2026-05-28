use {
    crate::{
        app_data::TestAppData,
        question::{
            NewQuestion, NewQuestionOptions, QuestionOptions, UpdateQuestion,
            UpdateQuestionOptions,
            answer::{
                choice::{
                    NewAnswerChoice, UpdateAnswerChoice, UpdateAnswerChoiceEnum,
                    entity::{ActiveAnswerChoice, AnswerChoiceModel},
                },
                core::UpdateLinkedOptions,
                sort_linked_items,
            },
        },
        quiz::test::create_one,
        update_value::UpdateValue::{Set, Unset},
    },
    uuid::Uuid,
};

lazy_static::lazy_static! {
    static ref QUESTION: Uuid = Uuid::new_v4();
    static ref IDS: Vec<Uuid> = vec![
        Uuid::new_v4(),Uuid::new_v4(),Uuid::new_v4(),Uuid::new_v4(),Uuid::new_v4(),Uuid::new_v4()
    ];

    static ref MODELS1: Vec<AnswerChoiceModel> = vec![
        AnswerChoiceModel { id: IDS[0], question: *QUESTION, correct: false, text: String::new(), prev: None, next: Some(IDS[1]) },
        AnswerChoiceModel { id: IDS[5], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[4]), next: None },
        AnswerChoiceModel { id: IDS[4], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[3]), next: Some(IDS[5]) },
        AnswerChoiceModel { id: IDS[2], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[1]), next: Some(IDS[3]) },
        AnswerChoiceModel { id: IDS[3], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[2]), next: Some(IDS[4]) },
        AnswerChoiceModel { id: IDS[1], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[0]), next: Some(IDS[2]) },
    ];

    static ref MODELS2: Vec<AnswerChoiceModel> = vec![
        AnswerChoiceModel { id: IDS[5], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[4]), next: None },
        AnswerChoiceModel { id: IDS[4], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[3]), next: Some(IDS[5]) },
        AnswerChoiceModel { id: IDS[3], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[2]), next: Some(IDS[4]) },
        AnswerChoiceModel { id: IDS[2], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[1]), next: Some(IDS[3]) },
        AnswerChoiceModel { id: IDS[0], question: *QUESTION, correct: false, text: String::new(), prev: None, next: Some(IDS[1]) },
        AnswerChoiceModel { id: IDS[1], question: *QUESTION, correct: false, text: String::new(), prev: Some(IDS[0]), next: Some(IDS[2]) },
    ];
}

#[test]
fn sort() {
    let models1 = sort_linked_items(MODELS1.clone()).unwrap();
    let models2 = sort_linked_items(MODELS2.clone()).unwrap();

    for i in 0..6 {
        assert!(models1[i].id == IDS[i]);
        assert!(models2[i].id == IDS[i]);
    }
}

#[test]
fn sort_invalid_next() {
    let mut models = MODELS1.clone();
    models[2].next = None;
    assert!(sort_linked_items(models).is_none());

    let mut models = MODELS2.clone();
    models[2].next = None;
    assert!(sort_linked_items(models).is_none());

    let mut models = MODELS1.clone();
    models[3].next = Some(IDS[2]);
    assert!(sort_linked_items(models).is_none());

    let mut models = MODELS2.clone();
    models[3].next = Some(IDS[2]);
    assert!(sort_linked_items(models).is_none());
}

#[test]
fn sort_invalid_prev() {
    let mut models = MODELS1.clone();
    models[2].prev = None;
    assert!(sort_linked_items(models).is_none());

    let mut models = MODELS2.clone();
    models[2].prev = None;
    assert!(sort_linked_items(models).is_none());

    let mut models = MODELS1.clone();
    models[3].prev = Some(IDS[2]);
    assert!(sort_linked_items(models).is_none());

    let mut models = MODELS2.clone();
    models[3].prev = Some(IDS[2]);
    assert!(sort_linked_items(models).is_none());
}

#[test]
fn update_linked() {
    let options = sort_linked_items(MODELS1.clone()).unwrap();
    let mut update = UpdateLinkedOptions::<ActiveAnswerChoice>::new(*QUESTION, options);

    update.add_new(NewAnswerChoice {
        text: String::from("new1"),
        correct: false,
    });
    update.add_new(NewAnswerChoice {
        text: String::from("new2"),
        correct: false,
    });
    update
        .update_option(UpdateAnswerChoice {
            id: IDS[0],
            text: Unset,
            correct: Unset,
        })
        .unwrap();
    update
        .update_option(UpdateAnswerChoice {
            id: IDS[2],
            text: Unset,
            correct: Unset,
        })
        .unwrap();
    update
        .update_option(UpdateAnswerChoice {
            id: IDS[1],
            text: Unset,
            correct: Unset,
        })
        .unwrap();
    update.add_new(NewAnswerChoice {
        text: String::from("new3"),
        correct: false,
    });
    update.add_new(NewAnswerChoice {
        text: String::from("new4"),
        correct: false,
    });
    update.add_new(NewAnswerChoice {
        text: String::from("new5"),
        correct: false,
    });
    update
        .update_option(UpdateAnswerChoice {
            id: IDS[5],
            text: Unset,
            correct: Unset,
        })
        .unwrap();
    update.add_new(NewAnswerChoice {
        text: String::from("new6"),
        correct: false,
    });
    assert!(
        update
            .update_option(UpdateAnswerChoice {
                id: IDS[0],
                text: Unset,
                correct: Unset
            })
            .is_err()
    );
    update.delete_remaining();
    update.link_options();

    assert!(update.options.len() == 10);
    assert!(update.delete.len() == 2);

    assert!(update.delete.iter().any(|x| x.id == IDS[3]));
    assert!(update.delete.iter().any(|x| x.id == IDS[4]));

    assert!(!IDS.contains(&update.options[0].id));
    assert!(update.options[0].active_model.text.clone().unwrap() == "new1");
    assert!(!IDS.contains(&update.options[1].id));
    assert!(update.options[1].active_model.text.clone().unwrap() == "new2");
    assert!(update.options[2].id == IDS[0]);
    assert!(update.options[3].id == IDS[2]);
    assert!(update.options[4].id == IDS[1]);
    assert!(!IDS.contains(&update.options[5].id));
    assert!(update.options[5].active_model.text.clone().unwrap() == "new3");
    assert!(!IDS.contains(&update.options[6].id));
    assert!(update.options[6].active_model.text.clone().unwrap() == "new4");
    assert!(!IDS.contains(&update.options[7].id));
    assert!(update.options[7].active_model.text.clone().unwrap() == "new5");
    assert!(update.options[8].id == IDS[5]);
    assert!(!IDS.contains(&update.options[9].id));
    assert!(update.options[9].active_model.text.clone().unwrap() == "new6");

    for i in 0..update.options.len() {
        let prev = update.options[i].active_model.prev.clone().unwrap();
        let next = update.options[i].active_model.next.clone().unwrap();

        if i > 0 {
            assert!(prev == Some(update.options[i - 1].id));
        } else {
            assert!(prev.is_none());
        }

        if i < update.options.len() - 1 {
            assert!(next == Some(update.options[i + 1].id));
        } else {
            assert!(next.is_none());
        }
    }
}

#[test]
fn parse_update_answer_choice_enum() {
    let new: UpdateAnswerChoiceEnum = serde_json::from_str(r#"{"text": "asdf"}"#).unwrap();
    assert!(matches!(new, UpdateAnswerChoiceEnum::New(_)));

    let new: UpdateAnswerChoiceEnum =
        serde_json::from_str(r#"{"text": "asdf", "correct": true}"#).unwrap();
    assert!(matches!(new, UpdateAnswerChoiceEnum::New(_)));

    let update: UpdateAnswerChoiceEnum =
        serde_json::from_str(r#"{"id": "a1a2a3a4-b1b2-c1c2-d1d2-d3d4d5d6d7d8"}"#).unwrap();
    assert!(matches!(update, UpdateAnswerChoiceEnum::Update(_)));

    let update: UpdateAnswerChoiceEnum =
        serde_json::from_str(r#"{"id": "a1a2a3a4-b1b2-c1c2-d1d2-d3d4d5d6d7d8", "text": "asdf"}"#)
            .unwrap();
    assert!(matches!(update, UpdateAnswerChoiceEnum::Update(_)));

    let update: UpdateAnswerChoiceEnum = serde_json::from_str(
        r#"{"id": "a1a2a3a4-b1b2-c1c2-d1d2-d3d4d5d6d7d8", "text": "asdf", "correct": true}"#,
    )
    .unwrap();
    assert!(matches!(update, UpdateAnswerChoiceEnum::Update(_)));

    let update: UpdateAnswerChoiceEnum =
        serde_json::from_str(r#"{"id": "a1a2a3a4-b1b2-c1c2-d1d2-d3d4d5d6d7d8", "correct": true}"#)
            .unwrap();
    assert!(matches!(update, UpdateAnswerChoiceEnum::Update(_)));

    assert!(serde_json::from_str::<UpdateAnswerChoiceEnum>(r#"{}"#).is_err());
    assert!(serde_json::from_str::<UpdateAnswerChoiceEnum>(r#"{"correct": true}"#).is_err());
}

#[actix_web::test]
async fn update_choices() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let new_question = NewQuestion {
        question: "Question".into(),
        hidden: true,
        position: None,
        options: NewQuestionOptions::MultipleChoice {
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
                    text: "Delete".into(),
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

    let options = match question.options.clone() {
        QuestionOptions::MultipleChoice { options } => options,
        _ => panic!(),
    };

    let options = vec![
        UpdateAnswerChoiceEnum::New(NewAnswerChoice {
            text: "first".into(),
            correct: true,
        }),
        UpdateAnswerChoiceEnum::Update(UpdateAnswerChoice {
            id: options[1].id,
            text: Set("b".into()),
            correct: Unset,
        }),
        UpdateAnswerChoiceEnum::New(NewAnswerChoice {
            text: "middle_1".into(),
            correct: true,
        }),
        UpdateAnswerChoiceEnum::New(NewAnswerChoice {
            text: "middle_2".into(),
            correct: true,
        }),
        UpdateAnswerChoiceEnum::New(NewAnswerChoice {
            text: "middle_3".into(),
            correct: true,
        }),
        UpdateAnswerChoiceEnum::Update(UpdateAnswerChoice {
            id: options[0].id,
            text: Set("a".into()),
            correct: Unset,
        }),
        UpdateAnswerChoiceEnum::New(NewAnswerChoice {
            text: "last".into(),
            correct: true,
        }),
    ];

    let update_question = UpdateQuestion {
        question: Unset,
        hidden: Unset,
        position: None,
        options: Some(UpdateQuestionOptions::SingleChoice { options }),
    };

    let question = question
        .update(quiz.clone(), &data.db, update_question)
        .await
        .unwrap();

    let inserted_options = match question.options {
        QuestionOptions::SingleChoice { options } => options,
        _ => panic!(),
    };

    assert_eq!(inserted_options.len(), 7);
    assert_eq!(inserted_options[0].text, "first");
    assert_eq!(inserted_options[1].text, "b");
    assert_eq!(inserted_options[2].text, "middle_1");
    assert_eq!(inserted_options[3].text, "middle_2");
    assert_eq!(inserted_options[4].text, "middle_3");
    assert_eq!(inserted_options[5].text, "a");
    assert_eq!(inserted_options[6].text, "last");
}
