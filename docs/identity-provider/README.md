# Identity Provider - Keycloak

## Resources:
1. [JSON Schema for Keycloak Import/Export - GitHub Repository](https://github.com/jirutka/keycloak-json-schema)
2. [JSON Schema for Keycloak Import/Export - Schemas](https://jirutka.github.io/keycloak-json-schema/)
3. [JSON Schema for Keycloak Import/Export - Keycloak Version 26](assets/keycloak-realm-26.json)
4. [All configuration options for Keycloak](https://www.keycloak.org/server/all-config)
5. [Observability - Health Check endpoints](https://www.keycloak.org/observability/health)
6. [Securing applications and services with OpenID Connect](https://www.keycloak.org/securing-apps/oidc-layers)
7. [Authorization Code Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow)
8. [Authorization Code Flow with Proof Key for Code Exchange (PKCE)](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)
9. [Client Credentials Code Flow](https://auth0.com/docs/get-started/authentication-and-authorization-flow/client-credentials-flow)
10. [Configuring the management interface](https://www.keycloak.org/server/management-interface)
11. [Configuring the hostname (v2)](https://www.keycloak.org/server/hostname)
12. [Configuring a reverse proxy](https://www.keycloak.org/server/reverseproxy)

## Starting Keycloak with the provided configuration:

### Starting Keycloak in development mode + Providing testusers configurable via `REPOSITORY_ROOT/services/identity-provider/mounts/init.sh`:
```bash
docker compose -f compose.dev.yaml up --build
```
### Starting Keycloak in production mode without testusers:
```bash
docker compose up --build
```
> Note: Use --build option to build images before starting containers.
> This ensures that any changes to the Dockerfiles or realm configuration are included in the new images.

## Exposed Ports:
1. **Port 8088**: Admin UI, Account Console, SAML and OIDC endpoints, Admin REST API. See details about in
[Configuring the hostname (v2)](https://www.keycloak.org/server/hostname)
2. **Port 9000**: [Management interface](https://www.keycloak.org/server/management-interface)
providing [health check endpoints](https://www.keycloak.org/observability/health) and [metrics](https://www.keycloak.org/observability/configuration-metrics)
if enabled in the configuration. Note that only the health check endpoints are currently enabled in the provided Keycloak configuration.
*Note: You should not proxy port 9000 as health checks and metrics use those ports directly, and you do not want to expose this information to external callers.*
## Admin interface
1. Changing the realm from `master` to `benjrm`
![](./assets/admin-interface-manage-realms.png)
2. For realm settings like `Login screen customization`, `Email settings` and `User profile settings` refer to benjrm's realm settings
![](./assets/admin-interface-benjrm-realm-settings.png)
3. For client settings with corresponding OIDC authentication flows refer to benjrm's client settings.
![](assets/benjrm-client-configuration.png)

## Hostname Configuration
[Configuring the hostname (v2)](https://www.keycloak.org/server/hostname#_using_a_reverse_proxy)

### Using a reverse proxy with edge TLS termination
In the setup we use a reverse proxy with edge TLS termination 
[See details about configuring a reverse proxy for Keycloak](https://www.keycloak.org/server/reverseproxy)

#### Fully dynamic URLs
We chose a fully dynamic URL configuration to ensure maximum flexibility across different environments, specifically development and production. 
Since both environments may differ in domain, protocol, or routing behavior, hardcoding a fixed hostname would introduce unnecessary coupling and reduce portability.

By relying on correctly configured Forwarded headers from the reverse proxy, the application can automatically resolve the correct external URL at runtime. 
This allows the same deployment artifact to be used in both environments without modification, reducing configuration overhead and minimizing the risk of environment-specific misconfigurations.

Additionally, this approach supports modern infrastructure patterns such as containerization and infrastructure-as-code, where environments are expected to be ephemeral or dynamically provisioned. It also simplifies CI/CD pipelines, as no environment-specific hostname configuration is required within the application itself.

Overall, the fully dynamic approach improves maintainability, reduces duplication of configuration, and ensures consistent behavior across development and production environments while delegating URL resolution to the trusted reverse proxy layer.

[Configuring the hostname (v2) - Using a reverse proxy - Fully dynamic URLS](https://www.keycloak.org/server/hostname#_fully_dynamic_urls)


Required http headers for reverse proxy configuration:
1. `X-Forwarded-Proto`: The protocol used by the client to connect to the reverse proxy (e.g. `http` or `https`).
2. `X-Forwarded-Host`: The original host requested by the client in the host http header. (e.g. `idp.benjrm.de`).
3. `X-Forwarded-Port`: The port on which the client is connecting to the reverse proxy (e.g. `80 for http`, `443 for https`).
4. `X-Forwarded-Prefix`: The path prefix used by the reverse proxy to route requests to Keycloak (e.g. `/auth`)
5. `X-Forwarded-For`: The original client ip address of the client connecting to the reverse proxy (e.g. `203.0.113.195`).

#### Hostname Debug endpoint with dynamic URL and X-Forwarded-* http headers.

Note: This endpoint is only available when the environment variable `KC_HOSTNAME_DEBUG` is set to `true`.

![Configuring the hostname](assets/auth-configuring-the-hostname.png)

#### OIDC Configuration endpoints with dynamic URL and X-Forwarded-* http headers

![OIDC Configuration endpoints with dynamic URL and X-Forwarded-* http headers](assets/auth-configuring-the-hostname-2.png)

> Note: Take a look at
[Configuring a reverse proxy - Exposed path recommendations](https://www.keycloak.org/server/reverseproxy#_exposed_path_recommendations) and
[Configuring a reverse proxy - Trusted proxies](https://www.keycloak.org/server/reverseproxy#_trusted_proxies) when
configuring the reverse proxy.

## Overview of the Keycloak Authentication process from user perspective:
1. The user accesses the client-side web application (e.g. `https://www.benjrm.de`) and gets redirected to the 
Keycloak login page after clicking the "Login" button.

![Keycloak Sign-in to your Account](./assets/sign-in-page.png)

2. On the Keycloak login page, the user either enters their credentials to log in or clicks the "Register" link to create a new account.
The user has the option to check the "Remember Me" checkbox to stay logged in between browser restarts until the session expires.

3. In case of forgotten credentials, the user can click the "Forgot Password?" link to initiate the password reset process, 
which will send a password reset email to the user's verified registered email address.

![Keycloak Reset Password Mail](./assets/reset-password.png)

![Keycloak Update Password Interface](./assets/update-password.png)

4. If the user clicks the "Register" link, they will be taken to the registration page where they can create a new account
by providing the required information such as username, email, and password.

![Keycloak Register interface](./assets/register-page.png)

After successful registration, the user will receive a verification email to confirm their email address.

![Keycloak Verify Email](./assets/verify-email-01.png)

![Keycloak Verify Email Mail](./assets/verify-email-02.png)

## Realm Configuration
1. **"realm": "benjrm"** - 
A realm manages a set of users, credentials, roles, and groups.
A user belongs to and logs into a realm.
Realms are isolated from one another and can only manage and authenticate the users that they control.
2. **"enabled": true** -
Disabled realms cannot be accessed or used for authentication, and users within the realm cannot log in or perform any actions until the realm is enabled again.
3. **"sslRequired": "external"** - 
localhost (via 127.0.0.1.) and private IP addresses can access without HTTPS but all other requests must use HTTPS.
4. **"registrationAllowed": true** -
Enable/disable the registration page. A link for registration will show on the login page too.
5. **"resetPasswordAllowed": true** -
Show a link on the login page for users who have forgotten their credentials.
6. **"verifyEmail": true** -
Require user to verify their email address after initial login or after address changes are submitted.
7. **"rememberMe": true** -
   Show checkbox on login page to allow user to remain logged in between browser restarts until session expires.
7. **"smtpServer": { ... }** -
Configuration for sending emails from Keycloak, such as verification emails, password reset emails, and other.
8. **"smtpServer.from": "noreply@benjrm.de"** -
The email address that appears in the "From" field of emails sent by Keycloak.
9. **"smtpServer.host": "smtp.ionos.de"** -
The hostname of the SMTP server that Keycloak will use to send emails.
10. **"smtpServer.port": "465"** -
The port number on which the SMTP server is listening for secure connections (SSL/TLS).
11. **"smtpServer.ssl": "true"** -
Indicates that Keycloak should use SSL/TLS to connect to the SMTP server for secure email transmission.
12. **"smtpServer.auth": "true"** -
Indicates that Keycloak should authenticate with the SMTP server using the provided credentials (username and password) before sending emails.
13. **"smtpServer.user": "noreply@benjrm.de"** -
Indicates the username that Keycloak should use to authenticate with the SMTP server when sending emails.
14. **"smtpServer.password": "SECRET"** -
Indicates the password that Keycloak should use to authenticate with the SMTP server when sending emails.

## Client Configuration
### Server-side Application of Benjrm
Uses **OpenID Connect (OIDC)** **Standard Flow (Authorization Code Flow) with PKCE (Proof Key for Code Exchange)**
to authenticate users and obtain access tokens for accessing protected resources.
The client is configured as a confidential client, which means it requires a client secret to authenticate.
---
#### 🔐 Authorization Code Flow with Proof Key for Code Exchange (PKCE) - Step-by-Step

##### 👉Authentication Code Flow Sequence Diagram:
![Authentication Code Flow Sequence Diagram](assets/auth-code-flow-diagram.png)

[Authorization Code Flow - Further explanations](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow)

##### 👉Authentication Code Flow Sequence Diagram with Proof Key for Code Exchange (PKCE):
![Authentication Code Flow Sequence Diegram with PKCE](assets/auth-sequence-auth-code-pkce.png)

[Authorization Code Flow with Proof Key for Code Exchange (PKCE) - Further explanations](https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-pkce)

1. The user clicks the **"Login"** button on the client-side web application and the client-side web application call
`/auth/login` endpoint of the server-side application to initiate the authentication process.
2. This step consists of the steps 2, 3 and 4 of the Authentication Code Flow with PKCE sequence diagram. 
The server-side application generates a random `state`, `nonce`, `code_verifier` and derives a `code_challange` from the `code_verifier` using a secure transformation (e.g. SHA-256). 
The server-side application then sends an authorization code request to Keycloak's authorization endpoint:

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

3. The user authenticates on the Keycloak login page by entering and submitting their credentials.
![User logs in on Keycloak login page](./assets/keycloak-authorize.png)

---

4. After successful authentication, Keycloak redirects the user back to the server-side application with an authorization code:

```
http://localhost:5173?code=XYZ
```

---

5. This step consists of the steps 7, 8, 9 of the Authentication Code Flow with PKCE sequence diagram. 
The server-side application exchanges the authorization code for tokens by sending a **POST request** to the token endpoint:

```
{BASE_URL}/realms/{REALM_NAME}/protocol/openid-connect/token
```

with:
- `code=XYZ` (the authorization code received in the previous step)
- `grant_type=authorization_code` (indicates the type of OAuth2 flow being used - Authorization Code Flow)
- `client_id=web` (the  registered client identifier of the application)
- `redirect_uri=http://localhost:5173/` (must match the redirect URI used in the authorization request)
- `code_verifier`(the original random string generated by the client-side application, used to verify the PKCE challenge by hashing it and comparing it to the `code_challenge` sent in the authorization request)

👉 Example:

![Keycloak Token Request URL](./assets/token-request-url.png)

![Keycloak Token Request Query Parameters](./assets/token-request-query-param.png)

6. Afterward the server-side application receives the access token and ID token from Keycloak and sends 
a signed http-only cookie containing the ID token to the client-side web application to maintain the user's authenticated session.