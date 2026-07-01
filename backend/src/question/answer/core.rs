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

/// This struct holds, tracks and applies updates to the ordered list of answer options for a question.
pub struct UpdateLinkedOptions<Model: OptionModel> {
    question_id: Uuid,
    pos: usize,
    correct_found: bool,
    pub(super) options: Vec<LinkedOption<Model>>,
    pub(super) delete: Vec<LinkedOption<Model>>,
}

/// Internal representation of an option during update processing.
pub(super) struct LinkedOption<Model: OptionModel> {
    pub(super) id: Uuid,
    correct: bool,
    pub(super) active_model: Model::Active,
}

impl<Model: OptionModel> UpdateLinkedOptions<Model> {
    /// Creates a new instance of [`UpdateLinkedOptions`] with the given question id and a vector of existing options.
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

    /// Inserts a newly created option into the processing list at the current position.
    ///
    /// A new UUID is generated for the option.
    ///
    /// If the option is marked correct, `correct_found` is set to `true`.
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

    /// Updates an existing option in-place.
    ///
    /// The option is located by its ID. If found, its fields are updated.
    /// 
    /// # Errors
    /// - [`QuestionError::AnswerNotFound`] if the option does not exist
    /// - [`QuestionError::DuplicateAnswerId`] if the option appears before the current
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

    /// Marks all remaining unprocessed options for deletion.
    ///
    /// Any option not explicitly added or updated is considered obsolete and moved into the deletion list.
    pub fn delete_remaining(&mut self) {
        for _ in self.pos..self.options.len() {
            self.delete.push(self.options.remove(self.pos));
        }
    }

    /// Updates the linked-list ordering (`prev` / `next`) fields in the database for all options.
    ///
    /// Only changed values are written to avoid unnecessary updates.
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

    /// Ensures that at least one option is marked as correct.
    ///
    /// This is required for most question types, but not for questions of type [`Order`](crate::question::entity::QuestionType::Order).
    ///
    /// # Errors
    /// Returns [`QuestionError::NoCorrectAnswer`] if no correct option was found.
    pub fn require_correct(&self) -> Result<(), QuestionError> {
        match self.correct_found {
            true => Ok(()),
            false => Err(QuestionError::NoCorrectAnswer),
        }
    }

    /// Ensures that at least `num` answer options exist.
    ///
    /// # Errors
    /// Returns [`QuestionError::NotEnoughAnswers`] if the condition is not met.
    pub fn require_answers(&self, num: usize) -> Result<(), QuestionError> {
        if self.options.len() < num {
            return Err(QuestionError::NotEnoughAnswers(num));
        }

        Ok(())
    }

    /// Persist all changes made to the anwer options in the database
    ///
    /// This includes:
    /// - inserting new options
    /// - updating existing options
    /// - updating ordering metadata
    /// - deleting removed options
    ///
    /// # Order of operations
    /// 1. Insert new options
    /// 2. Update existing options
    /// 3. Delete remaining
    ///     1. detach links by setting `prev` and `next` to [`None`]
    ///     2. delete the option
    ///
    /// Then a vector of all persisted options is returned.
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
