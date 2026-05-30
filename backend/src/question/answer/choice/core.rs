use {
    crate::question::{
        LinkedItem, NewAnswerChoice, QuestionError, UpdateAnswerChoiceEnum,
        answer::{
            ActiveNewOption, NewOption, OptionModel, UpdateOption,
            choice::{
                UpdateAnswerChoice,
                entity::{ActiveAnswerChoice, AnswerChoiceModel},
            },
            core::UpdateLinkedOptions,
        },
    },
    sea_orm::{
        ActiveModelTrait,
        ActiveValue::{self, NotSet, Set},
        ConnectionTrait, DatabaseTransaction, DbErr,
    },
    uuid::Uuid,
};

impl UpdateOption for UpdateAnswerChoice {
    fn id(&self) -> Uuid {
        self.id
    }

    fn correct(&self) -> Option<bool> {
        self.correct.into()
    }
}

impl OptionModel for AnswerChoiceModel {
    type Active = ActiveAnswerChoice;
    type New = NewAnswerChoice;
    type Update = UpdateAnswerChoice;

    fn id(&self) -> Uuid {
        self.id
    }

    fn correct(&self) -> bool {
        self.correct
    }
}

impl NewOption<AnswerChoiceModel> for NewAnswerChoice {
    type Active = ActiveAnswerChoice;

    fn correct(&self) -> bool {
        self.correct
    }

    fn into_active_model(self, question_id: Uuid, id: Uuid) -> Self::Active {
        ActiveAnswerChoice {
            id: Set(id),
            question: Set(question_id),
            correct: Set(self.correct),
            answer: Set(self.answer),
            prev: NotSet,
            next: NotSet,
        }
    }
}

impl ActiveNewOption<AnswerChoiceModel, UpdateAnswerChoice> for ActiveAnswerChoice {
    fn set(&mut self, update: UpdateAnswerChoice) {
        self.answer = update.answer.into();
        self.correct = update.correct.into();
    }

    fn id(&self) -> &ActiveValue<Uuid> {
        &self.id
    }

    fn prev(&self) -> &ActiveValue<Option<Uuid>> {
        &self.prev
    }

    fn set_prev(&mut self, prev: Option<Uuid>) {
        self.prev = Set(prev);
    }

    fn next(&self) -> &ActiveValue<Option<Uuid>> {
        &self.next
    }

    fn set_next(&mut self, next: Option<Uuid>) {
        self.next = Set(next);
    }

    async fn insert(self, db: &impl ConnectionTrait) -> Result<AnswerChoiceModel, DbErr> {
        ActiveModelTrait::insert(self, db).await
    }

    async fn update(self, db: &impl ConnectionTrait) -> Result<AnswerChoiceModel, DbErr> {
        ActiveModelTrait::update(self, db).await
    }

    async fn delete(self, db: &impl ConnectionTrait) -> Result<(), DbErr> {
        ActiveModelTrait::delete(self, db).await?;
        Ok(())
    }
}

impl LinkedItem for AnswerChoiceModel {
    fn id(&self) -> Uuid {
        self.id
    }

    fn prev(&self) -> Option<Uuid> {
        self.prev
    }

    fn next(&self) -> Option<Uuid> {
        self.next
    }
}

impl UpdateLinkedOptions<AnswerChoiceModel> {
    pub async fn update(
        mut self,
        new: Vec<UpdateAnswerChoiceEnum>,
        txn: &DatabaseTransaction,
    ) -> Result<Vec<AnswerChoiceModel>, QuestionError> {
        for option in new {
            match option {
                UpdateAnswerChoiceEnum::New(option) => self.add_new(option),
                UpdateAnswerChoiceEnum::Update(option) => self.update_option(option)?,
            }
        }
        self.delete_remaining();
        self.link_options();
        self.require_correct()?;
        self.require_answers(2)?;
        self.execute(txn).await
    }
}
