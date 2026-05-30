#!/bin/bash

# Usage:
# This script is used to initialize a running Keycloak server with hostname 'identity-provider' and port
# specified by the environment variable 'KC_HTTP_PORT' with a set of predefined users and their corresponding passwords.

# Define an associative array of users with their corresponding passwords.
# The keys of the array are the usernames, and the values are the passwords for those keys.
# In this example, there are four users: "demo-admin", "user", "admin", and "simon", all with the password "password".
declare -A USERS=(
  ["demo-admin"]="password"
  ["user"]="password"
  ["simon"]="password"
)

# Colors for better readability of the output in the terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NO_COLOR='\033[0m'

# define the Keycloak server URL using the environment variable KC_HTTP_PORT to specify the port on which the Keycloak
# server is running. The hostname 'identity-provider' is Keycloak's used service name defined in the 'docker-compose.dev.yml' file
# and the 'docker-compose.prod.yml.
# this URL will be used to make API calls to the Keycloak server for authentication and initialization purposes.
KEYCLOAK_URL="http://identity-provider:${KC_HTTP_PORT}"

# global variable to store the access token obtained from Keycloak.
# it will be used in subsequent API calls to authenticate and authorize the requests made to the Keycloak server.
ACCESS_TOKEN=""
get_admin_token() {
  echo -e "${BLUE}==> Getting admin token...${NO_COLOR}"

  ACCESS_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "client_id=admin-cli" \
    -d "username=${KC_BOOTSTRAP_ADMIN_USERNAME}" \
    -d "password=${KC_BOOTSTRAP_ADMIN_PASSWORD}" \
    -d "grant_type=password" | jq -r '.access_token')

  if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${RED}ERROR: Failed to get access token${NO_COLOR}"
    exit 1
  fi

  echo -e "${GREEN}==> Token '$ACCESS_TOKEN' received${NO_COLOR}"
}

create_user() {
  USERNAME=$1
  PASSWORD=$2

  echo -e "${BLUE}==> Checking if user '$USERNAME' exists ${NO_COLOR}"

  EXISTS=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/${KC_REALM_ID}/users?username=$USERNAME" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq length)

  if [ "$EXISTS" -gt 0 ]; then
    echo -e "${YELLOW}User '$USERNAME' already exists -> skipping ${NO_COLOR}"
    return
  fi

  echo -e "${BLUE}==> Creating user: '$USERNAME' with email '$USERNAME@example.com' ${NO_COLOR}"

  curl -s -X POST "$KEYCLOAK_URL/admin/realms/${KC_REALM_ID}/users" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"username\": \"$USERNAME\",
      \"enabled\": true,
      \"emailVerified\": true,
      \"email\": \"$USERNAME@example.com\",
      \"firstName\": \"${USERNAME^}\",
      \"lastName\": \"User\"
    }"

  echo -e "${BLUE}==> Fetching user id... ${NO_COLOR}"

  USER_ID=$(curl -s -X GET "$KEYCLOAK_URL/admin/realms/${KC_REALM_ID}/users?username=$USERNAME" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq -r '.[0].id')

  echo -e "${BLUE}==> Setting password '$PASSWORD' for user '$USERNAME' with email '$USERNAME@example.com' ${NO_COLOR}"

  curl -s -X PUT "$KEYCLOAK_URL/admin/realms/${KC_REALM_ID}/users/$USER_ID/reset-password" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"password\",
      \"value\": \"$PASSWORD\",
      \"temporary\": false
    }"

  echo -e "${GREEN}✔ User '$USERNAME' with email '$USERNAME@example.com' and password '$PASSWORD' created${NO_COLOR}"
}

function create_users() {
  for user in "${!USERS[@]}"; do
    create_user $user "${USERS[$user]}"
  done
}

function configure_user_profile() {
  echo -e "${BLUE}==> Configuring user profile...${NO_COLOR}"
  curl -s -X PUT "$KEYCLOAK_URL/admin/realms/${KC_REALM_ID}/users/profile" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d @/user-profile.json
}

function main() {
  get_admin_token
  configure_user_profile
  if [ "${INIT_MODE}" == "DEV" ]; then
    echo -e "${YELLOW} Warning: Running in development mode, creating default users... ${NO_COLOR}"
    create_users
  fi
  echo -e "${GREEN}==> Done${NO_COLOR}"
}
main
