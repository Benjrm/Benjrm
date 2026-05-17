#[allow(unused_imports)]
pub use quiz::{
    ActiveModel as ActiveQuiz, Column as QuizColumn, Entity as QuizEntity, Model as Quiz,
    Relation as QuizRelation,
};

mod quiz {
    use {sea_orm::entity::prelude::*, serde::Serialize};

    #[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
    #[sea_orm(table_name = "quiz")]
    #[serde(rename_all = "camelCase")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        #[serde(skip)]
        pub user: Uuid,
        pub title: String,
        pub description: Option<String>,
        pub hidden: bool,
        pub created: DateTimeUtc,
        pub modified: DateTimeUtc,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {}

    impl ActiveModelBehavior for ActiveModel {}
}
