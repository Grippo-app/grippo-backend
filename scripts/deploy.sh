#!/bin/bash
set -e

# ─────────────────────────────────────────────
# 📍 Paths & Setup
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGGER_SCRIPT="$SCRIPT_DIR/internal/logger.sh"

if [ ! -f "$LOGGER_SCRIPT" ]; then
  echo "❌ Missing logger script at $LOGGER_SCRIPT"
  exit 1
fi
# shellcheck source=./internal/logger.sh
source "$LOGGER_SCRIPT"

ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/${DOCKER_COMPOSE_FILE:-docker-compose.yml}"
DUMP_FILE="$ROOT_DIR/${DB_DUMP_FILE:-scripts/dump.sql}"

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

REQUIRED_VARS=(BACKEND_HOST BACKEND_PORT POSTGRES_CONTAINER_NAME POSTGRES_DATABASE POSTGRES_USERNAME POSTGRES_PASSWORD POSTGRES_PORT)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    log_error "Missing required environment variable: $var"
    exit 1
  fi
done

log_success "Environment variables loaded"
log_step_end

# ─────────────────────────────────────────────
# 🐳 Docker Compose Reset & Up
# ─────────────────────────────────────────────

log_step_start "🐳 Resetting Docker containers"

if ! command -v docker &>/dev/null; then
  log_error "Docker is not installed"
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  log_error "docker-compose.yml not found at $COMPOSE_FILE"
  exit 1
fi

log_info "Stopping and removing old containers, volumes, networks..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v > /dev/null || {
  log_error "Failed to stop and remove containers"
  exit 1
}

log_info "Building and starting containers..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build > /dev/null || {
  log_error "Failed to start Docker containers"
  exit 1
}

log_success "Containers reset and started successfully"
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
# ✅ Done
# ─────────────────────────────────────────────

echo ""
echo "✅ Initialization complete!"
