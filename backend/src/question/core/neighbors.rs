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
    serde::Deserialize,
    uuid::Uuid,
};

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Position {
    Prev(Uuid),
    Next(Uuid),
}

pub struct Neighbors {
    prev: Option<QuestionModel>,
    next: Option<QuestionModel>,
}

impl Neighbors {
    pub fn prev_id(&self) -> Option<Uuid> {
        self.prev.as_ref().map(|x| x.id)
    }

    pub fn next_id(&self) -> Option<Uuid> {
        self.next.as_ref().map(|x| x.id)
    }

    pub fn empty() -> Self {
        Self {
            prev: None,
            next: None,
        }
    }

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
