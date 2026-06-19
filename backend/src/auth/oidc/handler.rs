use {
    crate::{
        AppData,
        auth::{
            SessionUser, User,
            entity::{ActiveUser, UserColumn, UserEntity, UserModel},
            oidc::error::Error,
        },
        error::Error as AppError,
        question::entity::{QuestionColumn, QuestionEntity},
        quiz::{QuizError, QuizFilter, entity::{QuizColumn, QuizEntity, QuizModel}},
    },
    actix_session::Session,
    actix_web::{HttpResponse, web},
    chrono::{DateTime, TimeDelta, Utc},
    oauth2::{CsrfToken, PkceCodeVerifier},
    openidconnect::Nonce,
    sea_orm::{
        ActiveModelTrait, ActiveValue::Set, ColumnTrait, ConnectionTrait, EntityTrait,
        PaginatorTrait, QueryFilter, SqlErr,
    },
    serde::{Deserialize, Serialize},
    uuid::Uuid,
};

#[derive(Serialize, Deserialize)]
struct State {
    csrf_token: CsrfToken,
    pkce_verifier: Option<PkceCodeVerifier>,
    nonce: Option<Nonce>,
    time: DateTime<Utc>,
    redirect_path: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
struct Path {
    path: Option<String>,
}

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

#[derive(Debug, Clone, Deserialize)]
struct OauthResponse {
    state: String,
    #[serde(rename = "iss")]
    issuer: String,
    code: String,
}

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

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct UserResponse {
    id: Uuid,
    keycloak_account_url: String,
}

async fn get_user(user: User, data: web::Data<AppData>) -> HttpResponse {
    HttpResponse::Ok().json(UserResponse {
        id: user.id,
        keycloak_account_url: data.oidc.account_url(),
    })
}

async fn delete_user(
    data: web::Data<AppData>,
    session: Session,
    user: User,
) -> Result<HttpResponse, actix_web::Error> {
    let quizzes = QuizModel::get_many(&data.db, user.id, &QuizFilter { hidden: None })
        .await
        .map_err(AppError::from)?;

    for quiz in quizzes {
        quiz.delete(&data.db).await?;
    }

    UserEntity::delete_by_id(user.id)
        .exec(&data.db)
        .await
        .map_err(|e| AppError::from(QuizError::from(e)))?;

    session.purge();

    Ok(HttpResponse::NoContent().finish())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DataSummary {
    quiz_count: u64,
    question_count: u64,
}

async fn get_data_summary(
    user: User,
    data: web::Data<AppData>,
) -> Result<HttpResponse, actix_web::Error> {
    let quiz_ids: Vec<Uuid> = QuizEntity::find()
        .filter(QuizColumn::User.eq(user.id))
        .all(&data.db)
        .await
        .map_err(|e| AppError::from(QuizError::from(e)))?
        .into_iter()
        .map(|q| q.id)
        .collect();

    let quiz_count = quiz_ids.len() as u64;

    let question_count = if quiz_ids.is_empty() {
        0
    } else {
        QuestionEntity::find()
            .filter(QuestionColumn::Quiz.is_in(quiz_ids))
            .count(&data.db)
            .await
            .map_err(|e| AppError::from(QuizError::from(e)))?
    };

    Ok(HttpResponse::Ok().json(DataSummary {
        quiz_count,
        question_count,
    }))
}

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

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.service(web::resource("/login").route(web::get().to(login)));
    cfg.service(web::resource("/oidc/callback").route(web::get().to(callback)));
    cfg.service(web::resource("/logout").route(web::post().to(logout)));
    cfg.service(
        web::resource("/user")
            .route(web::get().to(get_user))
            .route(web::delete().to(delete_user)),
    );
    cfg.service(
        web::resource("/user/data-summary").route(web::get().to(get_data_summary)),
    );

    #[cfg(debug_assertions)]
    cfg.service(web::resource("/login/dummy/{id}").route(web::get().to(dummy_login)));
}
