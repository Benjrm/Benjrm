FROM node:26-alpine AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json /app/frontend/

RUN --mount=type=cache,target=/root/.npm npm ci

COPY frontend /app/frontend

RUN npm run build

FROM rust:1.95.0 AS build
WORKDIR /app/backend

RUN apt update && apt install -y libssl-dev

COPY --from=frontend /app/frontend/dist /app/frontend/dist
COPY backend /app/backend
COPY database-migrator /app/database-migrator

RUN --mount=type=cache,target=/app/backend/target/ \
    --mount=type=cache,target=/usr/local/cargo/git/db \
    --mount=type=cache,target=/usr/local/cargo/registry/ \
    cargo build --release; \
    cp "./target/release/benjrm" /bin/benjrm

# we have to use debian instead of alpine because we rely on openssl and openssl can cause segfaults on alpine.
# the requirement for openssl might be removed in the future.
FROM debian:12.13 AS final
WORKDIR /config

RUN apt update && apt install -y openssl curl

RUN useradd -m -u 1000 app

COPY --from=build /bin/benjrm /bin/benjrm

RUN chown app:app /bin/benjrm

EXPOSE 80

USER app

HEALTHCHECK --start-period=5s --start-interval=2s --interval=30s --timeout=2s --retries=5 CMD curl localhost:80/api/health

ENTRYPOINT ["/bin/benjrm"]
