#!/bin/bash
set -e

# ─────────────────────────────────────────────
# 📍 Paths & Setup
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

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
log_info "ENV File: $(basename "$ENV_FILE")"
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
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

log_info "USE_HTTPS=$USE_HTTPS"
log_info "NGINX_SERVER_NAME=$NGINX_SERVER_NAME"
log_info "BACKEND_HOST=$BACKEND_HOST"
log_info "BACKEND_PORT=$BACKEND_PORT"
log_info "POSTGRES_CONTAINER_NAME=$POSTGRES_CONTAINER_NAME"
log_info "POSTGRES_DATABASE=$POSTGRES_DATABASE"

log_success "Environment variables loaded"
log_step_end

# ─────────────────────────────────────────────
# 🛠 Render nginx config
# ─────────────────────────────────────────────

log_step_start "🛠 Rendering nginx config"

if [ "$USE_HTTPS" = "true" ]; then
  log_info "USE_HTTPS=true → using HTTPS template"
else
  log_info "USE_HTTPS=false → using local HTTP template"
fi

bash "$ROOT_DIR/scripts/render-nginx.sh"
log_success "nginx/default.conf rendered successfully"
log_step_end

# ─────────────────────────────────────────────
# 🐳 Docker Compose Up
# ─────────────────────────────────────────────

log_step_start "🐳 Starting containers"

log_info "Compose file: $(basename "$COMPOSE_FILE")"
log_info "Compose path: $COMPOSE_FILE"
log_info "Active profile: $( [ "$USE_HTTPS" = "true" ] && echo 'https' || echo 'http' )"

if [ ! -f "$COMPOSE_FILE" ]; then
  log_error "docker-compose.yml not found at $COMPOSE_FILE"
  exit 1
fi

if [ "$USE_HTTPS" = "true" ]; then
  log_info "Launching with profile 'https'"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" --profile https up -d --build > /dev/null
else
  log_info "Launching default profile (no HTTPS)"
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build > /dev/null
fi

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
  log_info "Waiting... attempt $ATTEMPTS of $MAX_ATTEMPTS"

  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    log_error "PostgreSQL is not ready within timeout"
    exit 1
  fi
done

log_success "PostgreSQL is ready"
log_step_end

# ─────────────────────────────────────────────
# 🗃️ Import dump (optional)
# ─────────────────────────────────────────────

log_step_start "🗃 Importing database dump"

log_info "Importing into: $POSTGRES_DATABASE (user: $POSTGRES_USERNAME)"

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

log_info "SCHEME: $SCHEME"
log_info "SERVER: $NGINX_SERVER_NAME"
log_info "Full URL: $BACKEND_URL"

ATTEMPTS=0
MAX_ATTEMPTS=30

log_info "Checking availability: $BACKEND_URL"

until curl -sSf "$BACKEND_URL" > /dev/null; do
  sleep 1
  ((ATTEMPTS++))
  log_info "Waiting... attempt $ATTEMPTS of $MAX_ATTEMPTS"

  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    log_error "Backend is unreachable at $BACKEND_URL"
    exit 1
  fi
done

log_success "Swagger UI is reachable"
log_step_end

# ─────────────────────────────────────────────
# ✅ Done
# ─────────────────────────────────────────────

echo ""
echo "✅ Initialization complete!"
echo "📌 Access your app at: $BACKEND_URL"