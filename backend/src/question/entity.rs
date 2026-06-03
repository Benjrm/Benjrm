#[allow(unused_imports)]
pub use question::{
    ActiveModel as ActiveQuestion, Column as QuestionColumn, Entity as QuestionEntity,
    Model as QuestionModel, QuestionType, Relation as QuestionRelation,
};

mod question {
    use {
        crate::{
            question::answer::choice::entity::AnswerChoiceEntity,
            quiz::entity::{QuizColumn, QuizEntity},
        },
        sea_orm::entity::prelude::*,
        serde::Serialize,
    };

    #[derive(Debug, Clone, PartialEq, Eq, EnumIter, DeriveActiveEnum, Serialize, DeriveDisplay)]
    #[sea_orm(rs_type = "String", db_type = "Enum", enum_name = "question_type")]
    #[serde(rename_all = "SCREAMING_SNAKE_CASE")]
    pub enum QuestionType {
        #[sea_orm(string_value = "MultipleChoice")]
        MultipleChoice,
        #[sea_orm(string_value = "SingleChoice")]
        SingleChoice,
        #[sea_orm(string_value = "Order")]
        Order,
        #[sea_orm(string_value = "Slide")]
        Slide,
    }

    #[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
    #[sea_orm(table_name = "question")]
    #[serde(rename_all = "camelCase")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        #[serde(skip)]
        pub quiz: Uuid,
        #[serde(skip)]
        pub r#type: QuestionType,
        pub question: String,
        pub hidden: bool,
        #[serde(skip)]
        pub prev: Option<Uuid>,
        #[serde(skip)]
        pub next: Option<Uuid>,
        pub created: DateTimeUtc,
        pub modified: DateTimeUtc,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {
        #[sea_orm(has_many = "AnswerChoiceEntity")]
        AnswerChoice,
        #[sea_orm(
            belongs_to = "Entity",
            from = "Column::Next",
            to = "Column::Id",
            on_update = "Restrict",
            on_delete = "Restrict"
        )]
        SelfRef2,
        #[sea_orm(
            belongs_to = "Entity",
            from = "Column::Prev",
            to = "Column::Id",
            on_update = "Restrict",
            on_delete = "Restrict"
        )]
        SelfRef1,
        #[sea_orm(
            belongs_to = "QuizEntity",
            from = "Column::Quiz",
            to = "QuizColumn::Id",
            on_update = "Restrict",
            on_delete = "Restrict"
        )]
        Quiz,
    }

    impl Related<AnswerChoiceEntity> for Entity {
        fn to() -> RelationDef {
            Relation::AnswerChoice.def()
        }
    }

    impl Related<QuizEntity> for Entity {
        fn to() -> RelationDef {
            Relation::Quiz.def()
        }
    }

    impl ActiveModelBehavior for ActiveModel {}
}
