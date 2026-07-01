# Using OpenAPI and AsyncAPI for API Documentation

## Context and Problem Statement

The project exposes two types of APIs: a REST interface and a WebSocket interface.
Both need to be documented in a standardized, machine-readable format to enable tooling support such as linting, testing, and code generation, as well as to provide a clear contract for frontend and backend developers.

## Considered Options

* OpenAPI + AsyncAPI
* RAML
* API Blueprint
* Plain Markdown documentation

## Decision Outcome

Chosen option: "OpenAPI for the REST API and AsyncAPI for the WebSocket API", because they are the industry-standard specifications for their respective API types and provide the best tooling ecosystem.

OpenAPI 3.1.0 is used to document the REST interface. It is the most widely adopted standard for RESTful APIs, with broad support across linting tools (e.g. Spectral), testing frameworks (e.g. Schemathesis), and API clients. The specification lives in `docs/openapispec/RestInterface.yaml`.

AsyncAPI 3.1.0 is used to document the WebSocket interface. It is the established standard for event-driven and message-based APIs and follows a structure familiar to developers who know OpenAPI. The specification lives in `docs/asyncapi/WebSockets.yaml`.

Compared to RAML and API Blueprint, both OpenAPI and AsyncAPI have significantly larger communities, better maintained tooling, and more active development. RAML in particular has seen declining adoption.

Plain Markdown documentation was ruled out because it is not machine-readable and therefore cannot be used by linting or testing tools, which are a core part of the project's quality pipeline (see [0011-api-design-and-testing-frameworks.md](0011-api-design-and-testing-frameworks.md)).
