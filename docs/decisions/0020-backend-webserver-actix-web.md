# Backend webserver Actix Web

## Context and Problem Statement

After selecting Rust as the backend programming language, a web server must be chosen to implement the RESTful and WebSocket API for the Benjrm project.
The challenge is to select a web server that provides good performance, error handling and support for REST endpoints and WebSockets.

## Considered Options

* Actix Web
* Axum
* Rocket
* Warp

## Decision Outcome

Chosen option: "Actix Web", because it provides good performance, integrates with the Tokio runtime (for asynchronous request handling) and aligns well with the team's existing experience.

Compared to Axum, Actix Web offers similarly high performance but has a longer track record in production environments. While Axum has gained significant popularity due to its integration with the Tokio ecosystem, two team members already have practical experience developing applications with Actix Web. This reduces the learning curve, lowers development risk, and enables efficient knowledge sharing with the team.

Compared to Rocket, Actix Web offers a more mature asynchronous ecosystem and generally achieves higher throughput in benchmarks. Although Rocket provides a convenient developer experience through its declarative API, Actix Web offers greater flexibility and a broader ecosystem.

Compared to Warp, Actix Web provides a more conventional and approachable API. Warp's functional filter-based routing can become difficult to read and maintain in larger projects, whereas Actix Web's routing and handler structure is easier for the team to understand and extend.

Actix Web also provides built-in support for WebSockets, middlewares, request extraction, and error handling. These features cover the project's requirements without requiring additional major components.
