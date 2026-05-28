use {
    crate::question::{
        NewAnswerChoice, QuestionError, UpdateAnswerChoiceEnum,
        answer::{
            ActiveNewOption, LinkedItem, NewOption, OptionModel, UpdateOption,
            choice::{
                UpdateAnswerChoice,
                entity::{ActiveAnswerChoice, AnswerChoiceModel},
            },
            core::UpdateLinkedOptions,
        },
        entity::QuestionModel,
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
}

impl OptionModel for AnswerChoiceModel {
    fn id(&self) -> Uuid {
        self.id
    }
}

impl NewOption for NewAnswerChoice {
    type ActiveModel = ActiveAnswerChoice;

    fn correct(&self) -> bool {
        self.correct
    }

    fn into_active_model(self, question_id: Uuid, id: Uuid) -> Self::ActiveModel {
        ActiveAnswerChoice {
            id: Set(id),
            question: Set(question_id),
            correct: Set(self.correct),
            text: Set(self.text),
            prev: NotSet,
            next: NotSet,
        }
    }
}

impl ActiveNewOption for ActiveAnswerChoice {
    type NewOption = NewAnswerChoice;
    type UpdateOption = UpdateAnswerChoice;
    type Model = AnswerChoiceModel;

    fn set(&mut self, update: Self::UpdateOption) {
        self.text = update.text.into();
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

    async fn insert(self, db: &impl ConnectionTrait) -> Result<Self::Model, DbErr> {
        ActiveModelTrait::insert(self, db).await
    }

    async fn update(self, db: &impl ConnectionTrait) -> Result<Self::Model, DbErr> {
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

impl LinkedItem for QuestionModel {
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

impl UpdateLinkedOptions<ActiveAnswerChoice> {
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
        self.execute(txn).await
    }
}
