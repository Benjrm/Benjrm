pub use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::DatabaseBackend;
mod m20260511_131442_create_user;
mod m20260511_142253_create_quiz;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20260511_131442_create_user::Migration),
            Box::new(m20260511_142253_create_quiz::Migration),
        ]
    }
}

/// Creates an optional DateTime with timezone that works across sqlite, mysql and postgres.
pub fn col_datetime_null(manager: &SchemaManager<'_>, name: &'static str) -> ColumnDef {
    let timestamp = match manager.get_database_backend() {
        DatabaseBackend::Postgres => ColumnType::TimestampWithTimeZone,
        _ => ColumnType::DateTime,
    };

    ColumnDef::new_with_type(name, timestamp).take()
}

/// Creates a DateTime with timezone that works across sqlite, mysql and postgres.
pub fn col_datetime(manager: &SchemaManager<'_>, name: &'static str) -> ColumnDef {
    col_datetime_null(manager, name).not_null().take()
}
