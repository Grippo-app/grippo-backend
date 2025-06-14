#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/${DOCKER_COMPOSE_FILE:-docker-compose.yml}"
DUMP_FILE="$ROOT_DIR/${DB_DUMP_FILE:-scripts/dump.sql}"
LOG_TAG="[INIT]"

echo "$LOG_TAG 🚀 Initializing ${APP_NAME:-App} v${APP_VERSION:-latest}"
echo "$LOG_TAG 📦 Using environment: $(basename "$ENV_FILE")"

# ─────────────────────────────────────────────
# 📦 Load .env
# ─────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "$LOG_TAG ❌ .env file not found at $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# ─────────────────────────────────────────────
# ⚙️ Render nginx/default.conf from template
# ─────────────────────────────────────────────
echo "$LOG_TAG 🛠 Rendering nginx config from template..."
bash "$ROOT_DIR/scripts/render-nginx.sh"

# ─────────────────────────────────────────────
# 🐳 Docker Compose up (с профилем https при необходимости)
# ─────────────────────────────────────────────
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "$LOG_TAG ❌ Docker compose file not found at $COMPOSE_FILE"
  exit 1
fi

echo "$LOG_TAG 🐳 Running docker-compose..."

if [ "$USE_HTTPS" = "true" ]; then
  echo "$LOG_TAG 🔐 USE_HTTPS=true — using profile 'https'"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile https up -d --build > /dev/null
else
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build > /dev/null
fi
# ─────────────────────────────────────────────
# 🐘 PostgreSQL wait
# ─────────────────────────────────────────────
echo "$LOG_TAG ⏳ Waiting for PostgreSQL to become ready..."
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

# ─────────────────────────────────────────────
# 🐘 Load dump.sql (optional)
# ─────────────────────────────────────────────
if [ -f "$DUMP_FILE" ]; then
  echo "$LOG_TAG 🔄 Importing dump: $DUMP_FILE"

  if [ "${DROP_SCHEMA_BEFORE_IMPORT}" = "true" ]; then
    echo "$LOG_TAG ⚠️ Dropping schema before import"
    docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER_NAME" \
      psql -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" \
      -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" 2>/dev/null
  fi

  docker exec -i "$POSTGRES_CONTAINER_NAME" \
    psql -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" -q -1 < "$DUMP_FILE"

  echo "$LOG_TAG ✅ Dump imported"
else
  echo "$LOG_TAG ⚠️ Dump file not found: $DUMP_FILE — skipping import"
fi

# ─────────────────────────────────────────────
# 🛡 Backend wait (via /health)
# ─────────────────────────────────────────────
echo "$LOG_TAG ⏳ Waiting for backend healthcheck..."

ATTEMPTS=0
MAX_ATTEMPTS=30
if [ "$USE_HTTPS" = "true" ]; then
  SCHEME="https"
else
  SCHEME="http"
fi

# Пингуем backend через NGINX, как будто мы клиент
BACKEND_URL="$SCHEME://$NGINX_SERVER_NAME/docs"

until curl -sSf "$BACKEND_URL" > /dev/null; do
  sleep 1
  ((ATTEMPTS++))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "$LOG_TAG ❌ Backend failed healthcheck at $BACKEND_URL"
    exit 1
  fi
done

echo "$LOG_TAG ✅ Backend is healthy at $BACKEND_URL"