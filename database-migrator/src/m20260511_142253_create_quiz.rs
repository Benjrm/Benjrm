use sea_orm_migration::{prelude::*, schema::*};

use crate::col_datetime;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table("quiz")
                    .if_not_exists()
                    .col(pk_uuid("id"))
                    .col(uuid("user"))
                    .col(string("title"))
                    .col(text_null("description"))
                    .col(boolean("hidden").default(false))
                    .col(col_datetime(manager, "created").default(Expr::current_timestamp()))
                    .col(col_datetime(manager, "modified").default(Expr::current_timestamp()))
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("quiz").to_owned())
            .await
    }
}
