use {
    crate::question::{
        QuestionError,
        answer::{ActiveNewOption, NewOption, OptionModel, UpdateOption},
    },
    sea_orm::{
        ActiveValue::{Set, Unchanged},
        DatabaseTransaction, IntoActiveModel,
    },
    uuid::Uuid,
};

pub struct UpdateLinkedOptions<T: ActiveNewOption> {
    question_id: Uuid,
    pos: usize,
    pub(super) options: Vec<LinkedOption<T>>,
    pub(super) delete: Vec<LinkedOption<T>>,
}

pub(super) struct LinkedOption<T: ActiveNewOption> {
    pub(super) id: Uuid,
    pub(super) active_model: T,
}

impl<T: ActiveNewOption> UpdateLinkedOptions<T> {
    pub fn new(question: Uuid, options: Vec<T::Model>) -> Self {
        Self {
            question_id: question,
            pos: 0,
            options: options
                .into_iter()
                .map(|option| LinkedOption {
                    id: option.id(),
                    active_model: option.into_active_model(),
                })
                .collect(),
            delete: Vec::new(),
        }
    }

    pub fn add_new(&mut self, new: T::NewOption) {
        let id = Uuid::new_v4();
        let option = LinkedOption {
            id,
            active_model: new.into_active_model(self.question_id, id),
        };
        self.options.insert(self.pos, option);
        self.pos += 1;
    }

    pub fn update_option(&mut self, update: T::UpdateOption) -> Result<(), QuestionError> {
        if let Some(pos) = self.options.iter().position(|x| x.id == update.id()) {
            if pos < self.pos {
                return Err(QuestionError::DuplicateAnswerId(update.id()));
            }
            ActiveNewOption::set(&mut self.options[pos].active_model, update);
            self.options.swap(pos, self.pos);
            self.pos += 1;
        } else {
            return Err(QuestionError::AnswerNotFound);
        }
        Ok(())
    }

    pub fn delete_remaining(&mut self) {
        for _ in self.pos..self.options.len() {
            self.delete.push(self.options.remove(self.pos));
        }
    }

    pub fn link_options(&mut self) {
        for i in 0..self.options.len() {
            let prev = match i {
                0 => None,
                _ => self.options.get(i - 1).map(|x| x.id),
            };
            if *self.options[i].active_model.prev() != Unchanged(prev) {
                self.options[i].active_model.set_prev(prev);
            }
            let next = self.options.get(i + 1).map(|x| x.id);
            if *self.options[i].active_model.next() != Unchanged(next) {
                self.options[i].active_model.set_next(next);
            }
        }
    }

    pub async fn execute(self, txn: &DatabaseTransaction) -> Result<Vec<T::Model>, QuestionError> {
        // insert new options before updating prev and next for all options
        for option in &self.options {
            if matches!(option.active_model.id(), Set(_)) {
                let mut model = option.active_model.clone();
                model.set_prev(None);
                model.set_next(None);
                ActiveNewOption::insert(model, txn).await?;
            }
        }

        let mut return_options = Vec::with_capacity(self.options.len());
        for option in self.options {
            let option = ActiveNewOption::update(option.active_model, txn).await?;
            return_options.push(option);
        }

        for option in &self.delete {
            let mut model = option.active_model.clone();
            model.set_prev(None);
            model.set_next(None);
            ActiveNewOption::update(model, txn).await?;
        }

        for option in self.delete {
            ActiveNewOption::delete(option.active_model, txn).await?;
        }

        Ok(return_options)
    }
}
