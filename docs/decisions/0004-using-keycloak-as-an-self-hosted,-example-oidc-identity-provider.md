# Using Keycloak as a Self-Hosted, Example OIDC Identity Provider

## Context and Problem Statement

We are using a server-side OpenID Connect (OIDC) Standard Flow (Authorization Code Flow) with PKCE (Proof Key for Cdoe
Exchange) to authenticate users and obtain access tokens for protected resources.

In addition to authentication, the system also requires a way to manage authorization concepts such as user roles and
groups within the application domain (Benjrm) in the future, for example to control access to quizzes in an
organization.
A key consideration was whether these authorization concepts should be handled by the Identity Provider or within the
application itself.

## Considered Options

* External Identity Provider (e.g. Microsoft Entra ID)
* Self Hosted Identity Provider (e.g. Keycloak)
* Custom Authentication System

Additionally, for authorization and group management:

- Using the Identity Provider (Keycloak) to manage user groups and roles
- Managing groups and permissions directly within the Benjrm application

## Decision Outcome

Chosen option: "Self Hosted Identity Provider", because We are using an server-side OpenID Connect (OIDC) Standard
Flow (Authorization Code Flow) with PKCE (Proof Key for Cdoe Exchange) to authenticate users and obtain access tokens
for protected resources.

The authentication system is designed to be provider-agnostic and can work with any OIDC-compliant Identity Provider.
For local development and reference purposes, a self-hosted Identity Provider such as Keycloak is provided.

A self-hosted Identity Provider approach was chosen over external Identity Providers such as Google, GitHub, or
Microsoft Entra ID because it avoids dependency on third-party services and does not require users to have external
accounts. This improves privacy, portability, and allows the system to be fully runnable in a local environment.

At the same time, the architecture remains flexible, as any OIDC-compliant Identity Provider can be integrated depending
on the deployment scenario, including existing corporate or cloud-based identity systems.

A custom-built authentication system was also considered but rejected due to significant security risks, high
implementation effort, and the complexity of correctly implementing established authentication standards. Using OIDC
avoids these risks by relying on a mature and widely adopted protocol.

Overall, this approach provides a secure, standards-compliant, and flexible authentication solution suitable for both
local development and production use cases.

### Authorization / Group Management Decision

Using Keycloak for managing application-specific groups and permissions was considered.

This approach was rejected because it would tightly couple the application to Keycloak as a middleware layer.
As a result, replacing the Identity Provider in the future (e.g. switching to another OIDC provider) would become
significantly harder or require re-implementing group/role logic.

Additionally, relying on Keycloak for domain-specific authorization logic would introduce unnecessary dependency on
Identity Provider-specific features instead of keeping authorization within the application domain.

Therefore, group and permission management is handled within the Benjrm application itself, while Keycloak (or any other
OIDC provider) is used exclusively for authentication.
