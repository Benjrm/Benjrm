use {
    super::Result,
    crate::{
        core::Error,
        entities::{prelude::Quiz, quiz},
        update_value::{UpdateOption, UpdateValue},
    },
    sea_orm::{
        ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait,
        IntoActiveModel, ModelTrait, QueryFilter, TransactionTrait, prelude::Uuid,
        sqlx::types::chrono::Utc,
    },
    serde::Deserialize,
};

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct NewQuiz {
    title: String,
    description: Option<String>,
    #[serde(default)]
    hidden: bool,
}

pub async fn create_one(
    conn: &impl ConnectionTrait,
    user: Uuid,
    quiz: NewQuiz,
) -> Result<quiz::Model> {
    let now = Utc::now();
    let quiz = quiz::ActiveModel {
        id: Set(Uuid::new_v4()),
        user: Set(user),
        title: Set(quiz.title),
        description: Set(quiz.description),
        hidden: Set(quiz.hidden),
        created: Set(now),
        modified: Set(now),
    };

    quiz.insert(conn).await.map_err(Error::Database)
}

pub async fn create_many(
    conn: &impl TransactionTrait,
    user: Uuid,
    quizzes: Vec<NewQuiz>,
) -> Result<Vec<quiz::Model>> {
    let tx = conn.begin().await.map_err(Error::Database)?;
    let mut created_quizzes = Vec::with_capacity(quizzes.len());

    for quiz in quizzes.into_iter() {
        let quiz = create_one(&tx, user, quiz).await?;
        created_quizzes.push(quiz);
    }

    tx.commit().await.map_err(Error::Database)?;
    Ok(created_quizzes)
}

#[derive(Deserialize, Debug)]
pub struct QuizFilter {
    hidden: Option<bool>,
}

pub async fn get_many(
    conn: &impl ConnectionTrait,
    user: Uuid,
    filter: QuizFilter,
) -> Result<Vec<quiz::Model>> {
    let mut query = Quiz::find().filter(quiz::Column::User.eq(user));

    if let Some(hidden) = filter.hidden {
        query = query.filter(quiz::Column::Hidden.eq(hidden));
    }

    query.all(conn).await.map_err(Error::Database)
}

pub async fn get_one(conn: &impl ConnectionTrait, user: Uuid, id: Uuid) -> Result<quiz::Model> {
    let quiz = Quiz::find_by_id(id)
        .one(conn)
        .await
        .map_err(Error::Database)?;
    let quiz = quiz.ok_or(Error::NotFound)?;
    if quiz.user != user {
        Err(Error::Forbidden)
    } else {
        Ok(quiz)
    }
}

#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PatchQuiz {
    #[serde(default)]
    title: UpdateValue<String>,
    #[serde(default)]
    description: UpdateOption<String>,
    #[serde(default)]
    hidden: UpdateValue<bool>,
}

pub async fn patch(
    conn: &impl ConnectionTrait,
    user: Uuid,
    id: Uuid,
    patch_quiz: PatchQuiz,
) -> Result<quiz::Model> {
    let mut quiz = get_one(conn, user, id).await?.into_active_model();

    quiz.title = patch_quiz.title.into();
    quiz.description = patch_quiz.description.into();
    quiz.hidden = patch_quiz.hidden.into();

    quiz.update(conn).await.map_err(Error::Database)
}

pub async fn delete(conn: &impl ConnectionTrait, user: Uuid, id: Uuid) -> Result<()> {
    let quiz = get_one(conn, user, id).await?;
    quiz.delete(conn).await.map_err(Error::Database)?;
    Ok(())
}
