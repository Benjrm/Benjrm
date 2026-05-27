use {
    crate::{
        error::impl_err,
        question::{
            answer::choice::entity::AnswerChoiceModel,
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

mod answer;
mod api;
mod core;
pub mod entity;

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
}

impl QuestionOptions {
    pub fn get_answer_choice_options(self) -> Vec<AnswerChoiceModel> {
        match self {
            Self::Slide => Vec::new(),
            Self::SingleChoice { options } => options,
            Self::MultipleChoice { options } => options,
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
#[serde(rename_all = "camelCase")]
pub struct NewAnswerChoice {
    pub text: String,
    #[serde(default)]
    pub correct: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum NewQuestionOptions {
    Slide,
    SingleChoice { options: Vec<NewAnswerChoice> },
    MultipleChoice { options: Vec<NewAnswerChoice> },
}

impl NewQuestionOptions {
    pub fn r#type(&self) -> QuestionType {
        match self {
            Self::Slide => QuestionType::Slide,
            Self::SingleChoice { .. } => QuestionType::SingleChoice,
            Self::MultipleChoice { .. } => QuestionType::MultipleChoice,
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
}

impl UpdateQuestionOptions {
    pub fn r#type(&self) -> QuestionType {
        match self {
            Self::Slide => QuestionType::Slide,
            Self::SingleChoice { .. } => QuestionType::SingleChoice,
            Self::MultipleChoice { .. } => QuestionType::MultipleChoice,
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
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateAnswerChoice {
    pub id: Uuid,
    #[serde(default)]
    pub text: UpdateValue<String>,
    #[serde(default)]
    pub correct: UpdateValue<bool>,
}

#[derive(Debug, Clone)]
pub enum UpdateAnswerChoiceEnum {
    New(NewAnswerChoice),
    Update(UpdateAnswerChoice),
}

impl From<NewAnswerChoice> for UpdateAnswerChoiceEnum {
    fn from(value: NewAnswerChoice) -> Self {
        Self::New(value)
    }
}

impl<'de> Deserialize<'de> for UpdateAnswerChoiceEnum {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        #[derive(Debug, Clone, Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct UpdateAnswerChoiceDto {
            id: Option<Uuid>,
            text: Option<String>,
            correct: Option<bool>,
        }

        let dto = UpdateAnswerChoiceDto::deserialize(deserializer)?;

        Ok(match dto.id {
            Some(id) => UpdateAnswerChoiceEnum::Update(UpdateAnswerChoice {
                id,
                text: dto.text.into(),
                correct: dto.correct.into(),
            }),
            None => {
                use serde::de::Error;
                let text = dto.text.ok_or_else(|| {
                    D::Error::custom("field `text` is required when not supplying field `id`")
                })?;
                let correct = dto.correct.unwrap_or_default();
                UpdateAnswerChoiceEnum::New(NewAnswerChoice { text, correct })
            }
        })
    }
}

impl QuestionType {
    pub fn get_answer_table(&self) -> Self {
        match self {
            Self::Slide => Self::Slide,
            Self::SingleChoice | Self::MultipleChoice => Self::SingleChoice,
        }
    }
}
