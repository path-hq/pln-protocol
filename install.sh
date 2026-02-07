#!/bin/bash
# PLN Skill Installer for OpenClaw
# Usage: curl -sL https://raw.githubusercontent.com/path-hq/pln-protocol/main/install.sh | bash

set -e

SKILL_DIR="${HOME}/.openclaw/workspace/skills/pln"
REPO_URL="https://github.com/path-hq/pln-protocol.git"
TMP_DIR=$(mktemp -d)

echo "🔧 Installing PLN skill..."

# Clone repo to temp directory
git clone --depth 1 --quiet "$REPO_URL" "$TMP_DIR"

# Create skills directory if it doesn't exist
mkdir -p "${HOME}/.openclaw/workspace/skills"

# Remove existing skill if present
if [ -d "$SKILL_DIR" ]; then
    echo "📦 Updating existing PLN skill..."
    rm -rf "$SKILL_DIR"
fi

# Copy skill to workspace
cp -r "$TMP_DIR/skills/pln" "$SKILL_DIR"

# Cleanup
rm -rf "$TMP_DIR"

# Colors
GREEN='\033[0;32m'
BRIGHT_GREEN='\033[1;32m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo ""
sleep 0.15
echo -e "${BRIGHT_GREEN}██████╗  █████╗ ████████╗██╗  ██╗${NC}"
sleep 0.15
echo -e "${BRIGHT_GREEN}██╔══██╗██╔══██╗╚══██╔══╝██║  ██║${NC}"
sleep 0.15
echo -e "${GREEN}██████╔╝███████║   ██║   ███████║${NC}"
sleep 0.15
echo -e "${GREEN}██╔═══╝ ██╔══██║   ██║   ██╔══██║${NC}"
sleep 0.15
echo -e "${CYAN}██║     ██║  ██║   ██║   ██║  ██║${NC}"
sleep 0.15
echo -e "${CYAN}╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝${NC}"
sleep 0.2
echo -e "${WHITE}      LIQUIDITY NETWORK v1.0${NC}"
echo ""
sleep 0.3
echo -e "${GREEN}✓${NC} Skill activated | Solana Devnet"
sleep 0.2
echo -e "${GREEN}✓${NC} Installed to: $SKILL_DIR"
sleep 0.2
echo -e "${CYAN}📡${NC} Agent online — scanning yields..."
echo ""
echo -e "🌐 Web app: ${WHITE}https://pln-protocol.vercel.app${NC}"
