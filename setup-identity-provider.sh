#!/bin/bash
# inspired from https://medium.com/norsk-helsenett/local-development-with-keycloak-part-2-3d4e95f324c0
# docker compose -f docker-compose.dev.yml rm -sfv identity-provider && docker compose -f docker-compose.dev.yml up identity-provider

# Colors for better readability of the output in the terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NO_COLOR='\033[0m'

# A realm manages a set of users, credentials, roles, and groups.
# A user belongs to and logs into a realm.
# Realms are isolated from one another and can only manage and authenticate the users that they control.
CUSTOM_REALM_NAME=demo_realm

# Clients are entities that can request Keycloak to authenticate a user.
# Most often, clients are applications and services that want to use Keycloak to secure themselves and provide a single sign-on solution.
# Clients can also be entities that just want to request identity information or an access token so that they can securely invoke other services on the network that are secured by Keycloak.
CUSTOM_CLIENT_NAME=demo_client

CUSTOM_ROLE_NAME=demo-role

# Define an associative array of users with their corresponding passwords.
# The keys of the array are the usernames, and the values are the passwords for those keys.
# In this example, there are four users: "demo-admin", "user", "admin", and "simon", all with the password "password".
declare -A USERS=(
  ["demo-admin"]="password"
  ["user"]="password"
  ["admin"]="password"
  ["simon"]="password"
)

function print_status {
  local exit_code=$1
  local success_msg=$2
  local error_msg=$3
  if [ "$exit_code" -eq 0 ]; then
    echo -e "${GREEN}${success_msg}${NO_COLOR}"
  else
    echo -e "${RED}${error_msg}${NO_COLOR}"
  fi
}

function CreateUserInRealm {
  # while loop to parse the arguments passed to the function.
  # The loop continues as long as there are arguments left to process ($# -gt 0).
  # $# is a special variable in Bash that holds the number of positional arguments passed to the function.
  while [ $# -gt 0 ]; do
    case "$1" in
      --realm*|-r*) # checks it the first argument starts with --realm or -r
        # if --realm <realm_name> format is used, shift the arguments to get the realm name in the next argument
        # else if --realm=<realm_name> format is used, the realm name is already in the same argument and no need to shift
        if [[ "$1" != *=* ]]; then shift; fi
        # $1 is the current argument being processed, and # operator is used to remove the shortest match of the following pattern (*= in this case) from the beginning of the string.
        SUPPLIED_REALM="${1#*=}"
        ;; # ends the current pattern block and moves to the next one
      --username*|-u*)
        if [[ "$1" != *=* ]]; then shift; fi
        SUPPLIED_USER_NAME="${1#*=}"
        ;;
      --password*|-p*)
        if [[ "$1" != *=* ]]; then shift; fi
        SUPPLIED_USER_PASSWORD="${1#*=}"
        ;;
      *) # default case if argument doesn't match any of the above patterns
        # prints an error message to standard error (>&2) file descriptor and exits the script with a status code of 1 (indicating an error).
        >&2 echo -e "${RED}Error: Invalid argument${NO_COLOR}\n"
        exit 1
        ;;
    esac # ends the case statement
    shift # shifts the arguments to the left, so that the next argument becomes the current argument ($1) for the next iteration of the loop
  done
  echo -e "${BLUE}==> Creating demo user '$SUPPLIED_USER_NAME' in demo realm '$SUPPLIED_REALM'"
  /opt/keycloak/bin/kcadm.sh create users \
    --target-realm "$SUPPLIED_REALM" \
    --set username="$SUPPLIED_USER_NAME" \
    --set enabled=true \
    --set emailVerified=true \
    --set "email=${SUPPLIED_USER_NAME}@example.com" \
    --set "firstName=${SUPPLIED_USER_NAME}First" \
    --set "lastName=${SUPPLIED_USER_NAME}Last" \
    --output
  print_status $? \
    "\n${GREEN}Success: Created user '$SUPPLIED_USER_NAME' in demo realm '$SUPPLIED_REALM' ${NO_COLOR}" \
    "\n${RED}Error: Failed to create user '$SUPPLIED_USER_NAME' in demo realm '$SUPPLIED_REALM' ${NO_COLOR}"

  echo -e "${BLUE}==> Setting password for user '$SUPPLIED_USER_NAME' in demo realm '$SUPPLIED_REALM' ${NO_COLOR}"
  /opt/keycloak/bin/kcadm.sh set-password \
    --target-realm "$SUPPLIED_REALM" \
    --username "$SUPPLIED_USER_NAME" \
    --new-password "$SUPPLIED_USER_PASSWORD"
  print_status $? \
    "\n${GREEN}Success: Set password '$SUPPLIED_USER_PASSWORD' for user '$SUPPLIED_USER_NAME' in demo realm '$SUPPLIED_REALM' ${NO_COLOR}" \
    "\n${RED}Error: Failed to set password '$SUPPLIED_USER_PASSWORD' for user '$SUPPLIED_USER_NAME' in demo realm '$SUPPLIED_REALM' ${NO_COLOR}"
}

