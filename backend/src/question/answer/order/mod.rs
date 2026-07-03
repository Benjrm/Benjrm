use {
    crate::{
        question::answer::choice::{
            NewAnswerChoice, UpdateAnswerChoice, entity::AnswerChoiceModel,
        },
        update_value::UpdateValue,
    },
    serde::{Deserialize, Serialize, ser::SerializeStruct},
    std::ops::{Deref, DerefMut},
    uuid::Uuid,
};

mod core;
#[cfg(test)]
mod test;

/// A struct representing a new answer option for an order question.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct NewAnswerOrder {
    pub answer: String,
}

impl From<NewAnswerOrder> for NewAnswerChoice {
    fn from(value: NewAnswerOrder) -> Self {
        NewAnswerChoice {
            answer: value.answer,
            correct: true,
        }
    }
}

/// A struct representing an update to an existing answer option for an order question.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct UpdateAnswerOrder {
    pub id: Uuid,
    #[serde(default)]
    pub answer: UpdateValue<String>,
}

impl From<UpdateAnswerOrder> for UpdateAnswerChoice {
    fn from(value: UpdateAnswerOrder) -> Self {
        UpdateAnswerChoice {
            id: value.id,
            answer: value.answer,
            correct: UpdateValue::Unset,
        }
    }
}

/// A struct wrapping an [`AnswerChoiceModel`] to represent an answer option for an order question.
///
/// This is necessary because order questions are stored in the same tables as choice questions, and are mostly handled by the same code.
/// This struct allows for different implementations around the [`AnswerChoiceModel`] that are specific to order questions.
#[derive(Debug, Clone)]
pub struct AnswerOrderModel {
    pub choice: AnswerChoiceModel,
}

impl Serialize for AnswerOrderModel {
    /// Serialize the [`AnswerOrderModel`] (i.e. the [`AnswerChoiceModel`]) as a struct with two fields: `id` and `answer`.
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let mut serializer = serializer.serialize_struct("AnswerOrderModel", 2)?;
        serializer.serialize_field("id", &self.choice.id)?;
        serializer.serialize_field("answer", &self.choice.answer)?;
        serializer.end()
    }
}

impl Deref for AnswerOrderModel {
    type Target = AnswerChoiceModel;

    fn deref(&self) -> &Self::Target {
        &self.choice
    }
}

impl DerefMut for AnswerOrderModel {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.choice
    }
}

impl From<AnswerChoiceModel> for AnswerOrderModel {
    fn from(value: AnswerChoiceModel) -> Self {
        AnswerOrderModel { choice: value }
    }
}

impl From<AnswerOrderModel> for AnswerChoiceModel {
    fn from(value: AnswerOrderModel) -> Self {
        value.choice
    }
}

/// A variant of either [`NewAnswerOrder`] or [`UpdateAnswerOrder`] to handle an update to a question that can have new or existing answers.
#[derive(Debug, Clone)]
pub enum UpdateAnswerOrderEnum {
    New(NewAnswerOrder),
    Update(UpdateAnswerOrder),
}

impl From<NewAnswerOrder> for UpdateAnswerOrderEnum {
    fn from(value: NewAnswerOrder) -> Self {
        Self::New(value)
    }
}

impl<'de> Deserialize<'de> for UpdateAnswerOrderEnum {
    /// Custom deserializer to differentiate between [`NewAnswerOrder`] and [`UpdateAnswerOrder`] based on the presence of the `id` field.
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        #[derive(Debug, Clone, Deserialize)]
        #[serde(deny_unknown_fields, rename_all = "camelCase")]
        struct UpdateAnswerOrderDto {
            id: Option<Uuid>,
            answer: Option<String>,
        }

        let dto = UpdateAnswerOrderDto::deserialize(deserializer)?;

        Ok(match dto.id {
            Some(id) => UpdateAnswerOrderEnum::Update(UpdateAnswerOrder {
                id,
                answer: dto.answer.into(),
            }),
            None => {
                use serde::de::Error;
                let answer = dto.answer.ok_or_else(|| {
                    D::Error::custom("field `answer` is required when not supplying field `id`")
                })?;
                UpdateAnswerOrderEnum::New(NewAnswerOrder { answer })
            }
        })
    }
}
