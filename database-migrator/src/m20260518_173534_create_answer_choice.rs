use sea_orm_migration::{prelude::*, schema::*};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table("answer_choice")
                    .if_not_exists()
                    .col(pk_uuid("id"))
                    .col(uuid("question"))
                    .col(boolean("correct").default(false))
                    .col(string("answer"))
                    .col(uuid_null("prev"))
                    .col(uuid_null("next"))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_answer-choice_question")
                            .from_tbl("answer_choice")
                            .from_col("question")
                            .to_tbl("question")
                            .to_col("id")
                            .on_update(ForeignKeyAction::Restrict)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_answer_choice-prev")
                            .from_tbl("answer_choice")
                            .from_col("prev")
                            .to_tbl("answer_choice")
                            .to_col("id")
                            .on_update(ForeignKeyAction::Restrict)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_answer_choice-next")
                            .from_tbl("answer_choice")
                            .from_col("next")
                            .to_tbl("answer_choice")
                            .to_col("id")
                            .on_update(ForeignKeyAction::Restrict)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("answer_choice").to_owned())
            .await
    }
}
