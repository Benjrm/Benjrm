ARG BASE_IMAGE=alpine:3.24
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
    if echo "$RUST_TARGET" | grep -q -e '^i686' -e '^arm-'; then export RUSTFLAGS="-Clink-arg=-latomic" && export CFLAGS="-DBROKEN_CLANG_ATOMICS"; fi && \
    cargo zigbuild --release --target "$RUST_TARGET" && \
    cp "./target/$RUST_TARGET/release/benjrm" /bin/benjrm

FROM ${BASE_IMAGE} AS final
LABEL org.opencontainers.image.source=https://github.com/Benjrm/Benjrm
LABEL org.opencontainers.image.description="Benjrm - a quiz platform for interactive learning and live competition"

WORKDIR /config

RUN if command -v apk > /dev/null; then \
      apk add --no-cache curl; \
      adduser -D -u 1000 app; \
    else \
      apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*; \
      useradd -m -u 1000 app; \
    fi

COPY --from=build /bin/benjrm /bin/benjrm

RUN chown app:app /bin/benjrm

EXPOSE 80

USER app

HEALTHCHECK --start-period=5s --start-interval=2s --interval=30s --timeout=2s --retries=5 CMD curl localhost:80/api/health

ENTRYPOINT ["/bin/benjrm"]
