use {
    crate::question::{
        QuestionError,
        answer::{ActiveNewOption, NewOption, OptionModel, UpdateOption},
    },
    sea_orm::{
        ActiveValue::{Set, Unchanged},
        DatabaseTransaction,
    },
    uuid::Uuid,
};

pub struct UpdateLinkedOptions<Model: OptionModel> {
    question_id: Uuid,
    pos: usize,
    correct_found: bool,
    pub(super) options: Vec<LinkedOption<Model>>,
    pub(super) delete: Vec<LinkedOption<Model>>,
}

pub(super) struct LinkedOption<Model: OptionModel> {
    pub(super) id: Uuid,
    correct: bool,
    pub(super) active_model: Model::Active,
}

impl<Model: OptionModel> UpdateLinkedOptions<Model> {
    pub fn new(question: Uuid, options: Vec<Model>) -> Self {
        Self {
            question_id: question,
            pos: 0,
            correct_found: false,
            options: options
                .into_iter()
                .map(|option| LinkedOption {
                    id: option.id(),
                    correct: option.correct(),
                    active_model: option.into_active_model(),
                })
                .collect(),
            delete: Vec::new(),
        }
    }

    pub fn add_new(&mut self, new: Model::New) {
        let id = Uuid::new_v4();
        let option = LinkedOption {
            id,
            correct: new.correct(),
            active_model: new.into_active_model(self.question_id, id),
        };
        if option.correct {
            self.correct_found = true;
        }
        self.options.insert(self.pos, option);
        self.pos += 1;
    }

    pub fn update_option(&mut self, update: Model::Update) -> Result<(), QuestionError> {
        if let Some(pos) = self.options.iter().position(|x| x.id == update.id()) {
            if pos < self.pos {
                return Err(QuestionError::DuplicateAnswerId(update.id()));
            }
            if let Some(correct) = update.correct() {
                self.options[pos].correct = correct;
            }
            ActiveNewOption::set(&mut self.options[pos].active_model, update);
            if self.options[pos].correct {
                self.correct_found = true;
            }
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

    pub fn require_correct(&self) -> Result<(), QuestionError> {
        match self.correct_found {
            true => Ok(()),
            false => Err(QuestionError::NoCorrectAnswer),
        }
    }

    pub fn require_answers(&self, num: usize) -> Result<(), QuestionError> {
        if self.options.len() < num {
            return Err(QuestionError::NotEnoughAnswers(num));
        }

        Ok(())
    }

    pub async fn execute(self, txn: &DatabaseTransaction) -> Result<Vec<Model>, QuestionError> {
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
