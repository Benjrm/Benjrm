use {
    crate::error::Error,
    actix_session::{SessionMiddleware, storage::CookieSessionStore},
    actix_web::{
        App, HttpResponse, HttpServer, Route,
        cookie::{self, SameSite},
        web::{self, JsonConfig, PathConfig},
    },
    awc::http::Method,
};

mod app_data;
mod auth;
mod error;
mod frontend;
mod game_session;
mod question;
mod quiz;
mod static_file;
mod update_value;

pub use app_data::AppData;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let _ = dotenvy::dotenv(); // ignore missing `.env` file
    if cfg!(debug_assertions) {
        // Safety: because this is the start of our program, there are no other threads reading from the environment
        unsafe {
            std::env::set_var("RUST_BACKTRACE", "1");
        }
        env_logger::builder()
            .filter_level(log::LevelFilter::Debug)
            .init();
    } else {
        env_logger::builder()
            .filter_level(log::LevelFilter::Info)
            .init();
    }

    let secret_key = if cfg!(debug_assertions) {
        // constant key for debug builds
        const KEY: [u8; 64] = [
            214, 235, 254, 208, 2, 104, 84, 123, 188, 216, 236, 30, 146, 156, 213, 15, 147, 35,
            130, 11, 141, 202, 130, 20, 211, 63, 205, 136, 81, 195, 0, 80, 80, 42, 206, 22, 171,
            158, 238, 37, 98, 227, 20, 175, 117, 41, 12, 238, 110, 162, 252, 129, 230, 118, 61,
            122, 20, 108, 234, 140, 246, 149, 111, 174,
        ];
        cookie::Key::from(&KEY)
    } else {
        cookie::Key::generate()
    };

    let data = web::Data::new(AppData::from_env().await);

    // Use `PORT` from the environment or default to 80 if not set
    let port = std::env::var("PORT")
        .map(|x| x.parse().expect("Invalid port"))
        .unwrap_or_else(|_| 80);

    HttpServer::new(move || {
        let app = App::new()
            .wrap(actix_web::middleware::Logger::default())
            .app_data(JsonConfig::default().error_handler(Error::json_handler))
            .app_data(PathConfig::default().error_handler(Error::path_handler))
            .wrap(
                SessionMiddleware::builder(CookieSessionStore::default(), secret_key.clone())
                    .cookie_http_only(true)
                    .cookie_same_site(SameSite::Strict)
                    // only require https in release builds
                    .cookie_secure(cfg!(not(debug_assertions)))
                    .build(),
            )
            .app_data(data.clone())
            .configure(auth::init)
            .configure(static_file::init)
            .service(
                web::scope("/api")
                    .route("/health", healthcheck_route())
                    .service(
                        web::scope("/v1")
                            .configure(quiz::init)
                            .configure(question::init)
                            .configure(game_session::init)
                            .route("/health", healthcheck_route())
                            .default_service(not_found_route()),
                    )
                    .default_service(not_found_route()),
            )
            .configure(frontend::init);

        if cfg!(debug_assertions) {
            app.app_data(awc::Client::new())
        } else {
            app
        }
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}

fn healthcheck_route() -> Route {
    Route::new()
        .method(Method::GET)
        .to(async || HttpResponse::Ok().body("OK"))
}

fn not_found_route() -> Route {
    Route::new().to(async || HttpResponse::NotFound().finish())
}
