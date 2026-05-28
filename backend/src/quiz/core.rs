use {
    crate::{
        error::Error,
        question::{
            QuestionError,
            entity::{QuestionColumn, QuestionEntity},
        },
        quiz::{
            NewQuiz, QuizError, QuizFilter, UpdateQuiz,
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

    pub async fn get(conn: &impl ConnectionTrait, user: Uuid, id: Uuid) -> Result<Self, QuizError> {
        let quiz = QuizEntity::find_by_id(id).one(conn).await?;

        let quiz = quiz.ok_or(QuizError::NotFound)?;
        if quiz.user != user {
            return Err(QuizError::Forbidden);
        }

        Ok(quiz)
    }

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

    pub async fn delete(self, conn: &impl TransactionTrait) -> Result<(), Error> {
        let txn = conn.begin().await.map_err(QuizError::Database)?;

        let questions = self.get_questions(&txn).await?;
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
