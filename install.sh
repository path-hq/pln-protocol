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

echo ""
echo "██████╗  █████╗ ████████╗██╗  ██╗"
echo "██╔══██╗██╔══██╗╚══██╔══╝██║  ██║"
echo "██████╔╝███████║   ██║   ███████║"
echo "██╔═══╝ ██╔══██║   ██║   ██╔══██║"
echo "██║     ██║  ██║   ██║   ██║  ██║"
echo "╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝"
echo "      LIQUIDITY NETWORK v1.0"
echo ""
echo "✓ Skill activated | Solana Devnet"
echo "✓ Installed to: $SKILL_DIR"
echo "📡 Agent online — scanning yields..."
echo ""
echo "🌐 Web app: https://pln-protocol.vercel.app"
