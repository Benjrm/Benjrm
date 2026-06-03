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

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
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

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
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

#[derive(Debug, Clone)]
pub struct AnswerOrderModel {
    choice: AnswerChoiceModel,
}

impl Serialize for AnswerOrderModel {
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
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        #[derive(Debug, Clone, Deserialize)]
        #[serde(rename_all = "camelCase")]
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
