# SeaORM for database mapping

## Context and Problem Statement

We decided that our application should support multiple database backends and therefore a ORM mapper with support for the most used backends is required.

## Considered Options

- SeaORM
- Diesel
- Diesel async
- SQLx

## Decision Outcome

Chosen option: "SeaORM", because it was already known to the team and seemed to be the best fit for our requirements (support multiple database backends).

Compared to Diesel, SeaORM has a slightly worse feature set, but it is asynchronous in contrast to Diesel being synchronous. Because the web server we've selected (Actix Web) is asynchronous, it would be a bad choice to select a synchronous ORM. Diesel Async also exists, but it is not as popular or well maintained as SeaORM which is asynchronous from the ground up. Therefore, SeaORM as native asynchronous ORM was chosen over Diesel Async.

Also a fourth option was considered, SQLx, which is also asynchronous and supports multiple backends. However, in contrast to SeaORM, which uses SQLx under the hood, SQLx requires to manually write the queries, which isn't ideal for supporting multiple database backends.

While developing this project, we've hit some pitfalls in SeaORM, but since the other options aren't really well-suited for our project, it's unclear if it would've been better to choose another ORM.
