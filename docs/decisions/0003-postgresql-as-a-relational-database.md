# Relational Database Support Strategy (PostgreSQL, MySQL/MariaDB, SQLite)

## Context and Problem Statement

The Benjrm project requires persistent storage for structured data such as quizzes and questions with corresponding
answers. The domain is highly relational, with clear relationships between entities and a need for consistent
transactional behavior.

Instead of binding the system to a single database technology, the goal is to support multiple relational database
systems through a common abstraction layer.

The challenge is to ensure database flexibility while maintaining consistency, testability, and ease of deployment
across different environments.

## Considered Options

From a database type perspective, the following categories were considered:

- Relational databases (PostgreSQL, MySQL/MariaDB, SQLite)
- Document databases (e.g., MongoDB)
- Object databases

Given the strongly structured and relational nature of the domain, a relational database model was chosen.

Within relational databases, the following systems are supported:

- PostgreSQL
- MySQL / MariaDB
- SQLite (testing and lightweight environments)

## Decision Outcome

Chosen approach: Support all relational databases supported by the ORM layer, with PostgreSQL as the default deployment
instance.

The system uses an ORM mapper to abstract database-specific implementations. This ensures that no database-specific
logic is embedded in the application layer, allowing portability across supported relational database systems.

PostgreSQL is used as the default production database instance provided by the platform. SQLite is used for local
development and testing environments due to its simplicity and zero-configuration setup. MySQL / MariaDB support is
included via the ORM layer but may be temporarily disabled depending on dependency or security constraints.
