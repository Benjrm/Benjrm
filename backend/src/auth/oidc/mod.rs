use {
    crate::app_data::{env_var, env_var_default},
    actix_security::http::security::{OAuth2Client, OAuth2Config, OAuth2Provider},
    serde::Deserialize,
    url::Url,
};

mod error;
mod handler;

pub use handler::init;

pub struct Oidc {
    client: OAuth2Client,
    public_url: Url,
    logout_url: Url,
}

impl Oidc {
    pub async fn from_env() -> Self {
        let issuer_url = Url::parse(&env_var("OIDC_ISSUER_URL")).expect("Parse OIDC_ISSUER_URL");

        let well_known = WellKnown::get(issuer_url.clone()).await;
        let well_known = well_known.as_ref();

        let public_url = Url::parse(&env_var("PUBLIC_URL")).expect("PUBLIC_URL");

        let authorization_url =
            env_var_default("OIDC_AUTHORIZATION_URL", "OIDC_ISSUER_URL", || {
                well_known.map(|well_known| well_known.authorization_endpoint.clone().into())
            });

        let token_url = env_var_default("OIDC_TOKEN_URL", "OIDC_ISSUER_URL", || {
            well_known.map(|well_known| well_known.token_endpoint.clone().into())
        });

        let userinfo_url = env_var_default("OIDC_USERINFO_URL", "OIDC_ISSUER_URL", || {
            well_known.map(|well_known| well_known.userinfo_endpoint.clone().into())
        });

        let logout_url = env_var_default("OIDC_LOGOUT_URL", "OIDC_ISSUER_URL", || {
            well_known.map(|well_known| well_known.end_session_endpoint.clone().into())
        });
        let logout_url = Url::parse(&logout_url).expect("LOGOUT_URL");

        let config = OAuth2Config::new(
            env_var("OIDC_CLIENT_ID"),
            env_var("OIDC_CLIENT_SECRET"),
            format!("{public_url}auth/oidc/callback"),
        )
        .provider(OAuth2Provider::Keycloak)
        .authorization_uri(authorization_url)
        .token_uri(token_url)
        .userinfo_uri(userinfo_url)
        .issuer_uri(issuer_url)
        .scopes(vec!["openid"]);

        let client = OAuth2Client::new(config).await.unwrap();
        if !client.has_oidc() {
            panic!("OIDC server is incorrectly configured or doesn't support OIDC.");
        }

        Self {
            client,
            public_url,
            logout_url,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
struct WellKnown {
    authorization_endpoint: Url,
    token_endpoint: Url,
    userinfo_endpoint: Url,
    end_session_endpoint: Url,
}

impl WellKnown {
    async fn get(issuer_url: Url) -> Option<Self> {
        let mut well_known_url = issuer_url;

        match well_known_url.path_segments_mut() {
            Ok(mut segments) => {
                segments.extend([".well-known", "openid-configuration"]);
            }
            Err(_) => {
                log::error!("Error parsing OIDC_ISSUER_URL");
                return None;
            }
        }

        let response = awc::Client::new().get(well_known_url.as_str()).send().await;
        let mut response = match response {
            Ok(response) => response,
            Err(e) => {
                log::warn!("Error requesting OIDC well-known (url: {well_known_url}): {e:?}");
                return None;
            }
        };

        match response.json().await {
            Ok(well_known) => Some(well_known),
            Err(e) => {
                log::error!("Error parsing OIDC well-known (url: {well_known_url}): {e:?}");
                None
            }
        }
    }
}
