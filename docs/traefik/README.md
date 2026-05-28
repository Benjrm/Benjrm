# Traefik

This project contains an example traefik configuration located at `/services/traefik`.

## Setup

### Configuration

- Set the `DOMAIN` variable in the file `/.env`.
- Enter the directory `/services/traefik` and create an `.env` file based on `.env.example`.

The default config exposes the traeik dashboard at `traefik.<YOUR_DOMAIN>`. If you wish to disable this, delete the file `config/dashboard.yaml`.

### Cert resolver

The default config uses LetsEncrypt dnsChallenge. For testing with the staging servers, you can edit `traefik.yaml` and uncomment the lines:

```yaml
caServer: https://acme-staging-v02.api.letsencrypt.org/directory
```

If you wish to use httpChallenge instead, change `entryPoints.websecure.http.tls.certResolver: dnsResolver` to `entryPoints.websecure.http.tls.certResolver: httpResolver` in `traefik.yaml`. In this case, the environment variables starting with `RFC2136_` are not needed.

### Start traefik

Simply run `docker compose up` in `/services/traefik`.

### Local testing

If you want to start the release compose with traefik locally and without valid certs, you have to do the following:

- delete (or completely comment out) the file `config/tls.yaml`
- comment out `entryPoints.websecure.http.tls.certResolver` in the file `traefik.yaml`
- start traefik
- add your domains to `/etc/hosts`:
  ```
  127.0.0.1 yourdomain.de
  127.0.0.1 idp.yourdomain.de
  127.0.0.1 traefik.yourdomain.de
  ```
