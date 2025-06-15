#!/bin/bash
set -e
trap 'last_code=$?; log_error "Script failed (exit code: $last_code) at line $LINENO"; exit $last_code' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
NGINX_DIR="$ROOT_DIR/nginx"

# Подключаем логгер
source "$ROOT_DIR/scripts/logger.sh"

log_info "🧩 Loading environment..."

if [ ! -f "$ENV_FILE" ]; then
  log_error "Missing .env file at $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if [ "$USE_HTTPS" = "true" ]; then
  TEMPLATE_FILE="$NGINX_DIR/default.remote.conf.template"
  log_info "USE_HTTPS=true → using remote HTTPS template"
else
  TEMPLATE_FILE="$NGINX_DIR/default.local.conf.template"
  log_info "USE_HTTPS=false → using local HTTP template"
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
  log_error "Template not found: $TEMPLATE_FILE"
  exit 1
fi

if [ -z "$NGINX_SERVER_NAME" ]; then
  log_error "NGINX_SERVER_NAME is not set"
  exit 1
fi

if [ -z "$BACKEND_HOST" ]; then
  log_error "BACKEND_HOST is not set"
  exit 1
fi

if [ -z "$BACKEND_PORT" ]; then
  log_error "BACKEND_PORT is not set"
  exit 1
fi

if [[ "$BACKEND_HOST" =~ [^a-zA-Z0-9_.-] ]]; then
  log_error "BACKEND_HOST contains unsupported characters: $BACKEND_HOST"
  exit 1
fi

if [[ "$NGINX_SERVER_NAME" =~ [^a-zA-Z0-9_.-] ]]; then
  log_error "NGINX_SERVER_NAME contains unsupported characters: $NGINX_SERVER_NAME"
  exit 1
fi

log_info "🧩 Using template: $TEMPLATE_FILE"
log_info "✍️ Rendering nginx config..."

envsubst '${NGINX_SERVER_NAME} ${BACKEND_HOST} ${BACKEND_PORT}' \
  < "$TEMPLATE_FILE" > "$NGINX_DIR/default.conf"

log_success "Rendered to: $NGINX_DIR/default.conf"