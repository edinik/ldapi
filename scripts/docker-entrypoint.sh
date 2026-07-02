#!/bin/sh
set -e

mkdir -p /app/data

if [ -z "$ADMIN_PASSWORD" ]; then
  echo "ADMIN_PASSWORD is required. Set it in .env before starting the container." >&2
  exit 1
fi

node /app/scripts/docker-bootstrap.mjs

exec "$@"
