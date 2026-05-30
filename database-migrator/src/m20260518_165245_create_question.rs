use sea_orm_migration::{
    prelude::*, schema::*, sea_orm::DbBackend, sea_query::extension::postgres::Type,
};

use crate::col_datetime;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        if manager.get_database_backend() == DbBackend::Postgres {
            manager
                .create_type(
                    Type::create()
                        .as_enum("question_type")
                        .values(["Slide", "SingleChoice", "MultipleChoice", "Order"])
                        .to_owned(),
                )
                .await?;
        }
        manager
            .create_table(
                Table::create()
                    .table("question")
                    .if_not_exists()
                    .col(pk_uuid("id"))
                    .col(uuid("quiz"))
                    .col(enumeration(
                        "type",
                        "question_type",
                        ["Slide", "SingleChoice", "MultipleChoice", "Order"],
                    ))
                    .col(string("question"))
                    .col(boolean("hidden").default(false))
                    .col(uuid_null("prev"))
                    .col(uuid_null("next"))
                    .col(col_datetime(manager, "created").default(Expr::current_timestamp()))
                    .col(col_datetime(manager, "modified").default(Expr::current_timestamp()))
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_question_quiz")
                            .from_tbl("question")
                            .from_col("quiz")
                            .to_tbl("quiz")
                            .to_col("id")
                            .on_update(ForeignKeyAction::Restrict)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_question-prev")
                            .from_tbl("question")
                            .from_col("prev")
                            .to_tbl("question")
                            .to_col("id")
                            .on_update(ForeignKeyAction::Restrict)
                            .on_delete(ForeignKeyAction::Restrict),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .name("fk_question-next")
                            .from_tbl("question")
                            .from_col("next")
                            .to_tbl("question")
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
            .drop_table(Table::drop().table("question").to_owned())
            .await?;

        if manager.get_database_backend() == DbBackend::Postgres {
            manager
            .drop_type(Type::drop().name("question_type").to_owned())
            .await?;
        }

        Ok(())
    }
}
