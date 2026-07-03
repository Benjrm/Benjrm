use {
    crate::{
        error::impl_err,
        quiz::entity::QuizModel,
        update_value::{UpdateOption, UpdateValue},
    },
    sea_orm::DbErr,
    serde::{Deserialize, Serialize},
};

pub use api::init;

mod api;
mod core;
pub mod entity;
#[cfg(test)]
pub mod test;

impl_err! {
    /// Error type for quiz errors
    enum QuizError {
        #[error("Quiz not found")]
        NotFound = NOT_FOUND,
        #[error("Forbidden")]
        Forbidden = FORBIDDEN,
        #[error("Internal Server Error")]
        Database(DbErr) = INTERNAL_SERVER_ERROR,
    }
}

/// A struct representing the payload for creating a new quiz.
#[derive(Deserialize, Debug, Clone)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct NewQuiz {
    title: String,
    description: Option<String>,
    #[serde(default)]
    hidden: bool,
}

/// A struct representing an update to an existing quiz.
#[derive(Deserialize, Debug, Clone)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct UpdateQuiz {
    #[serde(default)]
    title: UpdateValue<String>,
    #[serde(default)]
    description: UpdateOption<String>,
    #[serde(default)]
    hidden: UpdateValue<bool>,
}

impl From<NewQuiz> for UpdateQuiz {
    fn from(val: NewQuiz) -> Self {
        UpdateQuiz {
            title: UpdateValue::Set(val.title),
            description: UpdateOption::Set(val.description),
            hidden: UpdateValue::Set(val.hidden),
        }
    }
}

/// This struct holds information to filter a quiz search
#[derive(Deserialize, Debug, Clone)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct QuizFilter {
    pub hidden: Option<bool>,
}

/// A struct to hold a quiz with all its questions
#[derive(Debug, Serialize)]
pub struct Quiz<Question> {
    #[serde(flatten)]
    pub model: QuizModel,
    pub questions: Vec<Question>,
}
