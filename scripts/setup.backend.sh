#!/bin/bash
set -eE
trap 'echo "❌ Script failed (exit code: $?) at line $LINENO"; exit 1' ERR

# ─────────────────────────────────────────────
# 🌍 GLOBAL CONFIG — CHANGE THESE
# ─────────────────────────────────────────────

GIT_REPO_SSH="git@github.com:your-org/grippo-backend.git"  # SSH URL
PROJECT_DIR="grippo-backend"                                # Target folder
ENV_FILE=".env"                                              # Will check for it after clone
GIT_EMAIL="your.email@example.com"                           # For SSH setup (if needed)
GIT_SSH_KEY_PATH="$HOME/.ssh/id_rsa"                         # Change if needed

# ─────────────────────────────────────────────
# 📦 Install system packages
# ─────────────────────────────────────────────

echo "🔧 Installing packages (Docker, Compose, Git)..."

sudo apt update -y
sudo apt install -y git curl unzip ca-certificates gnupg lsb-release

if ! command -v docker &>/dev/null; then
  echo "🐳 Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

if ! command -v docker compose &>/dev/null; then
  echo "🧩 Installing Docker Compose v2..."
  DOCKER_COMPOSE_VERSION="2.24.6"
  sudo curl -L "https://github.com/docker/compose/releases/download/v$DOCKER_COMPOSE_VERSION/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

if ! command -v git &>/dev/null; then
  echo "🔁 Installing Git..."
  sudo apt install -y git
fi

# ─────────────────────────────────────────────
# 🔑 Ensure SSH key exists (optional)
# ─────────────────────────────────────────────

if [ ! -f "$GIT_SSH_KEY_PATH" ]; then
  echo "🔐 Generating SSH key..."
  ssh-keygen -t rsa -b 4096 -C "$GIT_EMAIL" -f "$GIT_SSH_KEY_PATH" -N ""
  echo "📋 Add this public key to GitHub:"
  cat "${GIT_SSH_KEY_PATH}.pub"
  exit 1
fi

eval "$(ssh-agent -s)"
ssh-add "$GIT_SSH_KEY_PATH"

# ─────────────────────────────────────────────
# 📁 Clone project
# ─────────────────────────────────────────────

if [ -d "$PROJECT_DIR" ]; then
  echo "📂 Project already exists at $PROJECT_DIR"
else
  echo "📥 Cloning project..."
  git clone "$GIT_REPO_SSH" "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# ─────────────────────────────────────────────
# ⚙️ Verify .env
# ─────────────────────────────────────────────

if [ ! -f "$ENV_FILE" ]; then
  echo "❗ .env file is missing in project root."
  echo "ℹ️  Please create it before continuing."
  exit 1
fi

# ─────────────────────────────────────────────
# 🚀 Run deploy
# ─────────────────────────────────────────────

echo "🚀 Running deployment..."
chmod +x ./scripts/deploy.sh
./scripts/deploy.sh

echo ""
echo "✅ Backend deployment complete!"
echo "🌐 Visit: http://<your-ec2-ip>:<your-port> (use .env → NGINX_HTTP_PORT or BACKEND_PORT)"
