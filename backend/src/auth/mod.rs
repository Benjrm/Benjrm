use {
    actix_session::Session,
    actix_web::{FromRequest, HttpRequest, HttpResponse, ResponseError, dev::Payload, web},
    serde::{Deserialize, Serialize},
    std::{
        fmt,
        future::{Ready, ready},
    },
};

pub mod entity;
pub mod oidc;

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    sub: String,
    #[serde(skip)]
    id_token: Option<String>,
}

impl FromRequest for User {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        fn get_user(req: &HttpRequest) -> Result<User, actix_web::Error> {
            let session = Session::extract(req).into_inner()?;
            let user = session.get("user")?;
            user.ok_or_else(|| {
                RequireLogin {
                    path: req.path().to_owned(),
                }
                .into()
            })
        }
        ready(get_user(req))
    }
}

#[derive(Debug)]
struct RequireLogin {
    path: String,
}

impl fmt::Display for RequireLogin {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Debug::fmt(self, f)
    }
}

impl ResponseError for RequireLogin {
    fn error_response(&self) -> HttpResponse {
        let location = format!(
            "/auth/login?path={}",
            urlencoding::encode(&self.path).as_ref()
        );
        HttpResponse::Found()
            .append_header(("Location", location))
            .finish()
    }
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(web::scope("/auth").configure(oidc::init));
}
