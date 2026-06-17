use {crate::error::Error, awc::http::StatusCode, serde::Serialize, std::fmt};

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ErrorResponse {
    #[serde(skip)]
    pub status: StatusCode,
    pub category: &'static str,
    pub error: &'static str,
    pub message: String,
}

impl From<&Error> for ErrorResponse {
    fn from(value: &Error) -> Self {
        ErrorResponse {
            status: value.status(),
            category: value.category(),
            error: value.error(),
            message: value.to_string(),
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
