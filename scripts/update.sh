#!/bin/bash
set -e

# Minimal API update: rebuild & restart only backend service (DB untouched)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$SCRIPT_DIR/logger.sh" ]; then
  echo "❌ Missing logger.sh"
  exit 1
fi
# shellcheck source=/dev/null
source "$SCRIPT_DIR/logger.sh"

ENV_FILE="$ROOT_DIR/.env"
COMPOSE_FILE="$ROOT_DIR/${DOCKER_COMPOSE_FILE:-docker-compose.yml}"
SERVICE="${BACKEND_SERVICE_NAME:-backend}"

log_step_start "🔄 Updating API service: $SERVICE"

# Load .env (no validation, just export for compose)
if [ ! -f "$ENV_FILE" ]; then
  log_error ".env file not found at $ENV_FILE"
  exit 1
fi
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

# Basic checks
if ! command -v docker >/dev/null 2>&1; then
  log_error "Docker is not installed"
  exit 1
fi
if [ ! -f "$COMPOSE_FILE" ]; then
  log_error "Compose file not found: $COMPOSE_FILE"
  exit 1
fi

# Rebuild only API service
log_info "Building $SERVICE..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build "$SERVICE"

# Restart only API service (no dependencies, no DB changes)
log_info "Restarting $SERVICE..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --no-deps "$SERVICE"

log_success "API updated successfully (DB untouched)"
log_step_end

echo
echo "✅ Done"
