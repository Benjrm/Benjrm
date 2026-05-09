# Identity Provider - Keycloak
1. [JSON Schema for Keycloak Import/Export - GitHub Repository](https://github.com/jirutka/keycloak-json-schema)
2. [JSON Schema for Keycloak Import/Export - Schemas](https://jirutka.github.io/keycloak-json-schema/)
3. [JSON Schema for Keycloak Import/Export - Keycloak Version 26](assets/keycloak-realm-26.json)
4. [All configuration options for Keycloak](https://www.keycloak.org/server/all-config)
5. [Observability - Health Check endppints](https://www.keycloak.org/observability/health)
6. [Securing applications and services with OpenID Connect](https://www.keycloak.org/securing-apps/oidc-layers)

## How it should be integrated with the application
1. Keycloak's health management interface runs on http port 9000 and exposes health check endpoints.
External traffic to this port should be blocked with a reverse proxy.

## Endpoints
1. {BASE_URL}/realms/{REALM_NAME}/.well-known/openid-configuration

## Realm Configuration
1. **"realm": "benjrm"** - 
A realm manages a set of users, credentials, roles, and groups.
A user belongs to and logs into a realm.
Realms are isolated from one another and can only manage and authenticate the users that they control.
2. **"enabled": true** -
Disabled realms cannot be accessed or used for authentication, and users within the realm cannot log in or perform any actions until the realm is enabled again.
2. **"sslRequired": "external"** - 
localhost (via 127.0.0.1.) and private IP addresses can access without HTTPS but all other requests must use HTTPS.

## Client Configuration

## Client-side Web Application of Benjrm
Uses **OpenID Connect (OIDC)** Standard Flow (Authorization Code Flow)  with PKCE (Proof Key for Code Exchange)
to authenticate users and obtain access tokens for accessing protected resources.
---

### 🔐 Authentication Flow (Step-by-Step)

1. The user clicks the **"Login"** button in the client-side web application.

2. The application redirects the browser to the Keycloak authorization endpoint:

```
{BASE_URL}/realms/{REALM_NAME}/protocol/openid-connect/auth
```

with the following query parameters:
- `client_id`: The registered client identifier of the application (e.g. `web`)
- `redirect_uri`: URL where Keycloak redirects after successful authentication (e.g. `http://127.0.0.1:5173/`)
- `response_mode`: Defines how the result is returned, typically `fragment` for SPA applications
- `response_type`: Defines the OAuth2 flow type, must be `code` (Authorization Code Flow)
- `scope`: Defines requested permissions, typically `openid` for OpenID Connect authentication
- `state`: Random string used to prevent CSRF attacks and to maintain request state between redirect
- `nonce`: Random value used to prevent token replay attacks in ID tokens
- `code_challenge`: PKCE challenge value derived from a code verifier (used for securing public clients)
- `code_challenge_method`: Must be `S256` for SHA-256 based PKCE transformation

👉 Example:

![Keycloak Authorization Request](./assets/keycloak-authorization-request.png)

---

3. The user logs in on the Keycloak login page.

![User logs in on Keycloak login page](./assets/keycloak-authorize.png)

---

4. After successful authentication, Keycloak redirects the user back to the application with an authorization code:

```
http://localhost:5173?code=XYZ
```

---

5. The application exchanges the authorization code for tokens by sending a **POST request** to the token endpoint:

```
{BASE_URL}/realms/{REALM_NAME}/protocol/openid-connect/token
```

with:

- `code=XYZ`
- `grant_type=authorization_code`
- `client_id=web`
- `redirect_uri=http://localhost:5173/`
- `code_verifier` (PKCE secret)

👉 Example:

![Keycloak Token Request URL](./assets/token-request-url.png)

![Keycloak Token Request Query Parameters](./assets/token-request-query-param.png)

---

## Server-side API of Benjrm
The server-side application of Benjrm uses the client credentials flow to authenticate itself with Keycloak and obtain
access tokens for accessing protected resources on behalf of the application itself (not a user).

### 🔐 Authentication Flow (Step-by-Step)
1. The server-side application sends a **POST** request to the Keycloak token endpoint:

```
{BASE_URL}/realms/{REALM_NAME}/protocol/openid-connect/token
```
with the following application/x-www-form-urlencoded body parameters:
- `client_id`: The registered client identifier of the application (e.g. `api`).
- `grant_type`: Must be `client_credentials` for this flow.
- `client_secret`: The secret associated with the client.

2. Keycloak validates the client credentials and responds with an access token if the authentication is successful.

👉 Example:

![Keycloak Client Credentials Flow](./assets/keycloak-client-credentials-flow.png)