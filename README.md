# Benjrm
> /ˈbɛndʒəmɪn/ – a quiz platform for interactive learning and live competition


We're currently building this project. Stay tuned for updates in the coming days.

## Development environment

For a complete development environment with hot reload for the frontend and test users, create an `.env` file based on `.env.example` and run:
```
docker compose -f compose.dev.yaml up --build
```

> On Linux hosts, the development image can be built with the local user UID/GID so bind-mounted files stay writable inside the container:
> 
> ```shell
> UID=$(id -u) GID=$(id -g) docker compose -f compose.dev.yaml up --build
> ```

### Test users

Admin user: admin, password: admin

> This credentials can be configured using the `KC_BOOTSTRAP_ADMIN_USERNAME` and `KC_BOOTSTRAP_ADMIN_PASSWORD` environment variables.

| Username   | Password |
| ---------- | -------- |
| demo-admin | password |
| user       | password |
| simon      | password |

> These users are configured in [services/identity-provider/mounts/init.sh](services/identity-provider/mounts/init.sh).

## Setup

### Configuration

Create an `.env` file based on `.env.example`. You should at least change:
- `DATABASE_PASSWORD`
- `DOMAIN`
- `PUBLIC_URL`
- `OIDC_CLIENT_SECRET`
- `OIDC_PUBLIC_IDP_URL`
- `KC_DB_PASSWORD`

### Reverse proxy

By default, this project uses traefik as reverse proxy. You can set up traefik using default configuration by following [docs/traefik/README.md](docs/traefik/README.md) or you can use your own traefik instance. If you don't want to use traefik at all, remove all `networks` and `labels` sections from `compose.yaml`.

### Run

```
docker compose up --build
```

Keycloak admin user: admin, password: admin

> This credentials can be configured using the `KC_BOOTSTRAP_ADMIN_USERNAME` and `KC_BOOTSTRAP_ADMIN_PASSWORD` environment variables.

### Use other identity provider than the one shipped in `compose.yaml`

If you don't want to use the identity provider shipped with this project, you can configure any identity provider that supports openid connect in the `.env` file.

:warning: **BUT:** you should **NOT** use any identity provider outside of your trusted environment. Due to security vulnerablilities ([RUSTSEC-2026-0098](https://rustsec.org/advisories/RUSTSEC-2026-0098), [RUSTSEC-2026-0099](https://rustsec.org/advisories/RUSTSEC-2026-0099), [RUSTSEC-2026-0104](https://rustsec.org/advisories/RUSTSEC-2026-0104)) an attacker might provide an ssl-certificate that's not valid for your idp's domain but is accepted. :warning:

## Why Benjrm

Each letter represents one of the creators. Together, it forms a name that is pronounced like "Benjamin". Represented using the Internationales Phonetisches Alphabet as /ˈbɛndʒəmɪn/

## API
Please refer to the [API-related documentation](docs/api/README.md).
