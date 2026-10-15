#!/usr/bin/env bash
set -euo pipefail

# Read-only plan by default; execution needs an approved plan and a fresh dump.
SCRIPT_DIR="$(cd -P -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/internal/operations.py" deploy "$@"
