use {crate::update_value::UpdateValue, serde::Deserialize, uuid::Uuid};

pub mod core;
pub mod entity;
#[cfg(test)]
mod test;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewAnswerChoice {
    pub text: String,
    #[serde(default)]
    pub correct: bool,
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
