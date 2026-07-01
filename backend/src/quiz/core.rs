use {
    crate::{
        error::Error,
        question::{
            Question, QuestionError, QuestionFilter,
            entity::{QuestionColumn, QuestionEntity},
        },
        quiz::{
            NewQuiz, Quiz, QuizError, QuizFilter, UpdateQuiz,
            entity::{ActiveQuiz, QuizColumn, QuizEntity, QuizModel},
        },
    },
    chrono::DateTime,
    sea_orm::{
        ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, DbErr, EntityTrait,
        IntoActiveModel, QueryFilter, TransactionTrait, sea_query::Expr, sqlx::types::chrono::Utc,
    },
    uuid::Uuid,
};

impl QuizModel {
    /// Creates a new quiz
    pub async fn create(
        conn: &impl ConnectionTrait,
        user: Uuid,
        quiz: NewQuiz,
    ) -> Result<Self, QuizError> {
        let now = Utc::now();
        let quiz = ActiveQuiz {
            id: Set(Uuid::new_v4()),
            user: Set(user),
            title: Set(quiz.title),
            description: Set(quiz.description),
            hidden: Set(quiz.hidden),
            created: Set(now),
            modified: Set(now),
        };

        let quiz = quiz.insert(conn).await?;
        Ok(quiz)
    }

    /// Gets a specific quiz by [`Uuid`].
    pub async fn get(conn: &impl ConnectionTrait, user: Uuid, id: Uuid) -> Result<Self, QuizError> {
        let quiz = QuizEntity::find_by_id(id).one(conn).await?;

        let quiz = quiz.ok_or(QuizError::NotFound)?;
        if quiz.user != user {
            return Err(QuizError::Forbidden);
        }

        Ok(quiz)
    }

    /// Gets all quizzes for a given user
    pub async fn get_many(
        conn: &impl ConnectionTrait,
        user: Uuid,
        filter: &QuizFilter,
    ) -> Result<Vec<Self>, QuizError> {
        let mut query = QuizEntity::find().filter(QuizColumn::User.eq(user));

        if let Some(hidden) = filter.hidden {
            query = query.filter(QuizColumn::Hidden.eq(hidden));
        }

        let quizzes = query.all(conn).await?;
        Ok(quizzes)
    }

    /// Updates a quiz while also updating the [`modified`](QuizModel::modified) field.
    pub async fn update(
        self,
        conn: &impl ConnectionTrait,
        update_quiz: UpdateQuiz,
    ) -> Result<Self, QuizError> {
        let mut model = self.into_active_model();

        model.title = update_quiz.title.into();
        model.description = update_quiz.description.into();
        model.hidden = update_quiz.hidden.into();
        model.modified = Set(Utc::now());

        let model = model.update(conn).await?;
        Ok(model)
    }

    /// Deletes a quiz with all its questions in one database-transaction.
    pub async fn delete(self, conn: &impl TransactionTrait) -> Result<(), Error> {
        let txn = conn.begin().await.map_err(QuizError::Database)?;

        let questions = self.get_questions(&txn, &QuestionFilter::default()).await?;
        for question in questions {
            question.delete_answers(&txn).await?;
        }

        QuestionEntity::update_many()
            .col_expr(QuestionColumn::Next, Expr::value(None::<Uuid>))
            .col_expr(QuestionColumn::Prev, Expr::value(None::<Uuid>))
            .filter(QuestionColumn::Quiz.eq(self.id))
            .exec(&txn)
            .await
            .map_err(QuestionError::Database)?;

        QuestionEntity::delete_many()
            .filter(QuestionColumn::Quiz.eq(self.id))
            .exec(&txn)
            .await
            .map_err(QuestionError::Database)?;

        self.into_active_model()
            .delete(&txn)
            .await
            .map_err(QuizError::Database)?;
        txn.commit().await.map_err(QuizError::Database)?;

        Ok(())
    }

    /// Updates the modified date of a quiz.
    pub async fn update_modified(
        self,
        date: DateTime<Utc>,
        conn: &impl ConnectionTrait,
    ) -> Result<Self, DbErr> {
        let mut model = self.into_active_model();
        model.modified = Set(date);
        model.update(conn).await
    }
}

impl Quiz<Question> {
    /// Gets a quiz with all its questions.
    pub async fn get(
        conn: &impl ConnectionTrait,
        user: Uuid,
        quiz: Uuid,
        question_filter: &QuestionFilter,
    ) -> Result<Self, Error> {
        let model = QuizModel::get(conn, user, quiz).await?;
        let question_models = model.get_questions(conn, question_filter).await?;

        let mut questions = Vec::with_capacity(question_models.len());
        for question_model in question_models {
            let question = question_model.get_answers(conn).await?;
            questions.push(question);
        }

        Ok(Self { model, questions })
    }
}
