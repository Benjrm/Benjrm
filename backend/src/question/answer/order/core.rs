use {
    crate::question::{
        LinkedItem, QuestionError,
        answer::{
            ActiveNewOption, NewOption, OptionModel, UpdateOption,
            choice::entity::ActiveAnswerChoice,
            core::UpdateLinkedOptions,
            order::{AnswerOrderModel, NewAnswerOrder, UpdateAnswerOrder, UpdateAnswerOrderEnum},
        },
    },
    sea_orm::{
        ActiveModelTrait,
        ActiveValue::{self, NotSet, Set},
        ConnectionTrait, DatabaseTransaction, DbErr, IntoActiveModel,
    },
    uuid::Uuid,
};

impl IntoActiveModel<ActiveAnswerChoice> for AnswerOrderModel {
    fn into_active_model(self) -> ActiveAnswerChoice {
        self.choice.into_active_model()
    }
}

impl UpdateOption for UpdateAnswerOrder {
    fn id(&self) -> Uuid {
        self.id
    }

    fn correct(&self) -> Option<bool> {
        None
    }
}

impl OptionModel for AnswerOrderModel {
    type Active = ActiveAnswerChoice;
    type New = NewAnswerOrder;
    type Update = UpdateAnswerOrder;

    fn id(&self) -> Uuid {
        self.id
    }

    fn correct(&self) -> bool {
        self.correct
    }
}

impl NewOption<AnswerOrderModel> for NewAnswerOrder {
    type Active = ActiveAnswerChoice;

    /// Returns always `true` because order questions don't define correctness of an answer option.
    ///
    /// This is a workaround to satisfy the [`NewOption`] trait, which requires a `correct` method.
    /// In the context of order questions, the correctness is determined by the order of the answers rather than their individual content.
    /// This is due to the fact that order questions and choice questions are stored in the same tables below and are mostly handled by the same code.
    ///
    /// **Hint**: Const can't be used here because the trait requires a method, not an associated constant.
    #[inline]
    fn correct(&self) -> bool {
        true
    }

    fn into_active_model(self, question_id: Uuid, id: Uuid) -> Self::Active {
        ActiveAnswerChoice {
            id: Set(id),
            question: Set(question_id),
            correct: Set(true),
            answer: Set(self.answer),
            prev: NotSet,
            next: NotSet,
        }
    }
}

impl ActiveNewOption<AnswerOrderModel, UpdateAnswerOrder> for ActiveAnswerChoice {
    fn set(&mut self, update: UpdateAnswerOrder) {
        self.answer = update.answer.into();
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

    async fn insert(self, db: &impl ConnectionTrait) -> Result<AnswerOrderModel, DbErr> {
        ActiveModelTrait::insert(self, db).await.map(Into::into)
    }

    async fn update(self, db: &impl ConnectionTrait) -> Result<AnswerOrderModel, DbErr> {
        ActiveModelTrait::update(self, db).await.map(Into::into)
    }

    async fn delete(self, db: &impl ConnectionTrait) -> Result<(), DbErr> {
        ActiveModelTrait::delete(self, db).await?;
        Ok(())
    }
}

impl LinkedItem for AnswerOrderModel {
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

impl UpdateLinkedOptions<AnswerOrderModel> {
    pub async fn update(
        mut self,
        new: Vec<UpdateAnswerOrderEnum>,
        txn: &DatabaseTransaction,
    ) -> Result<Vec<AnswerOrderModel>, QuestionError> {
        for option in new {
            match option {
                UpdateAnswerOrderEnum::New(option) => self.add_new(option),
                UpdateAnswerOrderEnum::Update(option) => self.update_option(option)?,
            }
        }
        self.delete_remaining();
        self.link_options();
        self.require_answers(2)?;
        self.execute(txn).await
    }
}
