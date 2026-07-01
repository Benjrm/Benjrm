use {
    crate::AppData,
    actix_web::{HttpResponse, get, web},
    std::path::Path,
};

/// Represents a static file that can be served over HTTP.
///
/// **Hint:** [`StaticFile`] is sensitive to whether a build is debug or not.
/// - **Release:** file is read once and embedded into memory
/// - **Debug:** file is read from disk on each request
///
/// This allows fast, stable production serving while still supporting live file editing during development.
pub struct StaticFile {
    content_type: &'static str,
    content_disposition: String,
    #[cfg(not(debug_assertions))]
    data: &'static [u8],
    #[cfg(debug_assertions)]
    path: std::path::PathBuf,
}

impl StaticFile {
    /// Loads a static file from the given configuration directory.
    ///
    /// The file is identified by `filename` and assigned a fixed content-type.
    ///
    /// ## Behavior
    /// - Release: file is loaded once and stored in memory
    /// - Debug: only the file path is stored and read dynamically
    ///
    /// ## Panics
    /// Panics if the file can't be read in release builds.
    pub async fn new(
        config_dir: impl AsRef<Path>,
        filename: &str,
        content_type: &'static str,
    ) -> Self {
        let path = config_dir.as_ref().join(filename);
        let content_disposition = format!("attachment; filename=\"{filename}\"");
        #[cfg(not(debug_assertions))]
        {
            let data = tokio::fs::read(&path).await;
            let data = match data {
                Ok(data) => Box::leak(Box::new(data)),
                Err(e) => {
                    panic!(
                        r#"error reading config file {filename:?} ({}): {e:?}
set `CONFIG_DIR` to change the config directory.
current directory: {}"#,
                        path.display(),
                        config_dir.as_ref().display()
                    )
                }
            };
            Self {
                content_type,
                content_disposition,
                data,
            }
        }
        #[cfg(debug_assertions)]
        {
            if !path.exists() {
                log::warn!("path {} does not exist", path.display());
            }
            Self {
                content_type,
                content_disposition,
                path,
            }
        }
    }

    /// Builds an HTTP response containing the file contents.
    ///
    /// ## Behavior
    /// - Release: serves embedded in-memory data
    /// - Debug: reads file from disk on every request
    ///
    /// Returns:
    /// - `200 OK` with file content if successful
    /// - `404 Not Found` (debug only) if file is missing
    /// - `500 Internal Server Error` on unexpected I/O errors (debug only)
    pub async fn get_response(&self) -> HttpResponse {
        #[cfg(not(debug_assertions))]
        return HttpResponse::Ok()
            .content_type(self.content_type)
            .insert_header(("Content-Disposition", self.content_disposition.as_str()))
            .body(self.data);
        #[cfg(debug_assertions)]
        {
            match tokio::fs::read(&self.path).await {
                Ok(file) => HttpResponse::Ok()
                    .content_type(self.content_type)
                    .insert_header(("Content-Disposition", self.content_disposition.as_str()))
                    .body(file),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                    HttpResponse::NotFound().finish()
                }
                Err(e) => {
                    log::error!("{e:?}");
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
    }
}

#[get("/imprint.md")]
async fn serve_imprint(app_data: web::Data<AppData>) -> HttpResponse {
    app_data.imprint.get_response().await
}

#[get("/privacy.md")]
async fn serve_privacy(app_data: web::Data<AppData>) -> HttpResponse {
    app_data.privacy.get_response().await
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(serve_imprint);
    cfg.service(serve_privacy);
}
