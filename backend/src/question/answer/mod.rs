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

pub trait NewOption: Sized {
    type ActiveModel: ActiveNewOption<NewOption = Self>;
    fn correct(&self) -> bool;
    fn into_active_model(self, question_id: Uuid, id: Uuid) -> Self::ActiveModel;
}

pub trait UpdateOption {
    fn id(&self) -> Uuid;
}

pub trait OptionModel {
    fn id(&self) -> Uuid;
}

pub trait ActiveNewOption: ActiveModelTrait {
    type NewOption: NewOption<ActiveModel = Self>;
    type UpdateOption: UpdateOption;
    type Model: OptionModel + IntoActiveModel<Self> + Clone;
    fn set(&mut self, update: Self::UpdateOption);
    fn id(&self) -> &ActiveValue<Uuid>;
    fn prev(&self) -> &ActiveValue<Option<Uuid>>;
    fn set_prev(&mut self, prev: Option<Uuid>);
    fn next(&self) -> &ActiveValue<Option<Uuid>>;
    fn set_next(&mut self, next: Option<Uuid>);
    async fn insert(self, db: &impl ConnectionTrait) -> Result<Self::Model, DbErr>;
    async fn update(self, db: &impl ConnectionTrait) -> Result<Self::Model, DbErr>;
    async fn delete(self, db: &impl ConnectionTrait) -> Result<(), DbErr>;
}

pub trait LinkedItem {
    fn id(&self) -> Uuid;
    fn prev(&self) -> Option<Uuid>;
    fn next(&self) -> Option<Uuid>;
}

pub fn sort_linked_items<T: LinkedItem>(mut items: Vec<T>) -> Option<Vec<T>> {
    if items.is_empty() {
        return Some(items);
    }
    let first = items.iter().position(|x| x.prev().is_none())?;
    items.swap(first, 0);
    let mut id = items[0].id();
    for i in 1..items.len() {
        let item = items.iter().position(|x| x.prev() == Some(id))?;
        items.swap(item, i);
        id = items[i].id();
        if items[i - 1].next() != Some(id) {
            return None;
        }
    }
    if items[items.len() - 1].next().is_some() {
        return None;
    }
    Some(items)
}
