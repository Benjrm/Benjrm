# Benjrm's backend

This is the backend for Benjrm's quizes. Here is how to run it:

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
