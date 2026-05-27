# Traefik

This project contains an example traefik configuration located at `/services/traefik`.

## Setup

### Configuration

Enter the directory `/services/traefik` and create an `.env` file based on `.env.example`. The default config exposes the traeik dashboard at `traefik.<YOUR_DOMAIN>`. If you wish to disable this, delete the file `config/dashboard.yaml`.

### Cert resolver

The default config uses LetsEncrypt dnsChallenge. For testing with the staging servers, you can edit `traefik.yaml` and uncomment the lines:

```yaml
caServer: https://acme-staging-v02.api.letsencrypt.org/directory
```

If you wish to use httpChallenge instead, change `certResolver: dnsResolver` to `certResolver: httpResolver` in `traefik.yaml`. In this case, the environment variables starting with `RFC2136_` are not needed.

### Start traefik

Simply run `docker compose up` in `/services/traefik`.
