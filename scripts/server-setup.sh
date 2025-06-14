# 🚀 EC2 Deployment Script with Git Clone & Init

This script automates full environment setup, Git clone, and project bootstrap on an EC2 instance.

---

## 🔧 What This Script Does:
- Installs Docker and Docker Compose
- Installs Git if not already present
- Clones a GitHub repo via SSH
- Verifies `.env` file exists
- Runs `scripts/init.sh` to deploy the app

---

## 📜 Full Script: `setup-deploy.sh`

```bash
#!/bin/bash
set -e

# ─────────────────────────────
# 🌍 Global Variables (customize these)
# ─────────────────────────────
PROJECT_DIR="grippo-backend"                               # Local directory to clone the project into
GIT_REPO="git@github.com:your_user/grippo-backend.git"   # Git SSH URL
GIT_EMAIL="your_email@example.com"                        # Used for generating SSH key

# ─────────────────────────────
# 🧱 Install System Packages
# ─────────────────────────────
echo "🔧 Installing base packages..."
if command -v apt &>/dev/null; then
  sudo apt update -y
  sudo apt install -y git curl docker.io docker-compose
elif command -v yum &>/dev/null; then
  sudo yum update -y
  sudo yum install -y git curl docker docker-compose
else
  echo "❌ Unsupported OS package manager"
  exit 1
fi

# ─────────────────────────────
# 🐳 Docker Group Permissions
# ─────────────────────────────
if ! groups | grep -q docker; then
  echo "➕ Adding user to docker group"
  sudo usermod -aG docker "$USER"
  newgrp docker <<< "echo '✅ Docker group set'"
fi

# ─────────────────────────────
# 🔑 SSH Key for GitHub
# ─────────────────────────────
if [ ! -f "$HOME/.ssh/id_ed25519" ]; then
  echo "🔐 SSH key not found. Generating..."
  ssh-keygen -t ed25519 -C "$GIT_EMAIL" -f "$HOME/.ssh/id_ed25519" -N ""
  echo "📋 Add the following SSH key to your GitHub account:"
  cat "$HOME/.ssh/id_ed25519.pub"
  exit 0
fi

# ─────────────────────────────
# 📁 Clone Repository
# ─────────────────────────────
if [ ! -d "$PROJECT_DIR" ]; then
  echo "📦 Cloning repository..."
  git clone "$GIT_REPO" "$PROJECT_DIR"
else
  echo "📁 Project directory already exists: $PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# ─────────────────────────────
# 📄 Check .env Presence
# ─────────────────────────────
if [ ! -f ".env" ]; then
  echo "❌ .env file is missing in $(pwd)"
  exit 1
fi

# ─────────────────────────────
# 🚀 Run Initialization Script
# ─────────────────────────────
chmod +x scripts/init.sh
./scripts/init.sh || {
  echo "❌ Init script failed"
  exit 1
}

echo "🎉 Deployment complete! Access your app via IP or domain."
```

---

## 🧪 How to Use

1. Launch EC2 (Ubuntu or Amazon Linux 2)
2. Upload `setup-deploy.sh` to EC2:
   ```bash
   scp setup-deploy.sh ec2-user@<your-ip>:/home/ec2-user/
   ```
3. Connect and run:
   ```bash
   ssh ec2-user@<your-ip>
   chmod +x setup-deploy.sh
   ./setup-deploy.sh
   ```

If SSH key is missing, script will generate one and show it to be added to GitHub.

---

Let me know if you'd like to extend this to support HTTPS with domain, nginx, or systemd auto-start.
