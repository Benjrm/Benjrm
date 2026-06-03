#[allow(unused_imports)]
pub use quiz::{
    ActiveModel as ActiveQuiz, Column as QuizColumn, Entity as QuizEntity, Model as QuizModel,
    Relation as QuizRelation,
};

mod quiz {
    use {
        crate::{
            auth::entity::{UserColumn, UserEntity},
            question::entity::QuestionEntity,
        },
        sea_orm::entity::prelude::*,
        serde::Serialize,
    };

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
    pub enum Relation {
        #[sea_orm(has_many = "QuestionEntity")]
        Question,
        #[sea_orm(
            belongs_to = "UserEntity",
            from = "Column::User",
            to = "UserColumn::Id",
            on_update = "Restrict",
            on_delete = "Restrict"
        )]
        User,
    }

    impl Related<QuestionEntity> for Entity {
        fn to() -> RelationDef {
            Relation::Question.def()
        }
    }

    impl Related<UserEntity> for Entity {
        fn to() -> RelationDef {
            Relation::User.def()
        }
    }

    impl ActiveModelBehavior for ActiveModel {}
}
