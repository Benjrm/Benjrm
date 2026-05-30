use {
    crate::{
        error::impl_err,
        question::{
            answer::{
                choice::{NewAnswerChoice, UpdateAnswerChoiceEnum, entity::AnswerChoiceModel},
                order::{AnswerOrderModel, NewAnswerOrder, UpdateAnswerOrderEnum},
            },
            core::neighbors::Position,
            entity::{QuestionModel, QuestionType},
        },
        update_value::UpdateValue,
    },
    sea_orm::DbErr,
    serde::{Deserialize, Serialize},
    uuid::Uuid,
};

pub use api::init;

pub mod answer;
mod api;
pub mod core;
pub mod entity;
#[cfg(test)]
pub mod test;

impl_err! {
    enum QuestionError {
        #[error("Question not found")]
        NotFound = NOT_FOUND,
        #[error("Internal Server Error")]
        Database(#[from] DbErr) = INTERNAL_SERVER_ERROR,
        #[error("Question belongs to a other quiz")]
        QuestionBelongsToOtherQuiz = NOT_FOUND,
        #[error("Expected at least one correct answer")]
        NoCorrectAnswer = BAD_REQUEST,
        #[error("Can't sort questions, corrupted list")]
        CorruptedQuestionList = INTERNAL_SERVER_ERROR,
        #[error("Can't sort answers, corrupted list")]
        CorruptedAnswerList = INTERNAL_SERVER_ERROR,
        #[error("Answer not found")]
        AnswerNotFound = NOT_FOUND,
        #[error("Duplicate answer id of `{0}`")]
        DuplicateAnswerId(Uuid) = BAD_REQUEST,
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    #[serde(flatten)]
    pub model: QuestionModel,
    #[serde(flatten)]
    pub options: QuestionOptions,
}

#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum QuestionOptions {
    Slide,
    SingleChoice { options: Vec<AnswerChoiceModel> },
    MultipleChoice { options: Vec<AnswerChoiceModel> },
    Order { options: Vec<AnswerOrderModel> },
}

impl QuestionOptions {
    pub fn get_answer_choice_options(self) -> Vec<AnswerChoiceModel> {
        match self {
            Self::Slide => Vec::new(),
            Self::SingleChoice { options } | Self::MultipleChoice { options } => options,
            Self::Order { options } => options.into_iter().map(Into::into).collect(),
        }
    }

    pub fn get_answer_order_options(self) -> Vec<AnswerOrderModel> {
        match self {
            Self::Slide => Vec::new(),
            Self::SingleChoice { options } | Self::MultipleChoice { options } => {
                options.into_iter().map(Into::into).collect()
            }
            Self::Order { options } => options,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewQuestion {
    pub question: String,
    #[serde(default = "bool::default")]
    pub hidden: bool,
    #[serde(flatten)]
    pub position: Option<Position>,
    #[serde(flatten)]
    pub options: NewQuestionOptions,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NewQuestionOptions {
    Slide,
    SingleChoice { options: Vec<NewAnswerChoice> },
    MultipleChoice { options: Vec<NewAnswerChoice> },
    Order { options: Vec<NewAnswerOrder> },
}

impl NewQuestionOptions {
    pub fn r#type(&self) -> QuestionType {
        match self {
            Self::Slide => QuestionType::Slide,
            Self::SingleChoice { .. } => QuestionType::SingleChoice,
            Self::MultipleChoice { .. } => QuestionType::MultipleChoice,
            Self::Order { .. } => QuestionType::Order,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateQuestion {
    #[serde(default)]
    pub question: UpdateValue<String>,
    #[serde(default)]
    pub hidden: UpdateValue<bool>,
    #[serde(flatten)]
    pub position: Option<Position>,
    #[serde(flatten)]
    pub options: Option<UpdateQuestionOptions>,
}

impl From<NewQuestion> for UpdateQuestion {
    fn from(value: NewQuestion) -> Self {
        Self {
            question: UpdateValue::Set(value.question),
            hidden: UpdateValue::Set(value.hidden),
            position: value.position,
            options: Some(value.options.into()),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UpdateQuestionOptions {
    Slide,
    SingleChoice {
        options: Vec<UpdateAnswerChoiceEnum>,
    },
    MultipleChoice {
        options: Vec<UpdateAnswerChoiceEnum>,
    },
    Order {
        options: Vec<UpdateAnswerOrderEnum>,
    },
}

impl UpdateQuestionOptions {
    pub fn r#type(&self) -> QuestionType {
        match self {
            Self::Slide => QuestionType::Slide,
            Self::SingleChoice { .. } => QuestionType::SingleChoice,
            Self::MultipleChoice { .. } => QuestionType::MultipleChoice,
            Self::Order { .. } => QuestionType::Order,
        }
    }
}

impl From<NewQuestionOptions> for UpdateQuestionOptions {
    fn from(value: NewQuestionOptions) -> Self {
        match value {
            NewQuestionOptions::Slide => Self::Slide,
            NewQuestionOptions::SingleChoice { options } => Self::SingleChoice {
                options: options.into_iter().map(Into::into).collect(),
            },
            NewQuestionOptions::MultipleChoice { options } => Self::MultipleChoice {
                options: options.into_iter().map(Into::into).collect(),
            },
            NewQuestionOptions::Order { options } => Self::Order {
                options: options.into_iter().map(Into::into).collect(),
            },
        }
    }
}

impl QuestionType {
    pub fn get_answer_table(&self) -> Self {
        match self {
            Self::Slide => Self::Slide,
            Self::SingleChoice | Self::MultipleChoice | Self::Order => Self::SingleChoice,
        }
    }
}

pub trait LinkedItem {
    fn id(&self) -> Uuid;
    fn prev(&self) -> Option<Uuid>;
    fn next(&self) -> Option<Uuid>;
}

pub fn sort_linked_items<T: LinkedItem>(mut items: Vec<T>) -> Option<Vec<T>> {
    if items.is_empty() {
        return Some(items);
    }
    let first = items.iter().position(|x| x.prev().is_none())?;
    items.swap(first, 0);
    let mut id = items[0].id();
    for i in 1..items.len() {
        let item = items.iter().position(|x| x.prev() == Some(id))?;
        items.swap(item, i);
        id = items[i].id();
        if items[i - 1].next() != Some(id) {
            return None;
        }
    }
    if items[items.len() - 1].next().is_some() {
        return None;
    }
    Some(items)
}

#[derive(Deserialize, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct QuestionFilter {
    hidden: Option<bool>,
}
