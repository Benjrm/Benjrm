# Benjrm
> /ˈbɛndʒəmɪn/ – a quiz platform for interactive learning and live competition


We're currently building this project. Stay tuned for updates in the coming days.

## Development environment
First, set up the database by creating an `.env` file based on `.env.example` and running `docker compose up`.
Or, for faster development, run the respective development Docker Compose file using: `docker compose -f compose.dev.yaml up`
On Linux hosts, the development image can be built with the local user UID/GID so bind-mounted files stay writable inside the container:

```shell
UID=$(id -u) GID=$(id -g) docker compose -f compose.dev.yaml up --build
```

Next, follow the instructions in the [backend README](backend/README.md) and the [frontend README](frontend/README.md).

## Why Benjrm

Each letter represents one of the creators. Together, it forms a name that is pronounced like "Benjamin". Represented using the Internationales Phonetisches Alphabet as /ˈbɛndʒəmɪn/
