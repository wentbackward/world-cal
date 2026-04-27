#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Deploy infrastructure to VPS
# ─────────────────────────────────────────────────────────
#
# Usage:
#   ./deploy.sh [environment]
#
# Environments:
#   staging  - Deploy to staging (default)
#   production - Deploy to production
#
# Prerequisites:
#   - SSH key configured for VPS access
#   - VPS_HOST, VPS_USER, VPS_SSH_KEY env vars or SSH config
# ─────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR/infra"

# Configuration - override via environment variables
VPS_HOST="${VPS_HOST:?Set VPS_HOST environment variable}"
VPS_USER="${VPS_USER:-root}"
VPS_SSH_KEY="${VPS_SSH_KEY:-~/.ssh/vps_deploy}"
ENVIRONMENT="${1:-staging}"

echo "🚀 Deploying infrastructure to ${ENVIRONMENT}..."
echo "   Target: ${VPS_USER}@${VPS_HOST}"

# Create remote infra directory
ssh -i "$VPS_SSH_KEY" "${VPS_USER}@${VPS_HOST}" "mkdir -p ~/infra"

# Sync infrastructure files
rsync -avz --delete \
  -e "ssh -i ${VPS_SSH_KEY}" \
  "$INFRA_DIR/" \
  "${VPS_USER}@${VPS_HOST}:~/infra/"

# Deploy to VPS
ssh -i "$VPS_SSH_KEY" "${VPS_USER}@${VPS_HOST}" << 'SSH_SCRIPT'
cd ~/infra

# Pull latest images
docker compose pull

# Restart services
docker compose up -d

# Clean up old images
docker image prune -f

echo "✅ Infrastructure deployed successfully"
SSH_SCRIPT

echo "✨ Done! Infrastructure is live at https://world-cal.paulgresham.com"
