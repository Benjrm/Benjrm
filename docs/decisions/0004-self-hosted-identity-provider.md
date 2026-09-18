# Using VoidAuth as a Self-Hosted, Example OIDC Identity Provider

## Context and Problem Statement

We are using a server-side OpenID Connect (OIDC) Standard Flow (Authorization Code Flow) with PKCE (Proof Key for Cdoe Exchange) to authenticate users and obtain access tokens for protected resources.

## Considered Options

- External Identity Provider (e.g. Microsoft Entra ID)
- Self Hosted Identity Provider (e.g. Keycloak)
- Custom Authentication System

## Decision Outcome

Chosen option: "Self Hosted Identity Provider", because We are using an server-side OpenID Connect (OIDC) Standard Flow (Authorization Code Flow) with PKCE (Proof Key for Cdoe Exchange) to authenticate users and obtain access tokens for protected resources.

The authentication system is designed to be provider-agnostic and can work with any OIDC-compliant Identity Provider. For local development and reference purposes, a self-hosted Identity Provider such as VoidAuth is provided.

A self-hosted Identity Provider approach was chosen over external Identity Providers such as Google, GitHub, or Microsoft Entra ID because it avoids dependency on third-party services and does not require users to have external accounts. This improves privacy, portability, and allows the system to be fully runnable in a local environment.

At the same time, the architecture remains flexible, as any OIDC-compliant Identity Provider can be integrated depending on the deployment scenario, including existing corporate or cloud-based identity systems.

A custom-built authentication system was also considered but rejected due to significant security risks, high implementation effort, and the complexity of correctly implementing established authentication standards. Using OIDC avoids these risks by relying on a mature and widely adopted protocol.

Overall, this approach provides a secure, standards-compliant, and flexible authentication solution suitable for both local development and production use cases.

### Authorization / Group Management Decision

Using the IdP for managing application-specific groups and permissions was considered.

This approach was rejected because it would tightly couple the application to the IdP as a middleware layer. As a result, replacing the Identity Provider in the future (e.g. switching to another OIDC provider) would become significantly harder or require re-implementing group/role logic.

Additionally, relying on the IdP for domain-specific authorization logic would introduce unnecessary dependency on IdP-specific features instead of keeping authorization within the application domain.

Therefore, group and permission management is handled within the Benjrm application itself, while VoidAuth (or any other OIDC provider) is used exclusively for authentication.

### Change from Keycloak to VoidAuth

Previously, Keycloak was used as the self-hosted IdP. Keycloak was replaced by VoidAuth to simplify the development and reference environment.

While Keycloak provides a broad range of Identity and Access Management functionality, its startup time and configuration complexity made the local development workflow unnecessarily complicated for the requirements of Benjrm. Configuration changes could also require rebuilding the container and, in some cases, associated data. The previous Keycloak-based setup also required additional scripts to automate the creation and configuration of the required realm. These scripts added complexity to the project and to the setup process.

VoidAuth provides the OIDC functionality required by Benjrm with a simpler configuration model. Most configuration can be provided through environment variables, making it easier to modify the setup without rebuilding the entire container or unnecessarily recreating persistent data. Changing an environment variable immediately applies the new configuration after a quick restart of the setup.

User self-service has also been simplified. Users can now navigate directly to the Identity Provider's normal user-facing URL, log in, and manage their own account, including the supported account settings and authentication methods. With the previous Keycloak setup, accessing the corresponding account-management functionality required navigating to a more complex, dedicated URL.

This makes the user-management experience more accessible while also reducing the amount of Keycloak-specific configuration and tooling required by the project.

In addition to the required OIDC functionality, VoidAuth provides the account-management and authentication features required by the project, including:

- OIDC authentication
- User registration and account creation
- User account updates
- Self-service account deletion
- Password management and password reset
- Email verification
- Multi-factor authentication (MFA) using TOTP
- Passkey/WebAuthn authentication
- User invitation URLs

In particular, VoidAuth provides invitation URLs as part of its standard functionality. This is useful for the project's user onboarding workflow and was not available as an equivalent out-of-the-box workflow with the previous Keycloak setup without additional configuration or customization.

This change only affects the concrete Identity Provider used by the project. The authentication architecture remains based on the standard OIDC Authorization Code Flow with PKCE, and the application remains provider-agnostic. Keycloak has therefore been removed from the default project setup and replaced with VoidAuth.
