use {
    crate::quiz::{
        NewQuiz, QuizError, QuizFilter, UpdateQuiz,
        entity::{ActiveQuiz, Quiz, QuizColumn, QuizEntity},
    },
    sea_orm::{
        ActiveModelTrait,
        ActiveValue::{self, Set},
        ColumnTrait, ConnectionTrait, EntityTrait, IntoActiveModel, QueryFilter,
        sqlx::types::chrono::Utc,
    },
    uuid::Uuid,
};

impl Quiz {
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
        model.modified = ActiveValue::set(Utc::now());

        let model = model.update(conn).await?;
        Ok(model)
    }

    pub async fn delete(self, conn: &impl ConnectionTrait) -> Result<(), QuizError> {
        self.into_active_model().delete(conn).await?;
        Ok(())
    }
}
