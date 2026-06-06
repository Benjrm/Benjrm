# using the latest stable Keycloak image as the base image for our custom Keycloak server.
# This image includes the Keycloak server and our custom realm configuration including the clients and their settings.
# It sets up the Keycloak server to import the realm configuration on startup, which allows us to have a pre-configured Keycloak server with our desired realm and clients ready to use.
FROM quay.io/keycloak/keycloak:26.6.1

# Copy the realm configuration file to the Keycloak data import directory.
# https://www.keycloak.org/server/importExport#_importing_a_realm_during_startup
# note: the realm configuration file uses environment variables within it, so we
# need to copy it to the image and the container will replace the environment variables with their values on startup.
# https://www.keycloak.org/server/importExport#_using_environment_variables_within_the_realm_configuration_files

# This realm.template.json configures the realm and the clients.
# The realm called 'benjrm' is created with the following client:
# - 'api' for the server-side application, which uses the standard flow (Auhorization Code Flow with Proof Key for Code Exchange (PKCE)) and requires a client secret.
# Please note that the realm configuration uses environment variables for the client configuration, so you need
# to adjust '.env.example' file with the appropriate values for the client configuration.
# https://www.keycloak.org/server/importExport#_using_environment_variables_within_the_realm_configuration_files
COPY ./mounts/realm.template.json \
    /opt/keycloak/data/import/realm.template.json

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]

USER keycloak

# start the server in production mode and import the realm on first startup
# https://www.keycloak.org/server/importExport#_importing_a_realm_during_startup
# note: this command will be overridden by the command start-dev --import realm in the docker-compose.dev.yml file
# to start the server in development mode.
CMD ["start", "--import-realm"]
