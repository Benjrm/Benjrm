use {
    crate::{auth::oidc::Oidc, game_session::GameSessions, static_file::StaticFile},
    std::path::PathBuf,
};

/// Application-wide shared state.
///
/// [`AppData`] is constructed once at startup and passed into handlers.
/// It contains all core services required by the application, including:
/// - database connection and migrations
/// - authentication
/// - static content
/// - in-memory game session storage
pub struct AppData {
    pub db: sea_orm::DbConn,
    pub imprint: StaticFile,
    pub privacy: StaticFile,
    pub oidc: Oidc,
    pub game_sessions: GameSessions,
}

impl AppData {
    /// Creates application state from environment configuration.
    ///
    /// This will:
    /// - read configuration paths from `CONFIG_DIR`
    /// - connect to the database using `DATABASE_URL`
    /// - run database migrations
    /// - load static content
    /// - initialize authentication
    /// - create in-memory game session storage
    pub async fn from_env() -> Self {
        let config_dir = PathBuf::from(std::env::var("CONFIG_DIR").unwrap_or(String::from(".")));
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

        let imprint = StaticFile::new(&config_dir, "imprint.md", "text/markdown").await;
        let privacy = StaticFile::new(&config_dir, "privacy.md", "text/markdown").await;

        let oidc = Oidc::from_env().await;

        let game_sessions = GameSessions::new();

        Self {
            db,
            imprint,
            privacy,
            oidc,
            game_sessions,
        }
    }
}

/// Test-only application state container.
///
/// Uses an in-memory SQLite database and minimal dependencies suitable for isolated tests.
#[cfg(test)]
pub struct TestAppData {
    pub db: sea_orm::DbConn,
    pub game_sessions: GameSessions,
}

#[cfg(test)]
impl TestAppData {
    /// For test purposes only.
    /// Create an empty SQLite database in memory
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

        let game_sessions = GameSessions::new();

        TestAppData { db, game_sessions }
    }

    /// Inserts and returns a dummy user Uuid in the database.
    ///
    /// Useful for tests that require authenticated users.
    pub async fn dummy_user_id(&self) -> uuid::Uuid {
        use {
            crate::auth::entity::ActiveUser,
            chrono::Utc,
            sea_orm::{ActiveModelTrait, ActiveValue::Set},
            uuid::Uuid,
        };

        let id = Uuid::new_v4();
        let now = Utc::now();
        let user = ActiveUser {
            id: Set(id),
            subject: Set(id.to_string()),
            registered: Set(now),
            last_login: Set(now),
        }
        .insert(&self.db)
        .await
        .unwrap();

        user.id
    }

    /// Inserts a dummy user id and returns a full dummy [`User`](crate::auth::User).
    ///
    /// Useful for tests that require authenticated users.
    pub async fn dummy_user(&self) -> crate::auth::User {
        let id = self.dummy_user_id().await;
        crate::auth::User { id }
    }
}

/// Get an environment variable and display a readable error if variable is not set
pub fn env_var(key: &str) -> String {
    match std::env::var(key) {
        Ok(x) => x,
        Err(_) => {
            panic!("Missing environement variable: {key}");
        }
    }
}

/// Get an environment variable and use a generated default if variable is not set.
/// If the default is also unavailable, display a readable error containing which
/// variable is missing and which variable can be set to use the generated default.
///
/// # Arguments
///
/// - `key` - Name of the environment variable
/// - `default_name` - Name of the environment variable required to generate a default value. Can also be "FIRST_VAR and SECOND_VAR".
/// - `default` - Function to generate the default value
pub fn env_var_default(
    key: &str,
    default_name: &str,
    r#default: impl FnOnce() -> Option<String>,
) -> String {
    match std::env::var(key) {
        Ok(x) => x,
        Err(_) => match r#default() {
            Some(x) => x,
            None => {
                panic!(
                    "Missing environement variable: {key} (set {default_name} to use a generated default)"
                )
            }
        },
    }
}
