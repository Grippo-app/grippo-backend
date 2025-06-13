#!/bin/bash
set -e

ENV_FILE=".env"
DUMP_FILE="./dump.sql"
LOG_TAG="[INIT]"

# Load .env
echo "$LOG_TAG Loading environment from $ENV_FILE"
set -a
# shellcheck source=.env
source "$ENV_FILE"
set +a

# Start docker containers
echo "$LOG_TAG Starting containers..."
docker compose --env-file "$ENV_FILE" up -d --build

# Wait for PostgreSQL to be ready
echo "$LOG_TAG Waiting for PostgreSQL to become ready..."
ATTEMPTS=0
MAX_ATTEMPTS=30

until docker exec "$POSTGRES_CONTAINER_NAME" pg_isready -U "$POSTGRES_USERNAME" > /dev/null 2>&1; do
  sleep 1
  ((ATTEMPTS++))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "$LOG_TAG ❌ PostgreSQL failed to become ready within 30 seconds"
    exit 1
  fi
done

echo "$LOG_TAG ✅ PostgreSQL is ready"

# Optional DB reset and import
if [ -f "$DUMP_FILE" ]; then
  echo "$LOG_TAG Resetting schema and importing dump.sql..."
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER_NAME" \
    psql -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" \
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

  docker exec -i "$POSTGRES_CONTAINER_NAME" \
    psql -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" -q -1 < "$DUMP_FILE"

  echo "$LOG_TAG ✅ Dump imported"
else
  echo "$LOG_TAG ⚠️ dump.sql not found, skipping import"
fi

# Wait for backend to respond (port or logs)
echo "$LOG_TAG Waiting for backend container '$BACKEND_CONTAINER' to be ready..."

# Try for up to 30 seconds
ATTEMPTS=0
MAX_ATTEMPTS=30

until docker logs "$BACKEND_CONTAINER" 2>&1 | grep -q "Nest application successfully started"; do
  sleep 1
  ((ATTEMPTS++))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "$LOG_TAG ❌ Backend failed to start within 30 seconds"
    echo "$LOG_TAG 🔍 Last 20 lines of logs:"
    docker logs "$BACKEND_CONTAINER" --tail 20
    exit 1
  fi
done

echo "$LOG_TAG ✅ Backend container is ready"

# Final check: localhost via nginx (port 80)
echo "$LOG_TAG Checking site on http://localhost ..."
if curl -sSf http://localhost > /dev/null; then
  echo "$LOG_TAG ✅ Site is reachable at http://localhost"
else
  echo "$LOG_TAG ⚠️ Site is not reachable at http://localhost (check nginx config)"
fi