function wait_for_keycloak() {
  if [ -z "$KC_HEALTH_ENABLED" ] || [ "$KC_HEALTH_ENABLED" != "true" ]; then
    echo -e "${YELLOW}Warning: KC_HEALTH_ENABLED is not set to true, skipping health check and waiting for a fixed mount of time (30 seconds) for Keycloak to start up ${NO_COLOR}"
    sleep 30
    return
  fi

  PORT="${KC_HTTP_PORT:-8080}"
  if [ "${KC_HTTP_MANAGEMENT_HEALTH_ENABLED:-false}" = "true" ] && \
     [ -n "${KC_HTTP_MANAGEMENT_PORT:-}" ]; then
      PORT="${KC_HTTP_MANAGEMENT_PORT}"
  fi


  while : # Endless loop (while : Bash-Builtin) to check if Keycloak is ready to accept connections
  do
    # open a bidirectional TCP connection to port 9000 on localhost and assigns it to file descriptor 3.
    # if the port is open and accepting connections, the command will succeed, otherwise it will fail.
    exec 3<>/dev/tcp/127.0.0.1/"$PORT"

    # sends and HTTP GET /health/ready request to port 9000 on localhost and assigns it to file descriptor 3.
    # If the port is open and accepting connections, the command will succeed, otherwise it will fail.
    echo -e "GET /health/ready HTTP/1.1\nHost: http://localhost:$PORT\nConnection: close\n\n" >&3

    # Checks the exit status of the previous command (the HTTP request). $? is a special variable in Bash that
    # holds the exit status of the last command executed.
    # If the exit status is 0 (success), it means that the port is open and accepting connections,
    # and the script will print "==> KC Ready" and break out of the loop
    if [ $? -eq 0 ]
    then
      echo -e "${GREEN}==> KC Ready"
      break
    fi
    # If the exist status is not 0 (failure), it means that the port is not open or not accepting connections,
    # and the script will print "==> KC not ready, sleeping a bit and checking again" and sleep for 2 seconds before checking again.
    echo -e "${YELLOW}==> KC not ready, sleeping a bit and checking again"
    sleep 2
  done
}

function configure_admin_connection() {
  echo -e "${BLUE}==> Configuring admin connection"
    /opt/keycloak/bin/kcadm.sh config credentials \
      --server http://localhost:${KC_HTTP_PORT} \
      --realm master \
      --user "$KC_BOOTSTRAP_ADMIN_USERNAME" \
      --password "$KC_BOOTSTRAP_ADMIN_PASSWORD"
    print_status $? \
      "${GREEN}Success: Login as '$KC_BOOTSTRAP_ADMIN_USERNAME' user with password '$KC_BOOTSTRAP_ADMIN_PASSWORD' to master realm on 'http://localhost:8088'${NO_COLOR}" \
      "${RED}Error: Failed to login as '$KC_BOOTSTRAP_ADMIN_USERNAME' user with password '$KC_BOOTSTRAP_ADMIN_PASSWORD' to master realm on 'http://localhost:8088'${NO_COLOR}"
}

function disable_ssl_required_on_master_realm() {
    echo -e "${BLUE}==> Disabling SSL Required on master realm, because source of noice for local dev use"
    /opt/keycloak/bin/kcadm.sh update realms/master \
      --set sslRequired=NONE
    print_status $? \
      "${GREEN}Success: SSL Required disabled on master realm ${NO_COLOR}" \
      "${GREEN}Error: Failed to disable SSL Required on master realm ${NO_COLOR}"
}

function create_demo_realm() {
    echo -e "${BLUE}==> Creating demo realm"
    /opt/keycloak/bin/kcadm.sh create realms \
      --set realm="$CUSTOM_REALM_NAME" \
      --set enabled=true \
      --set sslRequired=NONE \
      --output
    print_status $? \
      "\n${GREEN}Success: Created realm '$CUSTOM_REALM_NAME' with SSL required disabled" \
      "\n${RED}Error: Failed to create realm '$CUSTOM_REALM_NAME' with SSL required disabled"
}

function create_openid_scope() {
  echo -e "${BLUE}===> Creating client scope openid ${NO_COLOR}"
  /opt/keycloak/bin/kcadm.sh create client-scopes \
    --target-realm "$CUSTOM_REALM_NAME" \
    --set id="openid_scope_id" \
    --set name="openid" \
    --set protocol=openid-connect \
    --set 'attributes."include.in.token.scope"=true' \
    --output
  print_status $? \
    "\n${GREEN}Success: Created client scope openid in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}" \
    "\n${RED}Error: Failed to create client scope openid in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}"
}

