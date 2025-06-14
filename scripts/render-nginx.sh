#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
NGINX_DIR="$ROOT_DIR/nginx"
LOG_TAG="[NGINX]"

echo "$LOG_TAG 🧩 Loading environment..."

# ─────────────────────────────────────────────
# 📦 Load .env
# ─────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "$LOG_TAG ❌ Missing .env file at $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# ─────────────────────────────────────────────
# 🧩 Determine template by USE_HTTPS flag
# ─────────────────────────────────────────────
if [ "$USE_HTTPS" = "true" ]; then
  TEMPLATE_FILE="$NGINX_DIR/default.remote.conf.template"
else
  TEMPLATE_FILE="$NGINX_DIR/default.local.conf.template"
fi

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "$LOG_TAG ❌ Template not found: $TEMPLATE_FILE"
  exit 1
fi

echo "$LOG_TAG 🧩 Using template: $TEMPLATE_FILE"

# ─────────────────────────────────────────────
# 🔁 Render template → nginx/default.conf
# ─────────────────────────────────────────────
echo "$LOG_TAG ✍️ Rendering nginx config..."
envsubst '${NGINX_SERVER_NAME} ${BACKEND_HOST} ${BACKEND_PORT}' < "$TEMPLATE_FILE" > "$NGINX_DIR/default.conf"

echo "$LOG_TAG ✅ Rendered to: $NGINX_DIR/default.conf"
