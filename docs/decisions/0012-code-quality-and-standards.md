# Code Quality and Standards

## Context and Problem Statement

In order to maintain consistent and readable code in both the backend and the frontend, we require automated tools to enforce linting and formatting standards. This prevents formatting issues from cluttering the version control history and ensures that common code issues are automatically detected during local development and in the CI/CD pipelines.

## Considered Options

### Frontend

* ESLint + Prettier
* Biome

### Backend

* Clippy & Rustfmt
* Manual Code Reviews

## Decision

### Frontend

Selected option: ESLint (for linting) in combination with Prettier (for formatting), as these represent the industry-standard toolchain for React and TypeScript codebases and offer the most rules.

Compared to Biome: Biome is a modern, relatively new tool that combines linting and formatting. Its linting process is much faster than ESLint's. However, the combination of ESLint and Prettier provides a much larger ecosystem of plugins and community rules, such as specific linting for React hooks and Tailwind CSS class sorting, as well as editor integrations. This makes it a more robust option for our project configuration. We use the strict "eslint-config-airbnb-extended" rules to ensure code quality.

### Backend

Option chosen: Clippy (for linting) and Rustfmt (for formatting), as these are the official tools provided and recommended by the Rust community.

Compared to manual code reviews: Manual code reviews are subjective and time-consuming when it comes to identifying issues with code style and basic linting errors. Using Clippy and Rustfmt in the pipeline, however, ensures that all backend code automatically complies with Rust standards.