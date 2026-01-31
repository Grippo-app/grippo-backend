#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# 📍 Paths & Setup
# ─────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGGER_SCRIPT="$SCRIPT_DIR/internal/logger.sh"

if [ ! -f "$LOGGER_SCRIPT" ]; then
  echo "❌ Missing logger script at $LOGGER_SCRIPT"
  exit 1
fi
# shellcheck source=./internal/logger.sh
source "$LOGGER_SCRIPT"

# ─────────────────────────────────────────────
# 🔐 Root check
# ─────────────────────────────────────────────

log_step_start "🔐 Checking permissions"

if [[ "$EUID" -ne 0 ]]; then
  log_warn "Script is not running as root – attempting to re-run with sudo"
  log_step_end
  exec sudo -E bash "$0" "$@"
fi

log_success "Running as root – OK"
log_step_end

# ─────────────────────────────────────────────
# 🔎 Disk usage before cleanup
# ─────────────────────────────────────────────

log_step_start "🔎 Disk usage before cleanup"

log_info "df -h /"
df -h / || true

log_info "Top-level usage in /var"
du -xhd1 /var 2>/dev/null | sort -h || true

log_info "Top-level usage in /home"
du -xhd1 /home 2>/dev/null | sort -h || true

if [ -d /var/lib/docker ]; then
  log_info "Docker directory size (/var/lib/docker)"
  du -sh /var/lib/docker 2>/dev/null || true
fi

log_step_end

# ─────────────────────────────────────────────
# 🐳 Docker cleanup
# ─────────────────────────────────────────────

log_step_start "🐳 Docker cleanup"

if command -v docker >/dev/null 2>&1; then
  log_info "Docker found – starting cleanup"

  log_info "[Docker] Current usage (docker system df)"
  docker system df || true

  log_info "[Docker] Prune containers, images, networks, build cache"
  docker system prune -af > /dev/null 2>&1 || true
  log_success "docker system prune -af completed"

  log_info "[Docker] Prune unused volumes"
  docker volume prune -f > /dev/null 2>&1 || true
  log_success "docker volume prune -f completed"

  log_info "[Docker] Prune builder / buildx cache"
  docker builder prune --all --force > /dev/null 2>&1 || true
  log_success "docker builder prune --all --force completed"

  if [ -d /var/lib/docker ]; then
    log_info "[Docker] Size of /var/lib/docker after cleanup"
    du -sh /var/lib/docker 2>/dev/null || true
  fi

  log_info "[Docker] Usage after cleanup (docker system df)"
  docker system df || true
else
  log_warn "Docker is not installed or not in PATH – skipping Docker cleanup"
fi

log_step_end

# ─────────────────────────────────────────────
# 📦 apt cache and unused packages
# ─────────────────────────────────────────────

log_step_start "📦 Cleaning apt cache and unused packages"

export DEBIAN_FRONTEND=noninteractive

log_info "[APT] Running apt-get clean"
apt-get clean || log_warn "apt-get clean failed, continuing"

log_info "[APT] Running apt-get autoremove --purge -y"
apt-get autoremove --purge -y || log_warn "apt-get autoremove failed, continuing"

log_success "APT cache cleanup completed"
log_step_end

# ─────────────────────────────────────────────
# 📰 systemd journal logs
# ─────────────────────────────────────────────

log_step_start "📰 Cleaning systemd journal logs"

if command -v journalctl >/dev/null 2>&1; then
  log_info "[Journal] Current disk usage"
  journalctl --disk-usage || true

  log_info "[Journal] Vacuum logs to 200M"
  journalctl --vacuum-size=200M || log_warn "journalctl vacuum failed, continuing"

  log_info "[Journal] Disk usage after vacuum"
  journalctl --disk-usage || true

  log_success "Journal logs cleanup completed"
else
  log_warn "journalctl not found – skipping journal cleanup"
fi

log_step_end

# ─────────────────────────────────────────────
# 🧹 Temporary directories
# ─────────────────────────────────────────────

log_step_start "🧹 Cleaning temporary directories"

log_info "Removing /tmp/*"
rm -rf /tmp/* 2>/dev/null || log_warn "Failed to clean /tmp, continuing"

log_info "Removing /var/tmp/*"
rm -rf /var/tmp/* 2>/dev/null || log_warn "Failed to clean /var/tmp, continuing"

log_success "Temporary directories cleaned"
log_step_end

# ─────────────────────────────────────────────
# 📊 Disk usage after cleanup
# ─────────────────────────────────────────────

log_step_start "📊 Disk usage after cleanup"

log_info "df -h /"
df -h / || true

log_info "Top-level usage in /var"
du -xhd1 /var 2>/dev/null | sort -h || true

log_info "Top-level usage in /home"
du -xhd1 /home 2>/dev/null | sort -h || true

if [ -d /var/lib/docker ]; then
  log_info "Docker directory size (/var/lib/docker) after cleanup"
  du -sh /var/lib/docker 2>/dev/null || true
fi

log_step_end

# ─────────────────────────────────────────────
# ✅ Done
# ─────────────────────────────────────────────

echo ""
echo "✅ Cleanup complete!"

# ─────────────────────────────────────────────
# 🔁 Reboot
# ─────────────────────────────────────────────

log_step_start "🔁 Rebooting"
log_warn "System will reboot now"
log_step_end
sudo reboot
