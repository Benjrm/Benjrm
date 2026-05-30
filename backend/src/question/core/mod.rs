use {
    crate::{
        question::{
            LinkedItem, NewQuestion, NewQuestionOptions, Question, QuestionError, QuestionFilter,
            QuestionOptions, UpdateQuestion, UpdateQuestionOptions,
            answer::{
                ActiveNewOption, NewOption, OptionModel,
                choice::entity::{AnswerChoiceColumn, AnswerChoiceEntity},
                core::UpdateLinkedOptions,
            },
            core::neighbors::Neighbors,
            entity::{ActiveQuestion, QuestionEntity, QuestionModel, QuestionType},
            sort_linked_items,
        },
        quiz::entity::QuizModel,
    },
    chrono::Utc,
    sea_orm::{
        ActiveModelTrait,
        ActiveValue::{NotSet, Set},
        ColumnTrait, ConnectionTrait, DatabaseTransaction, EntityTrait, IntoActiveModel,
        ModelTrait, QueryFilter, TransactionTrait,
        sea_query::Expr,
    },
    uuid::Uuid,
};

pub mod neighbors;

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

impl QuizModel {
    pub async fn create_question(
        self,
        conn: &impl TransactionTrait,
        new_question: NewQuestion,
    ) -> Result<Question, QuestionError> {
        let txn = conn.begin().await?;
        let now = Utc::now();

        let mut question = ActiveQuestion {
            id: Set(Uuid::new_v4()),
            quiz: Set(self.id),
            r#type: Set(new_question.options.r#type()),
            question: Set(new_question.question),
            hidden: Set(new_question.hidden),
            prev: NotSet,
            next: NotSet,
            created: Set(now),
            modified: Set(now),
        };

        let neighbors = Neighbors::get_opt(&self, new_question.position, &txn).await?;
        question.prev = Set(neighbors.prev_id());
        question.next = Set(neighbors.next_id());

        let question = question.insert(&txn).await?;
        neighbors.move_between(&txn, question.id).await?;

        let options = match new_question.options {
            NewQuestionOptions::Slide => QuestionOptions::Slide,
            NewQuestionOptions::SingleChoice { options } => QuestionOptions::SingleChoice {
                options: question.insert_options(options, &txn, true).await?,
            },
            NewQuestionOptions::MultipleChoice { options } => QuestionOptions::MultipleChoice {
                options: question.insert_options(options, &txn, true).await?,
            },
            NewQuestionOptions::Order { options } => QuestionOptions::Order {
                options: question.insert_options(options, &txn, false).await?,
            },
        };

        self.update_modified(now, &txn).await?;

        txn.commit().await?;

        Ok(Question {
            model: question,
            options,
        })
    }

    pub async fn get_question(
        &self,
        conn: &impl ConnectionTrait,
        question: Uuid,
    ) -> Result<QuestionModel, QuestionError> {
        let question = QuestionEntity::find_by_id(question).one(conn).await?;
        match question {
            Some(question) => {
                if question.quiz != self.id {
                    Err(QuestionError::QuestionBelongsToOtherQuiz)
                } else {
                    Ok(question)
                }
            }
            None => Err(QuestionError::NotFound),
        }
    }

    pub async fn get_questions(
        &self,
        conn: &impl ConnectionTrait,
        filter: &QuestionFilter,
    ) -> Result<Vec<QuestionModel>, QuestionError> {
        let models = self.find_related(QuestionEntity).all(conn).await?;
        let mut questions =
            sort_linked_items(models).ok_or(QuestionError::CorruptedQuestionList)?;

        if let Some(hidden) = filter.hidden {
            questions.retain(|x| x.hidden == hidden);
        }

        Ok(questions)
    }
}

impl QuestionModel {
    async fn insert_options<Model: OptionModel, New: NewOption<Model>>(
        &self,
        new_options: Vec<New>,
        txn: &DatabaseTransaction,
        require_correct: bool,
    ) -> Result<Vec<Model>, QuestionError> {
        if new_options.len() < 2 {
            return Err(QuestionError::NotEnoughAnswers(2));
        }

        let mut option_models = Vec::with_capacity(new_options.len());
        let mut correct_found = false;
        for option in new_options {
            if option.correct() {
                correct_found = true;
            }
            let active_model = option.into_active_model(self.id, Uuid::new_v4());
            let model = ActiveNewOption::insert(active_model, txn).await?;
            option_models.push(model);
        }
        if require_correct && !correct_found {
            return Err(QuestionError::NoCorrectAnswer);
        }

        for i in 0..option_models.len() {
            let mut model = option_models[i].clone().into_active_model();
            if i > 0 {
                model.set_prev(Some(option_models[i - 1].id()));
            }
            if i < option_models.len() - 1 {
                model.set_next(Some(option_models[i + 1].id()));
            }
            option_models[i] = ActiveNewOption::update(model, txn).await?;
        }

        Ok(option_models)
    }

