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

/// Trait describing how a newly created answer option is constructed.
pub trait NewOption<Model>: Sized
where
    Model: OptionModel,
{
    /// The active model type that will be persisted to the database.
    type Active: ActiveNewOption<Model, Model::Update>;
    /// Returns whether this option is marked as correct.
    ///
    /// For question types where correctness is not defined (e.g. ordering), this may return always `true` and also may be ignored.
    fn correct(&self) -> bool;
    /// Consumes the model and converts it into an active model.
    fn into_active_model(self, question_id: Uuid, id: Uuid) -> Self::Active;
}

/// Trait describing how an existing option can be updated.
pub trait UpdateOption {
    /// Returns the unique id of the option.
    fn id(&self) -> Uuid;
    /// Returns if the correctness of a answer got changed during a update.
    ///
    /// If changed it returns [`Some<bool>`], if not [`None`] .
    fn correct(&self) -> Option<bool>;
}

/// Core abstraction over a persisted answer option model.
pub trait OptionModel: IntoActiveModel<Self::Active> + Clone {
    /// Active model type used for database operations.
    type Active: ActiveNewOption<Self, Self::Update>;
    /// Struct used when creating a new option.
    type New: NewOption<Self, Active = Self::Active>;
    /// Struct used when updating an existing option.
    type Update: UpdateOption;
    /// Returns the unique identifier of this option.
    fn id(&self) -> Uuid;
    /// Returns whether this option is currently marked as correct.
    ///
    /// For question types where correctness is not defined (e.g. ordering), this may return always `true` and also may be ignored.
    fn correct(&self) -> bool;
}

pub trait ActiveNewOption<Model, Update>: ActiveModelTrait
where
    Model: OptionModel,
    Update: UpdateOption,
{
    /// Applies a partial update to the active model.
    fn set(&mut self, update: Update);
    /// Returns the active value of the option ID.
    fn id(&self) -> &ActiveValue<Uuid>;
    /// Returns the `prev` linked option ID in a linked-list ordering.
    fn prev(&self) -> &ActiveValue<Option<Uuid>>;
    /// Sets the previous linked option ID.
    ///
    /// Used to maintain ordering between options.
    fn set_prev(&mut self, prev: Option<Uuid>);
    /// Returns the next linked option ID in a linked-list ordering.
    fn next(&self) -> &ActiveValue<Option<Uuid>>;
    /// Sets the next linked option ID.
    ///
    /// Used to maintain ordering between options.
    fn set_next(&mut self, next: Option<Uuid>);
    /// Inserts this active model into the database.
    async fn insert(self, db: &impl ConnectionTrait) -> Result<Model, DbErr>;
    /// Updates this active model in the database.
    async fn update(self, db: &impl ConnectionTrait) -> Result<Model, DbErr>;
    /// Deletes this active model from the database.
    async fn delete(self, db: &impl ConnectionTrait) -> Result<(), DbErr>;
}
