use crate::{
    app_data::TestAppData,
    question::{
        NewQuestion, NewQuestionOptions, QuestionOptions, QuestionType, UpdateQuestion,
        UpdateQuestionOptions,
        answer::order::{NewAnswerOrder, UpdateAnswerOrder, UpdateAnswerOrderEnum},
    },
    quiz::test::create_one,
    update_value::UpdateValue::{Set, Unset},
};

#[actix_web::test]
async fn update_options() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;
    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let new_question = NewQuestion {
        question: "Question".into(),
        hidden: true,
        position: None,
        options: NewQuestionOptions::Order(vec![
            NewAnswerOrder { answer: "A".into() },
            NewAnswerOrder { answer: "B".into() },
            NewAnswerOrder {
                answer: "Delete".into(),
            },
        ]),
    };

    let question = quiz
        .clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();

    let options = match question.options.clone() {
        QuestionOptions::Order(options) => options,
        _ => panic!(),
    };

    let options = vec![
        UpdateAnswerOrderEnum::New(NewAnswerOrder {
            answer: "first".into(),
        }),
        UpdateAnswerOrderEnum::Update(UpdateAnswerOrder {
            id: options[1].id,
            answer: Set("b".into()),
        }),
        UpdateAnswerOrderEnum::New(NewAnswerOrder {
            answer: "middle_1".into(),
        }),
        UpdateAnswerOrderEnum::New(NewAnswerOrder {
            answer: "middle_2".into(),
        }),
        UpdateAnswerOrderEnum::New(NewAnswerOrder {
            answer: "middle_3".into(),
        }),
        UpdateAnswerOrderEnum::Update(UpdateAnswerOrder {
            id: options[0].id,
            answer: Set("a".into()),
        }),
        UpdateAnswerOrderEnum::New(NewAnswerOrder {
            answer: "last".into(),
        }),
    ];

    let update_question = UpdateQuestion {
        question: Unset,
        hidden: Unset,
        position: None,
        options: Some(UpdateQuestionOptions::Order(options)),
    };

    let question = question
        .update(quiz.clone(), &data.db, update_question)
        .await
        .unwrap();

    let inserted_options = match question.options {
        QuestionOptions::Order(options) => options,
        _ => panic!(),
    };

    assert_eq!(inserted_options.len(), 7);
    assert_eq!(inserted_options[0].answer, "first");
    assert_eq!(inserted_options[1].answer, "b");
    assert_eq!(inserted_options[2].answer, "middle_1");
    assert_eq!(inserted_options[3].answer, "middle_2");
    assert_eq!(inserted_options[4].answer, "middle_3");
    assert_eq!(inserted_options[5].answer, "a");
    assert_eq!(inserted_options[6].answer, "last");
}

#[actix_web::test]
pub async fn create_order_question() {
    let data = TestAppData::test().await;
    let user = data.dummy_user_id().await;

    let quiz = create_one(&data.db, user, None, None, false).await.unwrap();

    let new_question = NewQuestion {
        question: "Question".into(),
        hidden: true,
        position: None,
        options: NewQuestionOptions::Order(vec![
            NewAnswerOrder { answer: "A".into() },
            NewAnswerOrder { answer: "B".into() },
        ]),
    };

    let question = quiz
        .clone()
        .create_question(&data.db, new_question)
        .await
        .unwrap();

    assert_eq!(question.model.r#type, QuestionType::Order);

    let options = match question.options {
        QuestionOptions::Order(options) => options,
        _ => panic!("Type missmatch"),
    };

    assert_eq!(
        QuestionType::Order.get_answer_table(),
        QuestionType::SingleChoice
    );

    assert_eq!(options[0].answer, String::from("A"));
    assert_eq!(options[1].answer, String::from("B"));
}
