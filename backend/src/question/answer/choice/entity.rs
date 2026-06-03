#[allow(unused_imports)]
pub use choice::{
    ActiveModel as ActiveAnswerChoice, Column as AnswerChoiceColumn, Entity as AnswerChoiceEntity,
    Model as AnswerChoiceModel, Relation as AnswerChoiceRelation,
};

mod choice {
    use {
        crate::question::entity::{QuestionColumn, QuestionEntity},
        sea_orm::entity::prelude::*,
        serde::Serialize,
    };

    #[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
    #[sea_orm(table_name = "answer_choice")]
    #[serde(rename_all = "camelCase")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        #[serde(skip)]
        pub question: Uuid,
        pub correct: bool,
        pub answer: String,
        #[serde(skip)]
        pub prev: Option<Uuid>,
        #[serde(skip)]
        pub next: Option<Uuid>,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {
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
            belongs_to = "QuestionEntity",
            from = "Column::Question",
            to = "QuestionColumn::Id",
            on_update = "NoAction",
            on_delete = "Restrict"
        )]
        Question,
    }

    impl Related<QuestionEntity> for Entity {
        fn to() -> RelationDef {
            Relation::Question.def()
        }
    }

    impl ActiveModelBehavior for ActiveModel {}
}
