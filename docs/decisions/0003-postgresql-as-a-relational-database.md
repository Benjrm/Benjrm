# PostgreSQL as a Relational Database

## Context and Problem Statement

The Benjrm project needs to store and manage data related to questions and quizzes. 
The domain consists of well-defined, structured data with clear relationships between entities such as quizzes, questions, and users.

The challenge is to select a suitable database solution that supports a relational data model, ensures data consistency, and enables efficient querying of structured and interconnected data. In addition, the solution should align with the team’s existing knowledge to reduce complexity and development effort.

## Considered Options

* PostgreSQL
* MariaDB / MySQL
* SQLite

## Decision Outcome

Chosen option: "PostgresQL", because it provides a robust, open-source relational database solution that aligns well with Benjrm's project requirements.

A key factor in this decision is the team’s existing experience. 
All team members have worked with relational databases in the INF2204 Database Systems module, which significantly reduces the learning curve and ensures a common understanding of data modeling and SQL concepts. 
This shared knowledge allows the team to focus on implementation rather than learning new database paradigms.

Compared to alternatives such as MariaDB and SQLite, PostgreSQL provides a better balance of advanced features, standards compliance, and scalability. While MariaDB offers similar functionality, PostgreSQL is considered more standards-compliant. SQLite, although simple to use, is not suitable for a multi-user, server-based application in a production-like environment.
