use {
    crate::AppData,
    actix_web::{HttpResponse, get, web},
    std::path::Path,
};

pub struct StaticFile {
    content_type: &'static str,
    content_disposition: String,
    #[cfg(not(debug_assertions))]
    data: &'static [u8],
    #[cfg(debug_assertions)]
    path: std::path::PathBuf,
}

impl StaticFile {
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
