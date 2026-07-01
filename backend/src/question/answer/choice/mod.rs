use {crate::update_value::UpdateValue, serde::Deserialize, uuid::Uuid};

pub mod core;
pub mod entity;
#[cfg(test)]
mod test;

/// A struct representing a new answer for a choice question.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct NewAnswerChoice {
    pub answer: String,
    #[serde(default)]
    pub correct: bool,
}

/// A struct representing an update to an existing answer for a choice question.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct UpdateAnswerChoice {
    pub id: Uuid,
    #[serde(default)]
    pub answer: UpdateValue<String>,
    #[serde(default)]
    pub correct: UpdateValue<bool>,
}

/// A variant of either [`NewAnswerChoice`] or [`UpdateAnswerChoice`] to handle a update to a question that can have new or existing answers.
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
    /// Custom deserializer to differentiate between [`NewAnswerChoice`] and [`UpdateAnswerChoice`] based on the presence of the `id` field.
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        #[derive(Debug, Clone, Deserialize)]
        #[serde(deny_unknown_fields, rename_all = "camelCase")]
        struct UpdateAnswerChoiceDto {
            id: Option<Uuid>,
            answer: Option<String>,
            correct: Option<bool>,
        }

        let dto = UpdateAnswerChoiceDto::deserialize(deserializer)?;

        Ok(match dto.id {
            Some(id) => UpdateAnswerChoiceEnum::Update(UpdateAnswerChoice {
                id,
                answer: dto.answer.into(),
                correct: dto.correct.into(),
            }),
            None => {
                use serde::de::Error;
                let answer = dto.answer.ok_or_else(|| {
                    D::Error::custom("field `answer` is required when not supplying field `id`")
                })?;
                let correct = dto.correct.unwrap_or_default();
                UpdateAnswerChoiceEnum::New(NewAnswerChoice { answer, correct })
            }
        })
    }
}
