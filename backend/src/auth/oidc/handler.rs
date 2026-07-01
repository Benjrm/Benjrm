use {
    crate::{
        AppData,
        auth::{
            SessionUser, User,
            entity::{ActiveUser, UserColumn, UserEntity, UserModel},
            oidc::error::Error,
        },
        error::Error as AppError,
        quiz::{QuizError, QuizFilter, entity::QuizModel},
    },
    actix_session::Session,
    actix_web::{HttpResponse, web},
    chrono::{DateTime, TimeDelta, Utc},
    oauth2::{CsrfToken, PkceCodeVerifier},
    openidconnect::Nonce,
    sea_orm::{
        ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter,
        SqlErr, TransactionTrait,
    },
    serde::{Deserialize, Serialize},
    uuid::Uuid,
};

/// Struct to hold the state information for OIDC authentication
#[derive(Serialize, Deserialize)]
struct State {
    csrf_token: CsrfToken,
    pkce_verifier: Option<PkceCodeVerifier>,
    nonce: Option<Nonce>,
    time: DateTime<Utc>,
    redirect_path: Option<String>,
}

/// Query parameters accepted by the login endpoint.
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Path {
    path: Option<String>,
}

/// Handle the login request for OIDC authentication
///
/// **Note:** This function stores the before login path to redirect the user back to it after a successfull login.
async fn login(data: web::Data<AppData>, session: Session, path: web::Query<Path>) -> HttpResponse {
    let (auth_url, csrf_token, pkce_verifier, nonce) = data.oidc.client.authorization_url();

    let redirect_path =
        path.into_inner()
            .path
            .or_else(|| match session.get::<State>("oidc_state") {
                Ok(Some(state)) => state.redirect_path,
                _ => None,
            });

    let state = State {
        csrf_token,
        pkce_verifier,
        nonce,
        time: Utc::now(),
        redirect_path,
    };
    session.insert("oidc_state", state).unwrap();

    HttpResponse::Found()
        .append_header(("Location", data.oidc.to_public_idp_url(auth_url).as_str()))
        .finish()
}

/// Struct to hold the OIDC response information after the user has authenticated successfully.
#[derive(Debug, Clone, Deserialize)]
struct OauthResponse {
    state: String,
    #[serde(rename = "iss")]
    issuer: String,
    code: String,
}

/// Handle the callback request for OIDC authentication
///
/// If the [`redirect_path`](State::redirect_path) was previouls set, the user is redirected to that path after a successful login.
/// Only relative paths beginning with `/` are accepted.
/// The default redirect is `/dashboard`, this could be due to a error or unset path.
async fn callback(
    data: web::Data<AppData>,
    session: Session,
    response: web::Query<OauthResponse>,
) -> Result<HttpResponse, Error> {
    let response = response.into_inner();

    let state = session
        .get::<State>("oidc_state")
        .map_err(Error::InvalidState)?
        .ok_or(Error::MissingState)?;

    if response.state != *state.csrf_token.secret() {
        return Err(Error::InvalidCsrfToken);
    }
    if response.issuer != data.oidc.issuer_url.as_str() {
        return Err(Error::InvalidIssuer);
    }
    if Utc::now() - state.time > TimeDelta::minutes(30) {
        return Err(Error::Timeout);
    }

    let (oauth_user, oidc_user) = data
        .oidc
        .client
        .exchange_code(&response.code, state.pkce_verifier, state.nonce.as_ref())
        .await?;

    let user = oidc_user.ok_or(Error::MissingOidcUser(Box::new(oauth_user)))?;

    let db_user = fetch_insert_db_user(&data.db, &user.oauth2_user.sub).await?;

    let user = SessionUser {
        id: db_user.id,
        id_token: user.id_token,
    };
    session.insert("user", user).map_err(Error::SessionInsert)?;
    session.remove("oidc_state");

    let mut location = state.redirect_path.as_deref().unwrap_or("/dashboard");
    if !location.starts_with('/') || location.starts_with("//") {
        location = "/dashboard";
    }

    Ok(HttpResponse::Found()
        .append_header(("Location", location))
        .finish())
}

/// Logs the current user out.
///
/// The local session is always destroyed.
/// If an ID token is available, the user is also redirected to the identity provider's logout endpoint to terminate the remote session before being returned to the application.
async fn logout(data: web::Data<AppData>, session: Session) -> HttpResponse {
    let user = session.get::<SessionUser>("user").ok().flatten();
    session.purge();

    if let Some(user) = user
        && let Some(id_token) = user.id_token
    {
        let mut url = data.oidc.logout_url.clone();
        url.query_pairs_mut()
            .append_pair("id_token_hint", &id_token)
            .append_pair("post_logout_redirect_uri", data.oidc.public_url.as_str());

        return HttpResponse::Found()
            .append_header(("Location", url.as_str()))
            .finish();
    }
    HttpResponse::Found()
        .append_header(("Location", "/"))
        .finish()
}

