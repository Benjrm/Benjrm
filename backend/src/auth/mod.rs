use {
    crate::{
        error::{Error, impl_err},
        not_found_route,
    },
    actix_session::Session,
    actix_web::{FromRequest, HttpRequest, dev::Payload, web},
    serde::{Deserialize, Serialize},
    std::future::{Ready, ready},
    uuid::Uuid,
};

pub mod entity;
pub mod oidc;

impl_err! {
    enum AuthError {
        #[error("Unauthenticated")]
        Unauthenticated = UNAUTHORIZED,
        #[error("Error extracting sesion")]
        SessionExtract(#[from] actix_web::Error) = INTERNAL_SERVER_ERROR,
        #[error("Error reading authentication from session")]
        SessionGet(#[from] actix_session::SessionGetError) = INTERNAL_SERVER_ERROR,
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct SessionUser {
    id: Uuid,
    id_token: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,
}

impl FromRequest for User {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        fn get_user(req: &HttpRequest) -> Result<User, AuthError> {
            let session = Session::extract(req).into_inner()?;
            let user: Option<SessionUser> = session.get("user")?;
            match user {
                Some(user) => Ok(User { id: user.id }),
                None => Err(AuthError::Unauthenticated),
            }
        }
        ready(get_user(req).map_err(|e| Error::from(e).into()))
    }
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .configure(oidc::init)
            .default_service(not_found_route()),
    );
}
