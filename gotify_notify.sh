#!/bin/bash
# Usage: gotify_notify.sh <service_name>
SERVICE="$1"
SCRIPT_DIR="$(dirname "$0")"
ENV_FILE="$SCRIPT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
else
  echo ".env file not found in $SCRIPT_DIR!" >&2
  exit 1
fi

MESSAGE="MoP Card Tracker service ($SERVICE) stopped on $(hostname) at $(date)"
curl -X POST "$GOTIFY_SERVER/message?token=$GOTIFY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"title\":\"Service Down\",\"message\":\"$MESSAGE\"}"
