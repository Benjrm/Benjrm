#!/bin/sh

set -e

cargo clippy --all-features -- --deny warnings
cargo clippy --all-features --release -- --deny warnings
cargo clippy --all-features --tests -- --deny warnings
cargo clippy --all-features --tests --release -- --deny warnings
cargo test --all-features
cargo test --all-features --release
cargo fmt --all --check
cargo audit
