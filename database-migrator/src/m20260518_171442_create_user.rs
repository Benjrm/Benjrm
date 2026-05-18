use sea_orm_migration::{prelude::*, schema::*};

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
                    .index(Index::create().unique().name("idx_user_subject").col("subject"))
                    .to_owned(),
            )
            .await?;
        manager
            .alter_table(
                TableAlterStatement::new()
                    .table("quiz")
                    .add_foreign_key(
                        &TableForeignKey::new()
                            .name("fk_quiz_user")
                            .from_tbl("quiz")
                            .from_col("user")
                            .to_tbl("user")
                            .to_col("id")
                            .on_delete(ForeignKeyAction::Cascade)
                            .on_update(ForeignKeyAction::Restrict),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager.alter_table(TableAlterStatement::new().table("quiz").drop_foreign_key("fk_quiz_user").to_owned()).await?;
        manager
            .drop_table(Table::drop().table("user").to_owned())
            .await
    }
}
