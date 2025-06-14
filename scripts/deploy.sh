#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"
LOG_TAG="[DEPLOY]"

echo "$LOG_TAG 🚀 Starting deployment"

# ─────────────────────────────────────────────
# 📦 Load .env
# ─────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
  echo "$LOG_TAG ❌ Missing .env at $ENV_FILE"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

echo "$LOG_TAG 📦 Loaded environment: $APP_NAME v$APP_VERSION ($APP_ENV)"

# ─────────────────────────────────────────────
# 🔍 Check INIT_SCRIPT (build absolute path)
# ─────────────────────────────────────────────
INIT_SCRIPT_PATH="$ROOT_DIR/$INIT_SCRIPT"

if [ ! -f "$INIT_SCRIPT_PATH" ]; then
  echo "$LOG_TAG ❌ INIT_SCRIPT not found at $INIT_SCRIPT_PATH"
  exit 1
fi

# ─────────────────────────────────────────────
# ▶️ Run Init
# ─────────────────────────────────────────────
echo "$LOG_TAG ▶️ Running $INIT_SCRIPT_PATH ..."
bash "$INIT_SCRIPT_PATH"

echo "$LOG_TAG ✅ Deployment complete"
