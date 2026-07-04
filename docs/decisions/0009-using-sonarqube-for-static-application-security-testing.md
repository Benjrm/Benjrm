# Using SonarQube / SonarCloud for Static Application Security Testing (SAST)

## Context and Problem Statement

To ensure the security, reliability, and maintainability of the Benjrm application, we need a static application security testing (SAST) tool that automatically analyzes our source code for errors, security vulnerabilities, and code smells. This tool must run in our CI/CD pipeline to perform quality checks before code is merged or deployed.

## Options Considered

* GitHub CodeQL
* Semgrep
* SonarQube (THM Hosted) / SonarCloud

## Decision Outcome

Selected option: SonarQube / SonarCloud, as it offers detailed code smell analysis, multi-language coverage of both the frontend and backend, and a user-friendly dashboard for visualizing metrics on code quality and maintainability.

Compared to CodeQL: CodeQL integrates directly into GitHub with pull request annotations and also scans dependencies and security vulnerabilities. It is free for open-source repositories, and the quality of the scans is high. However, setting up and writing CodeQL queries is difficult and complex. Additionally, the scan speed is slower than that of Semgrep.

Compared to Semgrep: Semgrep is extremely fast and resource-efficient. It is also said to be easy to set up. It is free for open-source projects.

SonarQube offers a comprehensive code quality scan, with a speed that falls between Semgrep (very fast) and CodeQL (slow). Data flow control is good, and many languages are supported. The setup effort is high compared to the others.

In the end, we concluded that SonarQube is best suited for our project because it is already hosted by THM and offers the most comprehensive code quality scan. Additionally, two of us already have experience with SonarQube.

### Pipeline Details

First, we configured the CI/CD pipeline to use a SonarQube server hosted by THM. However, since the THM server began causing constant timeouts after a while, we integrated SonarQube Cloud (SonarCloud), which supports Rust and is free for open-source projects, and now scans both the frontend and the backend.
