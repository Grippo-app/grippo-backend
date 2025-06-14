#!/bin/bash
set -e

# ─────────────────────────────────────────────
# 📍 Paths & Setup
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$SCRIPT_DIR/logger.sh" ]; then
  echo "❌ Missing logger.sh"
  exit 1
fi
source "$SCRIPT_DIR/logger.sh"

ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/${DOCKER_COMPOSE_FILE:-docker-compose.yml}"
DUMP_FILE="$ROOT_DIR/${DB_DUMP_FILE:-scripts/dump.sql}"

APP_NAME="${APP_NAME:-App}"
APP_VERSION="${APP_VERSION:-latest}"

# ─────────────────────────────────────────────
# 🚀 Initialization Start
# ─────────────────────────────────────────────

log_step_start "🚀 Initialization"
log_info "App: $APP_NAME"
log_info "Version: $APP_VERSION"
log_info "ENV File: $(basename \"$ENV_FILE\")"
log_step_end

# ─────────────────────────────────────────────
# 📦 Load .env
# ─────────────────────────────────────────────

log_step_start "📦 Loading .env"

if [ ! -f "$ENV_FILE" ]; then
  log_error ".env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE" || { log_error ".env syntax error"; exit 1; }
set +a

REQUIRED_VARS=(USE_HTTPS NGINX_SERVER_NAME BACKEND_HOST BACKEND_PORT POSTGRES_CONTAINER_NAME POSTGRES_DATABASE POSTGRES_USERNAME POSTGRES_PASSWORD)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    log_error "Missing required environment variable: $var"
    exit 1
  fi
done

log_success "Environment variables loaded"
log_step_end

# ─────────────────────────────────────────────
# 🛠 Render nginx config
# ─────────────────────────────────────────────

log_step_start "🛠 Rendering nginx config"

if [ ! -f "$ROOT_DIR/scripts/render-nginx.sh" ]; then
  log_error "render-nginx.sh script not found"
  exit 1
fi

bash "$ROOT_DIR/scripts/render-nginx.sh" || {
  log_error "render-nginx.sh execution failed"
  exit 1
}

if [ ! -s "$ROOT_DIR/nginx/default.conf" ]; then
  log_error "nginx/default.conf is empty after rendering. Check required variables."
  exit 1
fi

log_success "nginx/default.conf rendered successfully"
log_step_end

# ─────────────────────────────────────────────
# 🐳 Docker Compose Up
# ─────────────────────────────────────────────

log_step_start "🐳 Starting containers"

if ! command -v docker &>/dev/null; then
  log_error "Docker is not installed"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  log_error "docker-compose.yml not found at $COMPOSE_FILE"
  exit 1
fi

PROFILE_ARG=""
[ "$USE_HTTPS" = "true" ] && PROFILE_ARG="--profile https"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" $PROFILE_ARG up -d --build > /dev/null || {
  log_error "Failed to start Docker containers"
  exit 1
}

log_success "Containers started successfully"
log_step_end

# ─────────────────────────────────────────────
# 🐘 Wait for PostgreSQL
# ─────────────────────────────────────────────

log_step_start "🐘 Waiting for PostgreSQL"

ATTEMPTS=0
MAX_ATTEMPTS=30

until docker exec "$POSTGRES_CONTAINER_NAME" pg_isready -U "$POSTGRES_USERNAME" > /dev/null 2>&1; do
  sleep 1
  ((ATTEMPTS++))
  log_info "Waiting for PostgreSQL... attempt $ATTEMPTS of $MAX_ATTEMPTS"

  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    log_error "PostgreSQL is not ready within timeout"
    docker compose logs "$POSTGRES_CONTAINER_NAME"
    exit 1
  fi

  docker ps | grep "$POSTGRES_CONTAINER_NAME" > /dev/null || {
    log_error "PostgreSQL container is not running"
    exit 1
  }
done

log_success "PostgreSQL is ready"
log_step_end

# ─────────────────────────────────────────────
# 🗃️ Import dump (optional)
# ─────────────────────────────────────────────

log_step_start "🗃 Importing database dump"

if [ -f "$DUMP_FILE" ]; then
  log_info "Dump found: $DUMP_FILE"

  if [ "$DROP_SCHEMA_BEFORE_IMPORT" = "true" ]; then
    log_info "DROP_SCHEMA_BEFORE_IMPORT=true → dropping schema"
    docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER_NAME" \
      psql -qAt -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" \
      -v ON_ERROR_STOP=1 \
      -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" > /dev/null 2>&1
  else
    log_info "Schema reset skipped (DROP_SCHEMA_BEFORE_IMPORT=false)"
  fi

  docker exec -i "$POSTGRES_CONTAINER_NAME" \
    psql -U "$POSTGRES_USERNAME" -d "$POSTGRES_DATABASE" -q -1 -t < "$DUMP_FILE" > /dev/null 2>&1

  log_success "Database dump imported successfully"
else
  log_warn "Dump file not found: $DUMP_FILE — skipping import"
fi

log_step_end

# ─────────────────────────────────────────────
# 🛡 Backend healthcheck (/docs)
# ─────────────────────────────────────────────

log_step_start "🛡 Checking backend (Swagger UI)"

SCHEME="http"
[ "$USE_HTTPS" = "true" ] && SCHEME="https"
BACKEND_URL="$SCHEME://$NGINX_SERVER_NAME/docs"

ATTEMPTS=0
MAX_ATTEMPTS=30

while true; do
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL")

  if [ "$status_code" -eq 200 ]; then
    break
  fi

  ((ATTEMPTS++))
  log_info "Waiting for backend... status: $status_code (attempt $ATTEMPTS of $MAX_ATTEMPTS)"

  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    log_error "Backend is unreachable at $BACKEND_URL or returned error (last status: $status_code)"
    docker compose logs
    exit 1
  fi

  sleep 1
done

log_success "Swagger UI is reachable"
log_step_end

# ─────────────────────────────────────────────
# ✅ Done
# ─────────────────────────────────────────────

echo ""
echo "✅ Initialization complete!"
echo "📌 Access your app at: $BACKEND_URL"
