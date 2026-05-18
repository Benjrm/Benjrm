#[allow(unused_imports)]
pub use user::{
    ActiveModel as ActiveUser, Column as UserColumn, Entity as UserEntity, Model as User,
    Relation as UserRelation,
};

mod user {
    use {sea_orm::entity::prelude::*, crate::quiz::entity::QuizEntity};

    #[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
    #[sea_orm(table_name = "user")]
    pub struct Model {
        #[sea_orm(primary_key, auto_increment = false)]
        pub id: Uuid,
        #[sea_orm(unique)]
        pub subject: String,
    }

    #[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
    pub enum Relation {
        #[sea_orm(has_many = "QuizEntity")]
        Quiz,
    }

    impl Related<QuizEntity> for Entity {
        fn to() -> RelationDef {
            Relation::Quiz.def()
        }
    }

    impl ActiveModelBehavior for ActiveModel {}
}
