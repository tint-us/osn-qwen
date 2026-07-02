#!/usr/bin/env bash
# ============================================================
# SoaLatihan — Native VPS Deployment Script
# Automates: .env validation, npm install, Prisma migration,
#            Next.js build, and PM2 process registration.
# ============================================================
# Usage:
#   chmod +x scripts/deploy-native.sh
#   ./scripts/deploy-native.sh
# ============================================================
set -euo pipefail

# --- Configuration ---
APP_NAME="soalatihan-app"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

# --- Color output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# --- Step 0: Pre-flight checks ---
log_info "SoaLatihan Native Deployment Starting..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  log_error "Node.js is not installed. Please install Node.js 20+ first."
  exit 1
fi
NODE_VERSION=$(node --version)
log_ok "Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
  log_error "npm is not installed."
  exit 1
fi
log_ok "npm version: $(npm --version)"

echo ""

# --- Step 1: Validate .env ---
log_info "Step 1/6: Validating .env file..."

if [ ! -f "$ENV_FILE" ]; then
  log_error ".env file not found at: $ENV_FILE"
  echo ""
  log_info "To create one from the template:"
  echo "  cp .env.example .env"
  echo "  nano .env"
  exit 1
fi

# Source .env to read variables
set -a
source "$ENV_FILE"
set +a

# Required variables check
MISSING=0
REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    log_error "Missing required variable: $var"
    MISSING=1
  fi
done

if [ "$MISSING" -eq 1 ]; then
  echo ""
  log_error "Please fill in all required variables in .env"
  exit 1
fi

# Determine APP_PORT (default 3000)
APP_PORT="${APP_PORT:-3000}"
log_ok ".env validated — APP_PORT=$APP_PORT"
echo ""

# --- Step 2: Install dependencies ---
log_info "Step 2/6: Installing npm dependencies..."
cd "$PROJECT_DIR"
npm install
log_ok "Dependencies installed"
echo ""

# --- Step 3: Prisma migration ---
log_info "Step 3/6: Running Prisma migration..."
npx prisma generate
npx prisma migrate deploy 2>/dev/null || {
  log_warn "No migration history found — running prisma db push..."
  npx prisma db push
}
log_ok "Database synced"
echo ""

# --- Step 4: Build project ---
log_info "Step 4/6: Building Next.js project..."
npm run build
log_ok "Build complete"
echo ""

# --- Step 5: PM2 registration ---
log_info "Step 5/6: Configuring PM2..."

if ! command -v pm2 &> /dev/null; then
  log_warn "PM2 is not installed. Installing globally..."
  npm install -g pm2
fi

# Stop existing process if running
if pm2 describe "$APP_NAME" &> /dev/null; then
  log_info "Stopping existing PM2 process: $APP_NAME"
  pm2 stop "$APP_NAME" || true
  pm2 delete "$APP_NAME" || true
fi

# Start with PM2 — APP_PORT passed as env
pm2 start npm --name "$APP_NAME" -- start -- -p "$APP_PORT"
pm2 save

log_ok "PM2 process '$APP_NAME' registered on port $APP_PORT"
echo ""

# --- Step 6: Summary ---
log_info "Step 6/6: Deployment Summary"
echo ""
echo "  ┌──────────────────────────────────────────────┐"
echo "  │  SoaLatihan Native Deployment Complete!       │"
echo "  ├──────────────────────────────────────────────┤"
echo "  │  App Name    : $APP_NAME                     "
echo "  │  PM2 ID      : $(pm2 describe "$APP_NAME" | grep 'pid' | head -1 | awk '{print $NF}' || echo '—')"
echo "  │  Port        : $APP_PORT                      "
echo "  │  URL         : http://localhost:$APP_PORT     "
echo "  └──────────────────────────────────────────────┘"
echo ""
log_info "PM2 commands:"
echo "  pm2 status              — list all processes"
echo "  pm2 logs $APP_NAME      — view app logs"
echo "  pm2 restart $APP_NAME   — restart the app"
echo "  pm2 stop $APP_NAME       — stop the app"
echo "  pm2 delete $APP_NAME    — remove from PM2"
echo "  pm2 startup             — enable auto-start on boot"
echo "  pm2 save                — save process list"
echo ""
log_ok "Deployment finished successfully! 🚀"
