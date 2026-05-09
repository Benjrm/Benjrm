use actix_web::{Route, web};

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
        actix_proxy::{IntoHttpResponse, SendRequestError},
        actix_web::{HttpRequest, HttpResponse},
    };

    pub async fn serve_file(req: HttpRequest) -> Result<HttpResponse, SendRequestError> {
        let client = req.app_data::<awc::Client>().unwrap();
        let path = req.path();

        let mut dev_req = client.get(format!("http://localhost:5173{path}"));
        for header in req.headers() {
            dev_req = dev_req.insert_header(header);
        }
        Ok(dev_req.send().await?.into_http_response())
    }
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.default_service(Route::new().to(serve_frontend::serve_file));
}
