mod actix;
mod error_response;
mod macros;

pub(crate) use macros::impl_err;

pub type Result<T> = std::result::Result<T, Error>;

macros::impl_base_err! {
    Quiz(crate::quiz::QuizError),
}
