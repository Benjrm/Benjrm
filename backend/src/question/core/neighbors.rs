use {
    crate::{
        question::{
            QuestionError, QuestionFilter,
            entity::{ActiveQuestion, QuestionModel},
        },
        quiz::entity::QuizModel,
    },
    sea_orm::{
        ActiveModelTrait,
        ActiveValue::{Set, Unchanged},
        ConnectionTrait, DatabaseTransaction, IntoActiveModel,
    },
    serde::{Deserialize, Deserializer},
    uuid::Uuid,
};

/// A struct representing a liked list of Uuids, which can be used to modify questions in a quiz by specifying the position of a question relative to its neighbors.
#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub enum Position {
    Prev(Uuid),
    Next(Uuid),
}

impl Position {
    /// A custom deserializer for an optional [`Position`] that expects exactly one of `prev` or `next` to be present in the input.
    pub fn deserialize_optional<'de, D>(deserializer: D) -> Result<Option<Self>, D::Error>
    where
        D: Deserializer<'de>,
    {
        #[derive(Deserialize)]
        #[serde(deny_unknown_fields, rename_all = "camelCase")]
        struct RawPosition {
            prev: Option<Uuid>,
            next: Option<Uuid>,
        }
        let raw = RawPosition::deserialize(deserializer)?;

        match (raw.prev, raw.next) {
            (Some(p), None) => Ok(Some(Position::Prev(p))),
            (None, Some(n)) => Ok(Some(Position::Next(n))),
            (None, None) => Ok(None),
            _ => Err(serde::de::Error::custom(
                "expected exactly one of `prev` or `next`",
            )),
        }
    }
}

/// A struct representing a doubly linked list of questions.
pub struct Neighbors {
    prev: Option<QuestionModel>,
    next: Option<QuestionModel>,
}

impl Neighbors {
    /// Returns the [`Uuid`](QuestionModel::id) of the previous question.
    ///
    /// This may be [`None`] if the current question is the first question in the quiz.
    pub fn prev_id(&self) -> Option<Uuid> {
        self.prev.as_ref().map(|x| x.id)
    }

    /// Returns the [`Uuid`](QuestionModel::id) of the next question.
    ///
    /// This may be [`None`] if the current question is the last question in the quiz
    pub fn next_id(&self) -> Option<Uuid> {
        self.next.as_ref().map(|x| x.id)
    }

    /// Returns a new [`Neighbors`] instance with no linked questions.
    pub fn empty() -> Self {
        Self {
            prev: None,
            next: None,
        }
    }

    /// Retrieves the neighboring questions of a given question in a quiz, based on the specified [`Position`] (either the previous or next question).
    pub async fn get(
        quiz: &QuizModel,
        pos: Position,
        conn: &impl ConnectionTrait,
    ) -> Result<Neighbors, QuestionError> {
        match pos {
            Position::Prev(prev) => {
                let prev = quiz.get_question(conn, prev).await?;
                let next = match prev.next {
                    Some(next) => Some(quiz.get_question(conn, next).await?),
                    None => None,
                };
                Ok(Neighbors {
                    prev: Some(prev),
                    next,
                })
            }
            Position::Next(next) => {
                let next = quiz.get_question(conn, next).await?;
                let prev = match next.prev {
                    Some(prev) => Some(quiz.get_question(conn, prev).await?),
                    None => None,
                };
                Ok(Neighbors {
                    prev,
                    next: Some(next),
                })
            }
        }
    }

    /// Retrieves the neighboring questions if a position is specified, or the last question in the quiz if no position is specified.
    pub async fn get_opt(
        quiz: &QuizModel,
        pos: Option<Position>,
        conn: &impl ConnectionTrait,
    ) -> Result<Neighbors, QuestionError> {
        match pos {
            Some(pos) => Self::get(quiz, pos, conn).await,
            None => {
                let mut questions = quiz.get_questions(conn, &QuestionFilter::default()).await?;
                if let Some(model) = questions.pop() {
                    Ok(Neighbors {
                        prev: Some(model),
                        next: None,
                    })
                } else {
                    Ok(Neighbors::empty())
                }
            }
        }
    }

    /// Moves a new question by its id between the current neighbors, updating the `prev` and `next` fields of the neighboring questions in the database.
    pub async fn move_between(
        self,
        txn: &DatabaseTransaction,
        id: Uuid,
    ) -> Result<(), QuestionError> {
        if let Some(prev) = self.prev {
            let mut model = prev.into_active_model();
            model.next = Set(Some(id));
            model.update(txn).await?;
        }
        if let Some(next) = self.next {
            let mut model = next.into_active_model();
            model.prev = Set(Some(id));
            model.update(txn).await?;
        }
        Ok(())
    }

    /// Removes the current question from the linked list.
    /// Remaining questions will be linked together.
    pub async fn remove_links(
        question: &QuestionModel,
        txn: &DatabaseTransaction,
    ) -> Result<(), QuestionError> {
        if let Some(prev) = question.prev {
            ActiveQuestion {
                id: Unchanged(prev),
                next: Set(question.next),
                ..Default::default()
            }
            .update(txn)
            .await?;
        }

        if let Some(next) = question.next {
            ActiveQuestion {
                id: Unchanged(next),
                prev: Set(question.prev),
                ..Default::default()
            }
            .update(txn)
            .await?;
        }
        Ok(())
    }
}
