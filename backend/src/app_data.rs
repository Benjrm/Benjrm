pub struct AppData {
    pub db: sea_orm::DbConn,
}

impl AppData {
    pub async fn from_env() -> Self {
        // Setup the database and run the migrator
        let db = {
            use migration::{Migrator, MigratorTrait};
            let database_url = std::env::var("DATABASE_URL")
                .expect(r#"Missing environment variable "DATABASE_URL""#);
            let db = sea_orm::Database::connect(&database_url)
                .await
                .expect("Unable to connect to database");
            Migrator::up(&db, None)
                .await
                .expect("Failed to run migrations");
            db
        };

        Self { db }
    }

    /// For test purposes only.
    /// Create an empty SQLite database in memory
    #[cfg(test)]
    pub async fn test() -> Self {
        let db = {
            use migration::{Migrator, MigratorTrait};
            let db = sea_orm::Database::connect("sqlite::memory:")
                .await
                .expect("Unable to connect to database");
            Migrator::up(&db, None)
                .await
                .expect("Failed to run migrations");
            db
        };
        AppData { db }
    }

    // TODO: remove when adding login
    pub fn dummy_user(&self) -> uuid::Uuid {
        use uuid::Uuid;
        lazy_static::lazy_static! {
            pub static ref DUMMY_USER_UUID: Uuid = Uuid::parse_str("00000000-0000-4000-b000-000000000000").unwrap();
        }

        *DUMMY_USER_UUID
    }
}
