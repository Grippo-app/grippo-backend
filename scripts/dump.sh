#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

# =========================
# Logger (fallback)
# =========================
if [[ -f "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/logger.sh" ]]; then
  # If you have your own logger with log_* functions
  source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/logger.sh"
else
  log_info()    { printf '%s\n' "$*"; }
  log_warn()    { printf '%s\n' "$*"; }
  log_error()   { printf '%s\n' "$*" >&2; }
  log_success() { printf '%s\n' "$*"; }
  log_step_start() {
    printf '┌───── %s ─────\n' "$1"
    printf '└────────────────────────────────────────────\n'
  }
  log_step_end() { :; }
fi

# =========================
# Helpers & error handling
# =========================
on_error() {
  local line="$1" code="$2"
  log_error "❌ Failed at line ${line} (exit ${code})"
  if command -v docker >/dev/null 2>&1 && [[ -n "${POSTGRES_CONTAINER_NAME:-}" ]]; then
    docker ps --filter "name=${POSTGRES_CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}" || true
  fi
  exit "${code}"
}
trap 'on_error ${LINENO} $?' ERR

require_bin() {
  local b="$1"
  command -v "$b" >/dev/null 2>&1 || { log_error "Required binary not found: $b"; exit 1; }
}

file_size_h() {
  if command -v du >/dev/null 2>&1; then
    (du -h "$1" 2>/dev/null || du -h -d0 "$1" 2>/dev/null) | awk 'NR==1{print $1}'
  else
    stat -c%s "$1" 2>/dev/null || echo "n/a"
  fi
}

# =========================
# Paths
# =========================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
SQL_TARGET="${ROOT_DIR}/${DB_DUMP_FILE:-scripts/dump.sql}"
BACKUP_DIR="${ROOT_DIR}/backups"

# =========================
# Load .env
# =========================
log_step_start "🔸 Loading .env"
[[ -f "$ENV_FILE" ]] || { log_error ".env not found at $ENV_FILE"; exit 1; }
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${POSTGRES_CONTAINER_NAME:?Missing POSTGRES_CONTAINER_NAME}"
: "${POSTGRES_DATABASE:?Missing POSTGRES_DATABASE}"
: "${POSTGRES_USERNAME:?Missing POSTGRES_USERNAME}"
: "${POSTGRES_PASSWORD:?Missing POSTGRES_PASSWORD}"

require_bin docker
mkdir -p "$(dirname "$SQL_TARGET")" "$BACKUP_DIR"

STAMP="$(date -u +%Y%m%d_%H%M%SZ)"
SQL_SNAPSHOT="${BACKUP_DIR}/${POSTGRES_DATABASE}_${STAMP}.sql"
log_step_end

# =========================
# Pre-checks inside container
# =========================
log_step_start "🔎 Pre-checks (container tools)"
docker exec "$POSTGRES_CONTAINER_NAME" sh -lc 'command -v pg_dump >/dev/null' \
  || { log_error "pg_dump not found inside container ${POSTGRES_CONTAINER_NAME}"; exit 1; }
log_success "Tools found: pg_dump"
log_step_end

# =========================
# Plain SQL dump (INSERT)
# =========================
log_step_start "🐘 pg_dump → plain SQL with INSERT"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$POSTGRES_CONTAINER_NAME" \
  pg_dump \
    -U "$POSTGRES_USERNAME" \
    -d "$POSTGRES_DATABASE" \
    -F p \
    --inserts \
    --no-owner \
    --no-privileges \
    -b \
  > "$SQL_SNAPSHOT"

if [[ ! -s "$SQL_SNAPSHOT" ]]; then
  log_error "SQL dump is empty: $SQL_SNAPSHOT"
  exit 1
fi

# Atomically update the target used by your importer
cp -f "$SQL_SNAPSHOT" "$SQL_TARGET"
log_info "SQL snapshot: $SQL_SNAPSHOT ($(file_size_h "$SQL_SNAPSHOT"))"
log_success "SQL dump (latest): $SQL_TARGET ($(file_size_h "$SQL_TARGET"))"
log_step_end

# =========================
# Summary
# =========================
log_success "✅ Done. Snapshot stored in: $BACKUP_DIR"
