# Technology Stack Documentation

## Collecting the technologies the Benjrm's team is already familiar with

As a first step, we are collecting the technologies, libraries and frameworks 
the Benjrm's team is familiar with based on
previous courses at university or other side-projects:

## Modules

| Modul               | Bela | Julian | Noel | Erik | Mike | Robin |
|---------------------|:----:|:------:|:----:|:----:|:----:|:-----:|
| DBS                 |  x   |   x    |  x   |      |  x   |   x   |
| Off-Sec             |      |        |  x   |  x   |  x   |       |
| Interaktive Systeme |  x   |   x    |      |  x   |  x   |       |
| Dev-Ops             |      |        |  x   |      |      |   x   |
| Webtech             |  x   |   x    |  x   |      |  x   |       |

## Language

| Sprache       | Bela | Julian | Noel | Erik | Mike | Robin |
|---------------|:----:|:------:|:----:|:----:|:----:|:-----:|
| Java / Kotlin |  x   |   x    |  x   |  x   |  x   |   x   |
| JS / TS       |  x   |   x    |  x   |  x   |  x   |   x   |
| Rust          |  x   |   x    |      |      |      |       |
| Python        |  x   |   x    |  x   |  x   |  x   |   x   |
| Dart          |      |        |      |      |      |   x   |

## Frameworks

| Framework                 | Bela | Julian | Noel | Erik | Mike | Robin |
|---------------------------|:----:|:------:|:----:|:----:|:----:|:-----:|
| React (+ Router) / NextJS |  /   |   /    |  x   |  /   |  /   |   /   |
| Vue.js                    |      |        |      |      |      |   x   |
| Tailwind CSS              |      |        |  x   |  x   |  x   |   x   |
| Tanstack Query            |      |        |  x   |      |      |   x   |
| Actix                     |  x   |   x    |      |      |      |       |

## Picking the technologies for the project based on the above analysis and the project's requirements

In the next step, we are picking the technologies for the project based on the above analysis and 
the project's requirements. We use Architecture Decision Records (ADR) to document the decisions we
make to ensure that we and future developers understand the reasoning behind our choices.

1. [**Rust**](https://rust-lang.org/) as a backend programming language. [Read more](0000-backend-language-rust.md).
2. [**React**](https://react.dev/) with [**TypeScript**](https://www.typescriptlang.org/) as a frontend library with [**Vite**](https://vite.dev/) as a build tool. [Read more](0001-react-typescript-and-vite-as-the-frontend-stack.md).
3. Using [**TanStack-Query**](https://tanstack.com/query/latest) as a data fetching library for React. [Read more](0005-using-tanstack-query-for-data-fetching.md).
4. Using [**shadcn/ui**](https://ui.shadcn.com/) as a component library on top of [**TailwindCSS**](https://tailwindcss.com/). [Read more](0007-using-shadcn-ui-library.md).
5. [**Git**](https://git-scm.com/) and [**GitHub**](https://github.com/) as version control system and code hosting platform, using [**GitHub Actions**](https://docs.github.com/en/actions) for CI/CD. [Read more](0002-git-and-github-as-version-control-system-and-code-hosting-platform.md).
6. Using [**PostgreSQL**](https://www.postgresql.org/) as a relational database management system. [Read more](0003-postgresql-as-a-relational-database.md).
7. Using [**Keycloak**](https://www.keycloak.org/) as and self-hosted, example OIDC provider for authentication and authorization. [Read more](0004-using-keycloak-as-an-self-hosted,-example-oidc-identity-provider.md).
    > Note: Our backend is designed to be provider-agnostic and can work with any OIDC-compliant Identity Provider. For local development and reference purposes, a self-hosted Identity Provider such as Keycloak is provided.
8. Using [**Docker**](https://www.docker.com/) for containerization. [Read more](0006-using-docker-for-containerization.md).
9. Using [**Trivy**](https://trivy.dev/) for vulnerability and misconfiguration scanning. [Read more](0008-using-trivy-for-vulnerability-and-misconfiguration-scanning.md).
10. Using [**SonarQube / SonarCloud**](https://www.sonarqube.org/) for static application security testing. [Read more](0009-using-sonarqube-for-static-application-security-testing.md).
11. Using [**Cargo Audit**](https://github.com/RustSec/rustsec/tree/main/cargo-audit) to scan Rust dependencies for security vulnerabilities. [Read more](0010-using-cargo-audit-to-scan-rust-dependencies.md).
12. Using [**Spectral**](https://stoplight.io/open-source/spectral) and [**Schemathesis**](https://schemathesis.readthedocs.io/) for API design linting and property-based API testing. [Read more](0011-api-design-and-testing-frameworks.md).
13. Using [**ESLint + Prettier**](https://eslint.org/) (Frontend) and [**Clippy + Rustfmt**](https://github.com/rust-lang/rust-clippy) (Backend) for code linting and formatting. [Read more](0012-code-quality-and-standards.md).
14. Using [**react-i18next**](https://react.i18next.com/) with [**i18next**](https://www.i18next.com/) for internationalization. [Read more](0013-using-react-i18next-for-internationalization.md).
15. Using [**Discord**](https://discord.com/) and [**WhatsApp**](https://www.whatsapp.com/) for team communication. [Read more](0014-using-discord-and-whatsapp-for-team-communication.md).
16. Using [**Google Docs**](https://docs.google.com/) for documentation. [Read more](0015-using-google-docs-for-documentation.md).
17. Using [**YouTrack**](https://www.jetbrains.com/youtrack/) for project management, sprint planning, and time tracking. [Read more](0016-using-youtrack-for-project-management.md).
18. Using [**Miro**](https://miro.com/) for visual collaboration including competitive analysis and story mapping. [Read more](0017-using-miro-for-visual-collaboration.md).
19. Using [**Figma**](https://www.figma.com/) for wireframes, mockups, and interactive prototypes. [Read more](0018-using-figma-for-ux-design.md).
20. Using [**OpenAPI**](https://www.openapis.org/) and [**AsyncAPI**](https://www.asyncapi.com/) for API documentation. [Read more](0019-using-openapi-and-asyncapi-for-api-documentation.md).
21. Using [**Actix Web**](https://actix.rs) as the backend webserver. [Read more](0020-backend-webserver-actix-web.md).
