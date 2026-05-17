use {crate::error::Error, awc::http::StatusCode, serde::Serialize, std::fmt};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct ErrorResponse {
    #[serde(skip)]
    pub(super) status: StatusCode,
    pub(super) category: &'static str,
    pub(super) error: &'static str,
    pub(super) message: String,
}

impl From<&Error> for ErrorResponse {
    fn from(value: &Error) -> Self {
        ErrorResponse {
            status: value.status(),
            category: value.category(),
            error: value.error(),
            #[cfg(not(debug_assertions))]
            message: value.to_string(),
            #[cfg(debug_assertions)]
            message: format!("{value:?}"),
        }
    }
}

impl From<Error> for ErrorResponse {
    fn from(value: Error) -> Self {
        Self::from(&value)
    }
}

impl fmt::Display for ErrorResponse {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        fmt::Debug::fmt(self, f)
    }
}
