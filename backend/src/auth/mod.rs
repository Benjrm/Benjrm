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
    /// Error type for authentication errors
    enum AuthError {
        #[error("Unauthenticated")]
        Unauthenticated = UNAUTHORIZED,
        #[error("Error extracting session")]
        SessionExtract(#[from] actix_web::Error) = INTERNAL_SERVER_ERROR,
        #[error("Error reading authentication from session")]
        SessionGet(#[from] actix_session::SessionGetError) = INTERNAL_SERVER_ERROR,
    }
}

/// Struct to hold the user information extracted from the session
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct SessionUser {
    id: Uuid,
    id_token: Option<String>,
}

/// Struct to hold the user information used in the application
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct User {
    pub id: Uuid,
}

impl PartialEq for User {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}

impl Eq for User {}

impl FromRequest for User {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    /// This function retrieves the user information from the session and returns it as a [`User`] struct.
    /// If the user is not authenticated or if there is an error extracting the session, it returns an appropriate error.
    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        fn get_user(req: &HttpRequest) -> Result<User, AuthError> {
            let session = Session::extract(req).into_inner()?;
            let user: Option<SessionUser> = session.get("user")?;
            AuthError::Unauthenticated.status();
            match user {
                Some(user) => Ok(User { id: user.id }),
                None => Err(AuthError::Unauthenticated),
            }
        }
        ready(get_user(req).map_err(|e| Error::from(e).into()))
    }
}

/// An optional authenticated user extracted from the current session.
///
/// This extractor attempts to read the authenticated user from the request's session.
/// If a user is present, it returns `OptionalUser(Some(User))`.
/// If no user is stored in the session, it returns `OptionalUser(None)`.
///
/// **Note:** [`OptionalUser`] implements [`Into<Option<User>>`].
pub struct OptionalUser(Option<User>);

impl FromRequest for OptionalUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        fn get_user(req: &HttpRequest) -> Result<OptionalUser, AuthError> {
            let session = Session::extract(req).into_inner()?;
            let user: Option<SessionUser> = session.get("user")?;
            match user {
                Some(user) => Ok(OptionalUser(Some(User { id: user.id }))),
                None => Ok(OptionalUser(None)),
            }
        }
        ready(get_user(req).map_err(|e| Error::from(e).into()))
    }
}

impl From<OptionalUser> for Option<User> {
    fn from(value: OptionalUser) -> Self {
        value.0
    }
}

/// Initialize the authentication routes
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .configure(oidc::init)
            .default_service(not_found_route()),
    );
}
