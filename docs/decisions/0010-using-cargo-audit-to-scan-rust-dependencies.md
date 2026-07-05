# Using Cargo Audit to Scan Rust Dependencies for Security Vulnerabilities

## Context and Problem Statement

To ensure that the Benjrm application’s backend codebase remains secure at all times, we must continuously check our Rust dependencies for known security vulnerabilities.

## Considered Options

* Trivy
* Cargo Audit (`cargo-audit`)

## Decision Outcome

Chosen option: "Cargo Audit (`cargo-audit`)", as it is the specialized standard tool for security audits within the Rust ecosystem and integrates natively with Cargo.

Compared to Trivy: Trivy is used in our project to scan frontend filesystem dependencies, Docker files, and configurations. Cargo Audit, however, is a specialized tool developed specifically for the Rust programming language. It interacts directly with `Cargo.lock` and utilizes the community-maintained RustSec Advisory Database. It provides more precise details on security advisories for crates (e.g., warnings about deprecated crates or the display of detailed patch information) and requires less scanning effort compared to universal vulnerability scanners.

By using both tools in our pipeline, we ensure that Trivy handles general and frontend-related security checks, while `cargo-audit` provides a thorough, specialized audit for the Rust backend.
