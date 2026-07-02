# Technology Stack Documentation

## Collecting the technologies the benjrm's team is already familiar with

As a first step, we are collecting the technologies, libraries and frameworks 
the benjrm's team is familiar with based on
previous courses at university or other side-projects.
You can see the analysis' result [here](https://cdn.discordapp.com/attachments/1495812865775501525/1495833115329822720/Skills.pdf?ex=6a3e08e5&is=6a3cb765&hm=d09e5dfbb4e3cca13abe2c051c6a2bca3cb6893d3470553e6f8caa7146fda915&)

## Picking the technologies for the project based on the above analysis and the project's requirements

In the next step, we are picking the technologies for the project based on the above analysis and 
the project's requirements. We use Architecture Decision Records (ADR) to document the decisions we
make to ensure that we and future developers understand the reasoning behind our choices.


1. [**Rust**](https://rust-lang.org/) as a backend programming language. See [0000-backend-language-rust.md](0000-backend-language-rust.md) for more details.
2. [**React**](https://react.dev/) with [**TypeScript**](https://www.typescriptlang.org/) as a frontend library with [**Vite**](https://vite.dev/) as a build tool. [0001-using-react-and-typescript-with-vite-as-build-tool-as-a-frontend-library.md](0001-using-react-and-typescript-with-vite-as-build-tool-as-a-frontend-library.md) for more details.
3. Using [**TanStack-Query**](https://tanstack.com/query/latest) as a data fetching library for React. See [0005-using-tanstack-query-for-data-fetching.md](0005-using-tanstack-query-for-data-fetching.md) for more details.
4. Using [**shadcn/ui**](https://ui.shadcn.com/) as a component library on top of [**TailwindCSS**](https://tailwindcss.com/). See [0007-using-shadcn-ui-library.md](0007-using-shadcn-ui-library.md) for more details.
5. [**Git**](https://git-scm.com/) and *[*GitHub**](https://github.com/) as version control system and code hosting platform, using [**GitHub Actions**](https://docs.github.com/en/actions) for CI/CD. See [0002-git-and-github-as-version-control-system-and-code-hosting-platform.md](0002-git-and-github-as-version-control-system-and-code-hosting-platform.md) for more details.
6. Using [**PostgreSQL**](https://www.postgresql.org/) as a relational database management system. See
[0003-postgresql-as-a-relational-database.md](0003-postgresql-as-a-relational-database.md) for more details.
7. Using [**Keycloak**](https://www.keycloak.org/) as and self-hosted, example OIDC provider for authentication and authorization. See [0004-unsing-keycloak-as-an-self-hosted,-example-oidc-identity-provider.md](0004-using-keycloak-as-an-self-hosted,-example-oidc-identity-provider.md) for more details.
    > Note: Our backend is designed to be provider-agnostic and can work with any OIDC-compliant Identity Provider. For local development and reference purposes, a self-hosted Identity Provider such as Keycloak is provided.
8. Using [**Docker**](https://www.docker.com/) for containerization. See [0006-using-docker-for-containerization.md](0006-using-docker-for-containerization.md) for more details.
9. Using [**Trivy**](https://trivy.dev/) for vulnerability and misconfiguration scanning. See [0008-using-trivy-for-vulnerability-and-misconfiguration-scanning.md](0008-using-trivy-for-vulnerability-and-misconfiguration-scanning.md) for more details.
10. Using [**SonarQube / SonarCloud**](https://www.sonarqube.org/) for static application security testing. See [0009-using-sonarqube-for-static-application-security-testing.md](0009-using-sonarqube-for-static-application-security-testing.md) for more details.
11. Using [**Cargo Audit**](https://github.com/rustsec/rustsec) to scan Rust dependencies for security vulnerabilities. See [0010-using-cargo-audit-to-scan-rust-dependencies.md](0010-using-cargo-audit-to-scan-rust-dependencies.md) for more details.
12. Using [**Spectral**](https://stoplight.io/open-source/spectral) and [**Schemathesis**](https://schemathesis.readthedocs.io/) for API design linting and property-based API testing. See [0011-api-design-and-testing-frameworks.md](0011-api-design-and-testing-frameworks.md) for more details.
13. Using [**ESLint + Prettier**](https://eslint.org/) (Frontend) and [**Clippy + Rustfmt**](https://github.com/rust-lang/rust-clippy) (Backend) for code linting and formatting. See [0012-code-quality-and-standards.md](0012-code-quality-and-standards.md) for more details.
14. Using [**react-i18next**](https://react.i18next.com/) with [**i18next**](https://www.i18next.com/) for internationalization. See [0013-using-react-i18next-for-internationalization.md](0013-using-react-i18next-for-internationalization.md) for more details.
15. Using [**Discord**](https://discord.com/) and [**WhatsApp**](https://www.whatsapp.com/) for team communication. See [0014-using-discord-and-whatsapp-for-team-communication.md](0014-using-discord-and-whatsapp-for-team-communication.md) for more details.
16. Using [**Google Docs**](https://docs.google.com/) for documentation. See [0015-using-google-docs-for-documentation.md](0015-using-google-docs-for-documentation.md) for more details.
17. Using [**YouTrack**](https://www.jetbrains.com/youtrack/) for project management, sprint planning, and time tracking. See [0016-using-youtrack-for-project-management.md](0016-using-youtrack-for-project-management.md) for more details.
18. Using [**Miro**](https://miro.com/) for visual collaboration including competitive analysis and story mapping. See [0017-using-miro-for-visual-collaboration.md](0017-using-miro-for-visual-collaboration.md) for more details.
19. Using [**Figma**](https://www.figma.com/) for wireframes, mockups, and interactive prototypes. See [0018-using-figma-for-ux-design.md](0018-using-figma-for-ux-design.md) for more details.
20. Using [**OpenAPI**](https://www.openapis.org/) and [**AsyncAPI**](https://www.asyncapi.com/) for API documentation. See [0019-using-openapi-and-asyncapi-for-api-documentation.md](0019-using-openapi-and-asyncapi-for-api-documentation.md) for more details.
21. Using [**Actix Web**](https://actix.rs) as the backend webserver. See [0020-backend-webserver-actix-web.md](0020-backend-webserver-actix-web.md) for more details.
