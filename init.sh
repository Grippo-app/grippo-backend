#!/bin/bash
set -e

ENV_FILE=".env"
DUMP_FILE="./dump.sql"
LOG_TAG="[INIT]"

# Проверяем аргумент (local или prod)
MODE="$1"

if [ -z "$MODE" ]; then
  echo "Usage: $0 [local|prod]"
  exit 1
fi

# Load .env
echo "$LOG_TAG Loading environment from $ENV_FILE"
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# Выбираем docker-compose файлы
if [ "$MODE" = "local" ]; then
  COMPOSE_FILES="-f docker-compose.yml -f docker-compose.local.yml"
elif [ "$MODE" = "prod" ]; then
  COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
else
  echo "Unknown mode: $MODE. Use 'local' or 'prod'."
  exit 1
fi

echo "$LOG_TAG Starting containers for mode: $MODE..."
docker compose --env-file "$ENV_FILE" $COMPOSE_FILES up -d --build

# Далее ждём postgres, импортируем дамп, ждём backend и проверяем сайт (без изменений)

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

echo "$LOG_TAG Waiting for backend container '$BACKEND_CONTAINER' to be ready..."
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

echo "$LOG_TAG Checking site on http://localhost ..."
if curl -sSf http://localhost > /dev/null; then
  echo "$LOG_TAG ✅ Site is reachable at http://localhost"
else
  echo "$LOG_TAG ⚠️ Site is not reachable at http://localhost (check nginx config)"
fi
