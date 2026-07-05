# Frameworks for API Design and Testing

## Context and Problem Statement

To ensure a standardized, well-organized, and thoroughly documented API for Benjrm's REST and WebSocket interfaces, we must comply with OpenAPI and AsyncAPI specifications. In addition, we need to be able to test our API implementation automatically.

## Considered Options

### API Design Linting
* Redocly CLI
* Spectral

### API Testing

* Dredd
* Postman / Newman
* Schemathesis

## Decision

### API Design Linting: Spectral

Chosen option: "Spectral", as it is an open-source, highly flexible, and customizable API linter that fits our architecture with multiple specifications.

Compared to Redocly CLI: Redocly CLI is a great tool for creating and validating OpenAPI documents, but Spectral offers first-class, native support for both OpenAPI and AsyncAPI (which we use for our WebSockets interface). Spectral allows us to write customizable rules and easily check multiple interface configurations in our CI/CD workflows.

### API Testing: Schemathesis

Chosen option: "Schemathesis", because it uses property-based testing to automatically generate a wide range of test cases from our OpenAPI schemas, automatically detecting edge cases and schema deviations.

In comparison, Dredd is a well-established API testing tool. However, it necessitates exact assertions with precise values and provides only partial support for the latest OpenAPI 3.x specifications. Schemathesis, on the other hand, offers full support for OpenAPI 3.x and can generate random inputs based on field types and constraints. This allows it to explore code paths and edge cases.

Compared to Postman / Newman: With Postman/Newman, collections of requests and assertion scripts must be created, updated, and maintained manually. This results in high maintenance overhead and often leads to tests falling out of sync with actual code changes. Schemathesis reads the OpenAPI specification directly to test the API, eliminating the need for any manual test case creation.
