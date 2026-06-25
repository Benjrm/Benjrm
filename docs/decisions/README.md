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


1. **Rust** as a backend programming language. See [0000-backend-language-rust.md](0000-backend-language-rust.md) for more details.
2. **React** with **TypeScript** as a frontend library with **Vite** as a build tool. [0001-using-react-and-typescript-with-vite-as-build-tool-as-a-frontend-library.md](0001-using-react-and-typescript-with-vite-as-build-tool-as-a-frontend-library.md) for more details.
3. Using **TanStack-Query** as a data fetching library for React. See
[0005-using-tanstack-query-for-data-fetching.md](0005-using-tanstack-query-for-data-fetching.md)
4. **Git** and **GitHub** as version control system and code hosting platform, using **GitHub Actions** for CI/CD. See [0002-git-and-github-as-version-control-system-and-code-hosting-platform.md](0002-git-and-github-as-version-control-system-and-code-hosting-platform.md) for more details.
5. Using **PostgreSQL** as a relational database management system. See
[0003-postgresql-as-a-relational-database.md](0003-postgresql-as-a-relational-database.md) for more details.
6. Using **Keycloak** as and self-hosted, example OIDC provider for authentication and authorization. See [0004-unsing-keycloak-as-an-self-hosted,-example-oidc-identity-provider.md](0004-using-keycloak-as-an-self-hosted,-example-oidc-identity-provider.md) for more details.
> Note: Our backend is designed to be provider-agnostic and can work with any OIDC-compliant Identity Provider. For local development and reference purposes, a self-hosted Identity Provider such as Keycloak is provided.
