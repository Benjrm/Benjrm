FROM --platform=$BUILDPLATFORM node:26-alpine AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json /app/frontend/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY frontend /app/frontend

RUN npm run build

FROM --platform=$BUILDPLATFORM ghcr.io/rust-cross/cargo-zigbuild AS build
ARG TARGETPLATFORM
WORKDIR /app/backend

ARG RUST_TARGET
RUN rustup target add "$RUST_TARGET"

COPY --from=frontend /app/frontend/dist /app/frontend/dist
COPY backend /app/backend
COPY database-migrator /app/database-migrator

RUN --mount=type=cache,target=/app/backend/target/ \
    --mount=type=cache,target=/usr/local/cargo/git/db \
    --mount=type=cache,target=/usr/local/cargo/registry/ \
    if echo "$RUST_TARGET" | grep -q -e '^i686' -e '^arm'; then export RUSTFLAGS="-Clink-arg=-latomic" && export CFLAGS="-DBROKEN_CLANG_ATOMICS"; fi && \
    cargo zigbuild --release --target "$RUST_TARGET" && \
    cp "./target/$RUST_TARGET/release/benjrm" /bin/benjrm

# we have to use debian instead of alpine because we rely on openssl and openssl can cause segfaults on alpine.
# the requirement for openssl might be removed in the future.
FROM debian:12.13 AS final
LABEL org.opencontainers.image.source=https://github.com/Benjrm/Benjrm
LABEL org.opencontainers.image.description="Benjrm - a quiz platform for interactive learning and live competition"

WORKDIR /config

RUN apt update && apt install -y openssl curl

RUN useradd -m -u 1000 app

COPY --from=build /bin/benjrm /bin/benjrm

RUN chown app:app /bin/benjrm

EXPOSE 80

USER app

HEALTHCHECK --start-period=5s --start-interval=2s --interval=30s --timeout=2s --retries=5 CMD curl localhost:80/api/health

ENTRYPOINT ["/bin/benjrm"]
