#!/usr/bin/env bash
set -euo pipefail

# Dump only: never starts/stops containers or imports SQL.
SCRIPT_DIR="$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/internal/operations.py" dump "$@"
