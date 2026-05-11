# Contributing to Benjrm 
 
Thank you for your interest in contributing to Benjrm! This page describes the ways you can contribute, as well as some of our policies. This should help guide you through your first Issue or PR. 
 
> Even if you can't contribute to our codebase, you can still help Benjrm to get better. The easiest way is to open up a issue if something isn't working. 
 
## Benjrm's folder structure 
 
| Folder               | Content                                                      | 
|-------------------- |-------------------------------------------------------------| 
| `backend/`           | Core backend written in Rust.         | 
| `frontend/`          | Web UI written in TypeScript (React).       | 
| `database-migrator/` | Database schema, migrations and versioning (also in Rust). | 
 
## Setup Guides 
 
Detailed setup instructions are available in the respective folders: 
- [frontend/README.md](frontend/README.md) - Frontend setup and development 
- [frontend/README.md](frontend/README.md) - Backend setup and development 
- [database-migrator/README.md](frontend/README.md) - Details on how database migrations work 
  - In normal circumstances, you do not need to run the migrator manually. When the backend starts, it automatically applies all pending migrations. 
  - You only need to interact with the migrator directly if you are working on migration-related features. 
 
 
## Git Flow and Pull Request Guidelines 
 
Pushing directly to `main` (or `master`) is not allowed (and therfore disabled), this applies to maintainers as well. All changes must go through a Pull Request (PR). If your Pull Request relates to an Issue, make sure to reference it properly in the PR description (e.g. `Closes #123`). 
 
### Branch Naming 
 
- Branch names must match the following pattern: `[0-9a-z\-/]*` 
- In simple terms: use **kebab-case**, and slashes (`/`) are allowed to group related branches. 
 
#### Branch name examples 
 
- `feature/add-dark-mode` 
- `bugfix/unexpected-server-termination` 
- `update/mysql-9-7-0` 
- `refactor/client-handling` 
 
### Code Quality & Tooling 
 
To maintain consistency across the project, please ensure the following tools are used: 
 
- **Rust (backend & database-migrator)** 
  - Formatting: `cargo fmt` 
  - Linting: `cargo clippy` 
- **TypeScript (frontend)** 
  - Formatting: `npm run format`
  - Linting: `npm run lint`
 
Run these tools before **every commit**. Commits that only contain formatting or linting changes should be avoided, as they clutter the Git history and may result in unnecessary review overhead. 
 
### Requirements for Merging 
 
The following conditions must be met before a PR can be merged: 
 
- Backend and Frontend builds successfully 
- All linters and formatters pass 
- No sensitive data (e.g. API keys, credentials) is included 
- Changes are tested where applicable 
- Documentation is updated if needed 
- PR includes a clear description of the changes (a small template exists) 
- The PR has been approved by the minimum required number of human reviewers. Automated or AI-generated reviews (e.g. GitHub Copilot) are not counted. 
 
### Additional Notes 
 
- Keep PRs small and focused, large PRs are harder to review. 
- If your change affects the database schema, make sure to include and test the necessary migrations. 
- Reviewers should see it themselves, but mention breaking changes. 
- LF line endings are used across the project. Please configure your Git client and code editor accordingly to avoid unnecessary diffs.
- Please ensure that all files end with a single newline character to maintain consistency and avoid issues with certain tools and platforms. 
- English is used for all code comments, documentation, and communication within the project. Even if you are not a native English speaker (none of the core team are), please do your best to write undestandable English.
- If you are unsure about something, ask! We are all here to learn and grow together.
 
## For external contributors 
 
If you would like to implement a new feature, please open an issue (Feature Request) first to discuss its feasibility and design. When you begin working on it, leave a comment or create a Draft Pull Request to prevent duplicate or conflicting work. 
 
For larger or more complex features, opening a Draft Pull Request is acceptable and encouraged to share progress and gather early feedback.
