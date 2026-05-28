use {
    actix_web::{Route, web},
    awc::http::Method,
};

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

#[cfg(debug_assertions)]
mod serve_frontend {
    use {
        actix_proxy::IntoHttpResponse,
        actix_web::{HttpRequest, HttpResponse},
    };

    pub async fn serve_file(req: HttpRequest) -> HttpResponse {
        let client = match req.app_data::<awc::Client>() {
            Some(client) => client,
            None => {
                return HttpResponse::InternalServerError().body("awc client not available");
            }
        };
        let uri = req.uri();

        const FORWARD_HEADER_NAMES: &[&str] = &[
            "host",
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

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.default_service(
        Route::new()
            .method(Method::GET)
            .to(serve_frontend::serve_file),
    );
}
