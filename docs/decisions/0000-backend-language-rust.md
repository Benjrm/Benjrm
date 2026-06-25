# Backend Language Rust

## Context and Problem Statement

We are developing a RESTful and WebSocket API for the Benjrm project. 
The challenge is to select a backend programming language that meets the project’s technical requirements and aligns with the team’s existing technology stack and experience.

## Considered Options

* Java
* Kotlin
* TypeScript
* Rust
* Python

## Decision Outcome

Chosen option: "Rust", because Rust was selected as the backend programming language after evaluating Java, Kotlin, TypeScript, and Python.

Compared to Java and Kotlin, Rust offers similar or better performance while consuming significantly less memory. Since Rust compiles directly to native machine code and does not require a garbage collector, it is particularly well-suited for high-performance REST and WebSocket applications. This makes Rust an attractive choice for scalable backend services.

Compared to TypeScript running on Node.js, Rust provides stronger compile-time guarantees, better memory safety, and higher performance for CPU-intensive and concurrent workloads. Rust’s ownership system helps prevent common programming errors such as data races and null pointer exceptions.

Compared to Python, Rust delivers substantially better execution speed and lower resource consumption. While Python enables rapid development, Rust is more suitable for applications where performance and reliability are important requirements.

Another important factor is Rust’s explicit error handling through the Result and Option types. Errors must be handled consciously by the developer, reducing the risk of unexpected runtime failures and improving the maintainability and robustness of the application.

Although all team members already have experience with Java and Spring Boot, Rust was chosen because the project requirements place a strong emphasis on performance, reliability, and efficient resource usage. Furthermore, two out of six team members already have Rust experience, providing a foundation for knowledge sharing within the team.

Finally, the project offers an opportunity to gain practical experience with a modern systems programming language. The team considered the learning effort acceptable because Rust’s technical advantages align well with the project’s requirements and contribute to the professional development of the team members.
