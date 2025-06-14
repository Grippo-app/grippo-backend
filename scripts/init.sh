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
# 🐳 Docker Compose up
# ─────────────────────────────────────────────
if [ ! -f "$COMPOSE_FILE" ]; then
  echo "$LOG_TAG ❌ Docker compose file not found at $COMPOSE_FILE"
  exit 1
fi

echo "$LOG_TAG 🐳 Running docker-compose..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build > /dev/null

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
# 🛡 Backend wait
# ─────────────────────────────────────────────
echo "$LOG_TAG ⏳ Waiting for backend container '$BACKEND_CONTAINER' to be ready..."
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

# ─────────────────────────────────────────────
# 🌐 Site check Swagger UI на /docs
# ─────────────────────────────────────────────

if [ "$USE_HTTPS" = "true" ]; then
  SCHEME="https"
else
  SCHEME="http"
fi

# Если локальный сервер — убираем порт из URL
if [[ "$NGINX_SERVER_NAME" == "localhost" || "$NGINX_SERVER_NAME" == "127.0.0.1" ]]; then
  URL="$SCHEME://$NGINX_SERVER_NAME/docs"
else
  # Если стандартный порт, не добавляем
  if { [ "$SCHEME" = "http" ] && [ "$PORT" = "80" ]; } || { [ "$SCHEME" = "https" ] && [ "$PORT" = "443" ]; }; then
    URL="$SCHEME://$NGINX_SERVER_NAME/docs"
  else
    URL="$SCHEME://$NGINX_SERVER_NAME:$PORT/docs"
  fi
fi

echo "$LOG_TAG 🌍 Checking Swagger UI on $URL ..."

if curl -sSf "$URL" > /dev/null; then
  echo "$LOG_TAG ✅ Swagger UI is reachable at $URL"
else
  echo "$LOG_TAG ⚠️ Swagger UI is NOT reachable at $URL (check nginx config and backend)"
fi