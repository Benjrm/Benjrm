use {
    crate::{
        error::impl_err,
        update_value::{UpdateOption, UpdateValue},
    },
    sea_orm::DbErr,
    serde::Deserialize,
};

pub use api::init;

mod api;
mod core;
pub mod entity;
#[cfg(test)]
pub mod test;

impl_err! {
    enum QuizError {
        #[error("Quiz not found")]
        NotFound = NOT_FOUND,
        #[error("Forbidden")]
        Forbidden = FORBIDDEN,
        #[error("Internal Server Error")]
        Database(#[from] DbErr) = INTERNAL_SERVER_ERROR,
    }
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NewQuiz {
    title: String,
    description: Option<String>,
    #[serde(default)]
    hidden: bool,
}

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
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

#[derive(Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuizFilter {
    hidden: Option<bool>,
}
