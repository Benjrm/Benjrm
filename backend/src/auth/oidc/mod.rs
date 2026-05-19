use {
    crate::app_data::{env_var, env_var_default},
    actix_security::http::security::{OAuth2Client, OAuth2Config, OAuth2Provider},
    std::env,
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
        const DEFAULT_NAME: &str = "KC_URL and KC_REALM_ID";
        let keycloak = env::var("KC_URL")
            .ok()
            .map(|x| Url::parse(&x).expect("KC_URL"))
            .zip(env::var("KC_REALM_ID").ok());
        let keycloak = keycloak.as_ref();

        let public_url = Url::parse(&env_var("PUBLIC_URL")).expect("PUBLIC_URL");

        let authorization_url = env_var_default("OIDC_AUTHORIZATION_URL", DEFAULT_NAME, || {
            keycloak.map(|(url, realm)| format!("{url}realms/{realm}/protocol/openid-connect/auth"))
        });

        let token_url = env_var_default("OIDC_TOKEN_URL", DEFAULT_NAME, || {
            keycloak
                .map(|(url, realm)| format!("{url}realms/{realm}/protocol/openid-connect/token"))
        });

        let userinfo_url = env_var_default("OIDC_USERINFO_URL", DEFAULT_NAME, || {
            keycloak
                .map(|(url, realm)| format!("{url}realms/{realm}/protocol/openid-connect/token"))
        });

        let issuer_url = env_var_default("OIDC_ISSUER_URL", DEFAULT_NAME, || {
            keycloak.map(|(url, realm)| format!("{url}realms/{realm}"))
        });

        let logout_url = env_var_default("OIDC_LOGOUT_URL", DEFAULT_NAME, || {
            keycloak
                .map(|(url, realm)| format!("{url}realms/{realm}/protocol/openid-connect/logout"))
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
