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
                    .table("user")
                    .if_not_exists()
                    .col(pk_uuid("id"))
                    .col(string("subject"))
                    .col(col_datetime(manager, "registered").default(Expr::current_timestamp()))
                    .col(col_datetime(manager, "last_login").default(Expr::current_timestamp()))
                    .index(
                        Index::create()
                            .unique()
                            .name("idx_user_subject")
                            .col("subject"),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table("user").to_owned())
            .await
    }
}
