use {
    actix_security::http::security::{OAuth2User, oauth2::OAuth2Error},
    actix_session::{SessionGetError, SessionInsertError},
    actix_web::{HttpResponse, ResponseError},
    sea_orm::DbErr,
    std::fmt,
};

#[derive(Debug)]
pub(super) enum Error {
    MissingState,
    InvalidState(#[allow(dead_code)] SessionGetError),
    InvalidCsrfToken,
    InvalidIssuer,
    Timeout,
    InvalidIdpResponse(#[allow(dead_code)] OAuth2Error),
    MissingOidcUser(#[allow(dead_code)] Box<OAuth2User>),
    SessionInsert(#[allow(dead_code)] SessionInsertError),
    Db(#[allow(dead_code)] DbErr),
    FetchDbUser,
}

impl From<OAuth2Error> for Error {
    fn from(value: OAuth2Error) -> Self {
        Self::InvalidIdpResponse(value)
    }
}

impl From<DbErr> for Error {
    fn from(value: DbErr) -> Self {
        Self::Db(value)
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Debug::fmt(self, f)
    }
}

impl ResponseError for Error {
    fn error_response(&self) -> HttpResponse {
        match self {
            Error::MissingState
            | Error::InvalidState(_)
            | Error::InvalidCsrfToken
            | Error::InvalidIssuer
            | Error::Timeout => {
                log::warn!("Authentication error: {self:?}");
                HttpResponse::Found()
                    .insert_header(("Location", "/auth/login"))
                    .finish()
            }
            Error::InvalidIdpResponse(_)
            | Error::MissingOidcUser(_)
            | Error::SessionInsert(_)
            | Error::Db(_)
            | Error::FetchDbUser => {
                log::error!("Authentication error: {self:?}");
                HttpResponse::InternalServerError()
                    .body("Error communicating with identity provider")
            }
        }
    }
}
