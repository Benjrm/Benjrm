use {
    sea_orm::{
        ActiveModelTrait,
        ActiveValue::{self},
        ConnectionTrait, DbErr, IntoActiveModel,
    },
    uuid::Uuid,
};

pub mod choice;
pub mod core;
pub mod order;

pub trait NewOption<Model>: Sized
where
    Model: OptionModel,
{
    type Active: ActiveNewOption<Model, Model::Update>;
    fn correct(&self) -> bool;
    fn into_active_model(self, question_id: Uuid, id: Uuid) -> Self::Active;
}

pub trait UpdateOption {
    fn id(&self) -> Uuid;
    fn correct(&self) -> Option<bool>;
}

pub trait OptionModel: IntoActiveModel<Self::Active> + Clone {
    type Active: ActiveNewOption<Self, Self::Update>;
    type New: NewOption<Self, Active = Self::Active>;
    type Update: UpdateOption;
    fn id(&self) -> Uuid;
    fn correct(&self) -> bool;
}

pub trait ActiveNewOption<Model, Update>: ActiveModelTrait
where
    Model: OptionModel,
    Update: UpdateOption,
{
    fn set(&mut self, update: Update);
    fn id(&self) -> &ActiveValue<Uuid>;
    fn prev(&self) -> &ActiveValue<Option<Uuid>>;
    fn set_prev(&mut self, prev: Option<Uuid>);
    fn next(&self) -> &ActiveValue<Option<Uuid>>;
    fn set_next(&mut self, next: Option<Uuid>);
    async fn insert(self, db: &impl ConnectionTrait) -> Result<Model, DbErr>;
    async fn update(self, db: &impl ConnectionTrait) -> Result<Model, DbErr>;
    async fn delete(self, db: &impl ConnectionTrait) -> Result<(), DbErr>;
}