    pub async fn get_answers(self, conn: &impl ConnectionTrait) -> Result<Question, QuestionError> {
        let options = match self.r#type {
            QuestionType::Slide => QuestionOptions::Slide,
            QuestionType::SingleChoice => {
                let models = self.find_related(AnswerChoiceEntity).all(conn).await?;
                let models = sort_linked_items(models).ok_or(QuestionError::CorruptedAnswerList)?;
                QuestionOptions::SingleChoice { options: models }
            }
            QuestionType::MultipleChoice => {
                let models = self.find_related(AnswerChoiceEntity).all(conn).await?;
                let models = sort_linked_items(models).ok_or(QuestionError::CorruptedAnswerList)?;
                QuestionOptions::MultipleChoice { options: models }
            }
            QuestionType::Order => {
                let models = self.find_related(AnswerChoiceEntity).all(conn).await?;
                let models = sort_linked_items(models).ok_or(QuestionError::CorruptedAnswerList)?;
                let models = models.into_iter().map(Into::into).collect();
                QuestionOptions::Order { options: models }
            }
        };

        Ok(Question {
            model: self,
            options,
        })
    }

    pub async fn delete_answers(&self, txn: &DatabaseTransaction) -> Result<(), QuestionError> {
        match self.r#type {
            QuestionType::Slide => (),
            QuestionType::SingleChoice | QuestionType::MultipleChoice | QuestionType::Order => {
                AnswerChoiceEntity::update_many()
                    .col_expr(AnswerChoiceColumn::Next, Expr::value(None::<Uuid>))
                    .col_expr(AnswerChoiceColumn::Prev, Expr::value(None::<Uuid>))
                    .filter(AnswerChoiceColumn::Question.eq(self.id))
                    .exec(txn)
                    .await?;

                AnswerChoiceEntity::delete_many()
                    .filter(AnswerChoiceColumn::Question.eq(self.id))
                    .exec(txn)
                    .await?;
            }
        }

        Ok(())
    }

    pub async fn delete(
        self,
        quiz: QuizModel,
        conn: &impl TransactionTrait,
    ) -> Result<(), QuestionError> {
        let txn = conn.begin().await?;
        self.delete_answers(&txn).await?;
        self.into_active_model().delete(&txn).await?;
        quiz.update_modified(Utc::now(), &txn).await?;
        txn.commit().await?;
        Ok(())
    }
}

impl Question {
    pub async fn update(
        mut self,
        quiz: QuizModel,
        conn: &impl TransactionTrait,
        update_question: UpdateQuestion,
    ) -> Result<Self, QuestionError> {
        let id = self.model.id;
        let txn = conn.begin().await?;

        let neighbors = if let Some(pos) = update_question.position {
            Neighbors::remove_links(&self.model, &txn).await?;
            Some(Neighbors::get(&quiz, pos, &txn).await?)
        } else {
            None
        };

        if let Some(options) = &update_question.options
            && options.r#type().get_answer_table() != self.model.r#type.get_answer_table()
        {
            self.model.delete_answers(&txn).await?;
        }

        let now = Utc::now();
        let mut model = self.model.into_active_model();
        model.question = update_question.question.into();
        model.hidden = update_question.hidden.into();
        model.modified = Set(now);

        if let Some(neighbors) = neighbors {
            model.prev = Set(neighbors.prev_id());
            model.next = Set(neighbors.next_id());
            neighbors.move_between(&txn, id).await?;
        }

        if let Some(options) = update_question.options {
            model.r#type = Set(options.r#type());
            self.options = match options {
                UpdateQuestionOptions::Slide => QuestionOptions::Slide,
                UpdateQuestionOptions::SingleChoice { options } => QuestionOptions::SingleChoice {
                    options: UpdateLinkedOptions::new(id, self.options.get_answer_choice_options())
                        .update(options, &txn)
                        .await?,
                },
                UpdateQuestionOptions::MultipleChoice { options } => {
                    QuestionOptions::MultipleChoice {
                        options: UpdateLinkedOptions::new(
                            id,
                            self.options.get_answer_choice_options(),
                        )
                        .update(options, &txn)
                        .await?,
                    }
                }
                UpdateQuestionOptions::Order { options } => QuestionOptions::Order {
                    options: UpdateLinkedOptions::new(id, self.options.get_answer_order_options())
                        .update(options, &txn)
                        .await?,
                },
            };
        }
        let model = model.update(&txn).await?;
        quiz.update_modified(now, &txn).await?;

        txn.commit().await?;
        Ok(Question {
            model,
            options: self.options,
        })
    }
}
