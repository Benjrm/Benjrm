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

| Username   | Password |
| ---------- | -------- |
| demo-admin | password |
| admin      | admin    |
| user       | password |
| simon      | password |

## Setup

Create an `.env` file based on `.env.example` and run:
```
docker compose up --build
```

Keycloak admin user: admin, password: admin

### Use other identity provider than the one shipped in `compose.yaml`

If you don't want to use the identity provider shipped with this project, you can configure any identity provider that supports openid connect in the `.env` file.

:warning: **BUT:** you should **NOT** use any identity provider outside of your trusted environment. Due to security vulnerablilities ([RUSTSEC-2026-0098](https://rustsec.org/advisories/RUSTSEC-2026-0098), [RUSTSEC-2026-0099](https://rustsec.org/advisories/RUSTSEC-2026-0099), [RUSTSEC-2026-0104](https://rustsec.org/advisories/RUSTSEC-2026-0104)) an attacker might provide an ssl-certificate that's not valid for your idp's domain but is accepted. :warning:

## Why Benjrm

Each letter represents one of the creators. Together, it forms a name that is pronounced like "Benjamin". Represented using the Internationales Phonetisches Alphabet as /ˈbɛndʒəmɪn/

## API
Please refer to the [API-related documentation](docs/api/README.md).
