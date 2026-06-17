mod actix;
mod error_response;
mod macros;

pub(crate) use {error_response::ErrorResponse, macros::impl_err};

pub type Result<T> = std::result::Result<T, Error>;

macros::impl_base_err! {
    Auth(crate::auth::AuthError),
    Quiz(crate::quiz::QuizError),
    Question(crate::question::QuestionError),
    Session(crate::game_session::GameSessionError),
}
