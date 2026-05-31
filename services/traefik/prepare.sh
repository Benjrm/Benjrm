#!/bin/sh

/bin/sh -c 'eval "cat <<EOF
$(cat /traefik.tpl)
EOF" > /traefik.yaml'

/bin/sh /entrypoint.sh --configFile=/traefik.yaml
