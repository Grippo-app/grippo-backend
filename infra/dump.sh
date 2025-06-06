#!/bin/bash

# dir .env
ENV_FILE="../.env"

# is founded .env
if [ ! -f "$ENV_FILE" ]; then
  echo ".env file not found at $ENV_FILE"
  exit 1
fi

# load variables .env
export $(grep -v '^#' $ENV_FILE | xargs)

# Check variables
if [[ -z "$POSTGRES_HOST" || -z "$POSTGRES_PORT" || -z "$POSTGRES_USERNAME" || -z "$POSTGRES_PASSWORD" || -z "$POSTGRES_DATABASE" || -z "$POSTGRES_CONTAINER_NAME" ]]; then
  echo "All environment variables must be set in .env"
  exit 1
fi

# create dump
docker exec -t "$POSTGRES_CONTAINER_NAME" pg_dump -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" --inserts --no-owner --no-acl > dump.sql

if [ $? -eq 0 ]; then
  echo "Database dump saved to dump.sql"
else
  echo "Failed to create database dump"
fi