/// Response returned by the user information endpoint
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UserResponse {
    id: Uuid,
    account_url: Option<String>,
}

/// Returns information about the currently authenticated user.
async fn get_user(user: User, data: web::Data<AppData>) -> HttpResponse {
    HttpResponse::Ok().json(UserResponse {
        id: user.id,
        account_url: data.oidc.account_url(),
    })
}

/// Request body required to confirm account deletion.
///
/// The request must contain `"DELETE"` as the confirmation string.
#[derive(Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct DeleteConfirmation {
    confirmation: String,
}

/// Permanently deletes the authenticated user's account.
///
/// All quizzes owned by the user are deleted before the user record itself.
/// The operation is performed inside a database transaction so that either all resources are removed or none are.
async fn delete_user(
    data: web::Data<AppData>,
    session: Session,
    user: User,
    body: web::Json<DeleteConfirmation>,
) -> Result<HttpResponse, actix_web::Error> {
    if body.confirmation != "DELETE" {
        return Ok(HttpResponse::UnprocessableEntity().finish());
    }

    let txn = data
        .db
        .begin()
        .await
        .map_err(|e| AppError::from(QuizError::from(e)))?;

    let quizzes = QuizModel::get_many(&txn, user.id, &QuizFilter { hidden: None })
        .await
        .map_err(AppError::from)?;

    for quiz in quizzes {
        quiz.delete(&txn).await?;
    }

    UserEntity::delete_by_id(user.id)
        .exec(&txn)
        .await
        .map_err(|e| AppError::from(QuizError::from(e)))?;

    txn.commit()
        .await
        .map_err(|e| AppError::from(QuizError::from(e)))?;

    session.purge();

    Ok(HttpResponse::NoContent().finish())
}

/// Authenticates as a deterministic dummy user.
///
/// This endpoint is only available in debug builds and is intended for local development and testing.
/// The path parameter ([`usize`]) identifies the dummy user, creating it if necessary, and stores it in the current session.
///
/// # Example
///
/// Log in as `dummy_user_1` using curl. Or just type the url in your browser address bar.
/// Unlike the normal login, the user is not redirected uppon success.
/// The dummy login returns the [`SessionUser`].
///
/// ```bash
/// # Authenticate as dummy user 1
/// curl -c cookies.txt http://localhost/login/dummy/1
///
/// # Make an authenticated request using the saved session
/// curl -b cookies.txt http://localhost/user
/// ```
#[cfg(debug_assertions)]
async fn dummy_login(
    data: web::Data<AppData>,
    session: Session,
    path: web::Path<usize>,
) -> Result<HttpResponse, Error> {
    let sub = format!("dummy_user_{}", path.into_inner());

    let db_user = fetch_insert_db_user(&data.db, &sub).await?;

    let user = SessionUser {
        id: db_user.id,
        id_token: Some(sub),
    };
    session
        .insert("user", &user)
        .map_err(Error::SessionInsert)?;
    session.remove("oidc_state");

    Ok(HttpResponse::Ok().json(user))
}

/// Fetch or insert a user into the database based on the provided subject (sub) and return the corresponding [`UserModel`].
///
/// If no user exists for the subject, a new user is created.
/// To handle errors between concurrent login requests, a [UniqueConstraintViolation](SqlErr::UniqueConstraintViolation) during insertion causes the function to fetch the newly created user instead of returning an error.
async fn fetch_insert_db_user(conn: &impl ConnectionTrait, sub: &str) -> Result<UserModel, Error> {
    let fetch_db_user = || {
        UserEntity::find()
            .filter(UserColumn::Subject.eq(sub))
            .one(conn)
    };

    let db_user = match fetch_db_user().await? {
        Some(user) => user,
        None => {
            let now = Utc::now();
            let res = ActiveUser {
                id: Set(Uuid::new_v4()),
                subject: Set(sub.into()),
                registered: Set(now),
                last_login: Set(now),
            }
            .insert(conn)
            .await;

            match res {
                Ok(model) => model,
                Err(e) if matches!(e.sql_err(), Some(SqlErr::UniqueConstraintViolation(_))) => {
                    let db_user = fetch_db_user().await?;
                    db_user.ok_or(Error::FetchDbUser)?
                }
                Err(e) => return Err(e.into()),
            }
        }
    };

    Ok(db_user)
}

/// Registers the authentication-related HTTP routes.
///
/// In debug builds, the dummy login gets also registerd:
/// - `GET /login/dummy/{id}`
pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/login").route(web::get().to(login)));
    cfg.service(web::resource("/oidc/callback").route(web::get().to(callback)));
    cfg.service(web::resource("/logout").route(web::post().to(logout)));
    cfg.service(
        web::resource("/user")
            .route(web::get().to(get_user))
            .route(web::delete().to(delete_user)),
    );

    #[cfg(debug_assertions)]
    cfg.service(web::resource("/login/dummy/{id}").route(web::get().to(dummy_login)));
}
