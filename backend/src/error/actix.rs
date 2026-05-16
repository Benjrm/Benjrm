use {
    crate::error::{Error, error_response::ErrorResponse},
    actix_web::{
        HttpRequest, HttpResponse, HttpResponseBuilder, ResponseError, error::JsonPayloadError,
    },
    awc::http::StatusCode,
};

impl Error {
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
}

impl ResponseError for Error {
    fn status_code(&self) -> StatusCode {
        self.status()
    }

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