CUSTOM_CLIENT_ID=demo_client_resource_id
function create_demo_client() {
  echo -e "${BLUE}==> Creating demo oauth client registration in demo realm"
  /opt/keycloak/bin/kcadm.sh create clients \
    --target-realm "$CUSTOM_REALM_NAME" \
    --set id="$CUSTOM_CLIENT_ID" \
    --set clientId="$CUSTOM_CLIENT_NAME" \
    --set publicClient="true" \
    --set "redirectUris=[\"*\"]" \
    --set "webOrigins=[\"*\"]" \
    --set directAccessGrantsEnabled=true \
    --set enabled=true \
    --output
  print_status $? \
    "\n${GREEN}Success: Created client '$CUSTOM_CLIENT_NAME' with id '$CUSTOM_CLIENT_ID' in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}" \
    "\n${RED}Error: Failed to create client '$CUSTOM_CLIENT_NAME' with id '$CUSTOM_CLIENT_ID' in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}"
}

function add_openid_scope_to_client() {
  echo -e "${BLUE}==> Adding scope openid to client $CUSTOM_CLIENT_NAME"
  /opt/keycloak/bin/kcadm.sh update \
    clients/$CUSTOM_CLIENT_ID/default-client-scopes/openid_scope_id \
    --target-realm "$CUSTOM_REALM_NAME"
  print_status $? \
    "Success: Added client scope open id to client '$CUSTOM_CLIENT_NAME' with id '$CUSTOM_CLIENT_ID' in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}" \
    "Error: Failed to add client scope open id to client '$CUSTOM_CLIENT_NAME' with id '$CUSTOM_CLIENT_ID' in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}"
}

function create_demo_role() {
    echo -e "${BLUE}==> Creating demo role in demo realm"
    /opt/keycloak/bin/kcadm.sh create roles \
      --target-realm "$CUSTOM_REALM_NAME" \
      --set name="$CUSTOM_ROLE_NAME" \
      --output
    print_status $? \
      "\n${GREEN}Success: Created roel '$CUSTOM_ROLE_NAME' in demo realm '$CUSTOM_REALM_NAME' ${NO_COLOR}" \
      "\n${RED}Error: Failed to create role '$CUSTOM_ROLE_NAME' in demo realm '$CUSTOM_REALM_NAME' ${NO_COLOR}"
}

function create_demo_users() {
  echo -e "${BLUE}==> Creating demo users in demo realm"
  for username in "${!USERS[@]}"; do
    password="${USERS[$username]}"
    CreateUserInRealm \
      --realm "$CUSTOM_REALM_NAME" \
      --username "$username" \
      --password "$password"
    assign_role_to_user "$username"
  done
}

function assign_role_to_user() {
    local username=$1
    /opt/keycloak/bin/kcadm.sh add-roles \
      --target-realm "$CUSTOM_REALM_NAME" \
      --uusername "$username" \
      --rolename "$CUSTOM_ROLE_NAME"
    print_status $? \
      "\n${GREEN}Success: Assign role '$CUSTOM_ROLE_NAME' to user '$username' in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}" \
      "\n${RED}Error: Failed to assign role '$CUSTOM_CUSTOM_ROLE_NAME' to user '$username' in realm '$CUSTOM_REALM_NAME' ${NO_COLOR}"
}

function print_final_message() {
    echo -e "${GREEN}Demo setup done ${NO_COLOR}"
    echo -e "${GREEN}Keeping container alive indefinitely until it's shut down from the outside ${NO_COLOR}"
    echo -e "${YELLOW}To get user access token run ${RED}curl --request POST --url http://localhost:8088/realms/$CUSTOM_REALM_NAME/protocol/openid-connect/token --header 'Content-Type: application/x-www-form-urlencoded' --data client_id=$CUSTOM_CLIENT_NAME --data username=demo-admin --data password=password --data realm=$CUSTOM_REALM_NAME --data grant_type=password ${NO_COLOR}"
}

function keep_container_alive() {
  sleep infinity
}

function print_current_configuration() {
    echo -e "${BLUE}==> Printing out the current configuration${NO_COLOR}"
    /opt/keycloak/bin/kc.sh show-config --verbose
}

function start_server_in_development_mode() {
  echo -e "${BLUE}==> Starting the server in development mode"
  /opt/keycloak/bin/kc.sh start-dev &
  echo -e "${BLUE}Waiting a bit for startup..."
  sleep 6
}

function main() {
  echo -e "${BLUE}Setup Identity Provider..."
  print_current_configuration
  start_server_in_development_mode
  wait_for_keycloak
  configure_admin_connection
  disable_ssl_required_on_master_realm
  create_demo_realm
  create_openid_scope
  create_demo_client
  add_openid_scope_to_client
  create_demo_role
  create_demo_users
  print_final_message
  keep_container_alive
}
main