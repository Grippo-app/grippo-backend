#!/bin/bash

log_step_start() {
  echo ""
  echo "┌───── $1 ─────"
}

log_step_end() {
  echo "└────────────────────────────────────────────"
}

log_info() {
  echo "│ $1"
}

log_success() {
  echo "│ ✅ $1"
}

log_warn() {
  echo "│ ⚠️  $1"
}

log_error() {
  echo "│ ❌ $1"
}
