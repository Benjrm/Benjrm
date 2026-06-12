# Benjrm's backend

This is the backend for Benjrm's quizzes. Here is how to run it:

<details>
<summary>Install Rust and Cargo</summary>

Install Cargo and the Rust toolchain if you haven't already. You can do this by following the instructions on the [official Rust website](https://www.rust-lang.org/tools/install).

If you're on a Unix-like OS, you can simply run the following command:
```bash
$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
</details>

```bash
$ cargo run # optional: --release
```

The port the backend binds on defaults to port 80. If the backend is run locally outside of a container, it is common for the system to respond with a "permission denied" error when binding a port below 1024. To run the backend without elevated privileges, set the `PORT` environment variable to something higher, for example 8080.

```bash
$ PORT=8080 cargo run # optional: --release
```

> **Hint:** Release builds compile the frontend into the binary while debug builds require a running vite dev server (on port 5173).

## Development environment

If you want to run the backend directly using `cargo run` but still want to use the identity-provider, database and frontend from the file `../compose.dev.yaml`, you have to do the following:

- change `PUBLIC_URL` in `../.env` to some other port
- delete the directory `../database`
- run `docker compose -f compose.dev.yaml up --build` in the project root
- use `cargo run` with modified environment variables. They can be set in `.cargo/config.toml` if you don't want to include them in the command.
  ```
  PORT="<your port>"
  DATABASE_URL="postgres://benjrm:<password>@localhost:5432/benjrm"
  OIDC_ISSUER_URL="http://localhost:8088/realms/benjrm"
  ```

### Code linting

To run the checks performed by the pipelines locally, you can run `sh check.sh`.

## CVE-2023-49092

The MySQL database driver (`sqlx-mysql`) has a dependency (`rsa`), which has a vulnerability allowing potential key recovery. As a solution, the MySQL driver has been removed from this project. `cargo audit` still reports the vulnerability due to a [Cargo bug](https://github.com/rust-lang/cargo/issues/10801) causing `rsa` to be still included in the `Cargo.lock`. You can verify that `rsa` isn't being used in this project by running `cargo tree | grep rsa`.

It has not been  verified whether it is possible to use `sqlx-mysql` without being affected by the vulnerability. If you really want to use it (which would only be safe if everything is running in a **completely** trusted environment) you can add the feature `sqlx-mysql` to the dependency `sea-orm` in the `Cargo.toml`.

More information on the vulnerability: [RUSTSEC-2023-0071](https://rustsec.org/advisories/RUSTSEC-2023-0071)
