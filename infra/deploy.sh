#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────
# Deploy infrastructure to VPS
# ─────────────────────────────────────────────────────────
#
# Usage:
#   ./deploy.sh
#
# Prerequisites:
#   - SSH key at ~/.ssh/id_deploy (matching crisis_monitor convention)
#   - deploy user on VPS
# ─────────────────────────────────────────────────────────

VPS_HOST="187.124.241.43"
VPS_USER="deploy"
SSH_KEY="${HOME}/.ssh/id_deploy"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying infrastructure to ${VPS_USER}@${VPS_HOST}..."

# Create remote infra directory
ssh -i "$SSH_KEY" "${VPS_USER}@${VPS_HOST}" "mkdir -p ~/infra"

# Sync infrastructure files
rsync -avz --delete \
  -e "ssh -i ${SSH_KEY}" \
  "$SCRIPT_DIR/" \
  "${VPS_USER}@${VPS_HOST}:~/infra/"

# Deploy on VPS
ssh -i "$SSH_KEY" "${VPS_USER}@${VPS_HOST}" << 'SSH_SCRIPT'
cd ~/infra

# Create network
docker network create app-net 2>/dev/null || true

# Pull and start Caddy
docker compose pull
docker compose up -d

echo "✅ Infrastructure deployed successfully"
SSH_SCRIPT

echo "✨ Done! Caddy is live on :80/:443"
