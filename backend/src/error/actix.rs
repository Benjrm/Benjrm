use {
    crate::error::{Error, error_response::ErrorResponse},
    actix_web::{
        HttpRequest, HttpResponse, HttpResponseBuilder, ResponseError,
        error::{JsonPayloadError, PathError, QueryPayloadError},
    },
    awc::http::StatusCode,
};

impl Error {
    /// Converts Actix JSON extraction errors into a standardized API error.
    ///
    /// This function is intended to be used as the [`JsonConfig::error_handler`](actix_web::web::JsonConfig::error_handler) for the application.
    pub fn json_handler(err: JsonPayloadError, _req: &HttpRequest) -> actix_web::Error {
        let error_str = match &err {
            JsonPayloadError::OverflowKnownLength { .. } | JsonPayloadError::Overflow { .. } => {
                "payload_overflow"
            }
            JsonPayloadError::ContentType => "content_type",
            JsonPayloadError::Deserialize(_) => "deserialize",
            JsonPayloadError::Payload(_) => "payload",
            _ => "unknown",
        };

        ErrorResponse {
            status: err.status_code(),
            category: "json_payload",
            error: error_str,
            message: err.to_string(),
        }
        .into()
    }

    /// Converts Actix path extraction errors into a standardized API error.
    ///
    /// This function is intended to be used as the [`PathConfig::error_handler`](actix_web::web::PathConfig::error_handler) for the application.
    pub fn path_handler(err: PathError, _req: &HttpRequest) -> actix_web::Error {
        let error_str = match &err {
            PathError::Deserialize(_) => "deserialize",
            _ => "unknown",
        };

        ErrorResponse {
            status: err.status_code(),
            category: "path",
            error: error_str,
            message: err.to_string(),
        }
        .into()
    }

    /// Converts Actix query payload errors into a standardized API error.
    ///
    /// This function is intended to be used as the [`QueryConfig::error_handler`](actix_web::web::QueryConfig::error_handler) for the application.
    pub fn query_handler(err: QueryPayloadError, _req: &HttpRequest) -> actix_web::Error {
        let error_str = match &err {
            QueryPayloadError::Deserialize(_) => "deserialize",
            _ => "unknown",
        };

        ErrorResponse {
            status: err.status_code(),
            category: "query",
            error: error_str,
            message: err.to_string(),
        }
        .into()
    }
}

impl ResponseError for Error {
    /// Returns the [`StatusCode`] associated with this error.
    fn status_code(&self) -> StatusCode {
        self.status()
    }

    /// Converts this error into an HTTP response.
    ///
    /// Errors are logged at different levels:
    /// - Client errors (`4xx`) are logged as [`Warn`](log::Level::Warn).
    /// - Server errors (`5xx`) are logged as [`Error`](log::Level::Error).
    /// - HTTP `418` responses are logged at the [`Debug`](log::Level::Debug) level for testing purposes.
    fn error_response(&self) -> HttpResponse {
        match self.status_code().as_u16() {
            418 => log::debug!("{self:?}"),
            400..500 => log::warn!("{self:?}"),
            500..600 => log::error!("{self:?}"),
            _ => (),
        }

        ErrorResponse::from(self).error_response()
    }
}

impl ResponseError for ErrorResponse {
    fn error_response(&self) -> HttpResponse {
        HttpResponseBuilder::new(self.status).json(self)
    }
}
