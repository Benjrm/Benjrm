/// Frontend serving layer.
///
/// This module exposes a single Actix handler that serves the frontend application in both production and development modes.
///
/// ## Modes
///
/// - **Release mode (`not(debug_assertions)`):**
///   Serves pre-built static assets embedded into the binary.
///
/// - **Debug mode (`debug_assertions`):**
///   Proxies requests to the frontend development server (e.g. Vite).
use {
    actix_web::{Route, web},
    awc::http::Method,
};

/// Production static file server.
///
/// Serves files embedded at compile time via generated asset map.
/// Falls back to `index.html` for routing.
#[cfg(not(debug_assertions))]
mod serve_frontend {
    use actix_web::{
        HttpRequest, HttpResponse,
        http::{Method, StatusCode},
    };

    include!(concat!(env!("OUT_DIR"), "/generated.rs"));
    lazy_static::lazy_static! {
        static ref DATA: std::collections::HashMap<&'static str, static_files::Resource> = generate();
    }

    /// Serves a static file from embedded frontend assets.
    ///
    /// This only accepts `GET` requests
    pub async fn serve_file(req: HttpRequest) -> HttpResponse {
        if req.method() != Method::GET {
            return HttpResponse::NotFound().finish();
        }
        let path = req.path().trim_matches('/');

        match DATA.get(path).or_else(|| DATA.get("index.html")) {
            Some(file) => {
                let mut resp = HttpResponse::build(StatusCode::OK);
                resp.content_type(file.mime_type);
                resp.body(file.data)
            }
            None => HttpResponse::NotFound().finish(),
        }
    }
}

/// Development proxy for frontend requests.
///
/// Forwards requests to the frontend dev server (typically [Vite](https://vite.dev)),
/// preserving a small subset of HTTP headers.
///
/// Requires an `awc::Client` in Actix application state.
#[cfg(debug_assertions)]
mod serve_frontend {
    use {
        actix_proxy::IntoHttpResponse,
        actix_web::{HttpRequest, HttpResponse},
    };

    /// Forwards the request to the frontend development server.
    ///
    /// By default, requests are forwarded to `http://localhost:5173`.
    /// The host can get rewritten by setting the envioronment variable `FRONTEND_HOST` to something else (e.g. `example.com`).
    pub async fn serve_file(req: HttpRequest) -> HttpResponse {
        let client = match req.app_data::<awc::Client>() {
            Some(client) => client,
            None => {
                return HttpResponse::InternalServerError().body("awc client not available");
            }
        };
        let uri = req.uri();

        const FORWARD_HEADER_NAMES: &[&str] = &[
            "accept",
            "accept-encoding",
            "accept-language",
            "cache-control",
            "user-agent",
        ];
        lazy_static::lazy_static! {
            static ref FRONTEND_HOST: String = std::env::var("FRONTEND_HOST").unwrap_or_else(|_| String::from("localhost"));
        }

        let mut dev_req = client.get(format!("http://{}:5173{uri}", *FRONTEND_HOST));
        for (key, value) in req.headers() {
            if FORWARD_HEADER_NAMES.contains(&key.as_str()) {
                dev_req = dev_req.insert_header((key, value));
            }
        }
        let req = match dev_req.send().await {
            Ok(req) => req,
            Err(e) => {
                return HttpResponse::InternalServerError().body(format!(
                    "Send request error: {e:?}. Is the frontend dev server runing?"
                ));
            }
        };
        req.into_http_response()
    }
}

/// Registers the frontend handler as the default service.
///
/// All unmatched routes are handled by the frontend.
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.default_service(
        Route::new()
            .method(Method::GET)
            .to(serve_frontend::serve_file),
    );
}
