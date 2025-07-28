#!/bin/bash
# Diagnostic script for MoP Inscription Deck Tracker
# This script helps identify common setup and path issues

echo "=== MoP Inscription Deck Tracker Diagnostics ==="
echo

# Check current directory
echo "📁 Current working directory:"
echo "  $(pwd)"
echo

# Check if we're in the right place
echo "📋 Project files check:"
if [ -f "package.json" ]; then
    echo "  ✅ package.json found"
    echo "  📦 Project name: $(grep -o '"name": "[^"]*"' package.json | cut -d'"' -f4)"
    echo "  🏷️  Version: $(grep -o '"version": "[^"]*"' package.json | cut -d'"' -f4)"
else
    echo "  ❌ package.json not found"
fi

if [ -f "server.js" ]; then
    echo "  ✅ server.js found"
else
    echo "  ❌ server-auth.js not found"
fi

if [ -d "client" ]; then
    echo "  ✅ client directory found"
    if [ -f "client/package.json" ]; then
        echo "  ✅ client/package.json found"
    else
        echo "  ❌ client/package.json not found"
    fi
else
    echo "  ❌ client directory not found"
fi

if [ -d "logs" ]; then
    echo "  ✅ logs directory found"
else
    echo "  ⚠️  logs directory missing (will be created)"
fi

echo

# Check Node.js setup
echo "🟢 Node.js environment:"
if command -v node >/dev/null 2>&1; then
    echo "  ✅ Node.js: $(node --version)"
else
    echo "  ❌ Node.js not found"
fi

if command -v npm >/dev/null 2>&1; then
    echo "  ✅ npm: $(npm --version)"
else
    echo "  ❌ npm not found"
fi

echo

# Check PM2 setup
echo "⚙️  PM2 environment:"
if command -v pm2 >/dev/null 2>&1; then
    echo "  ✅ PM2: $(pm2 --version)"
    echo "  📊 PM2 processes:"
    pm2 list | grep -E "(mop-card-tracker|mop-inscription-tracker)" || echo "    No MoP processes found"
else
    echo "  ❌ PM2 not found"
fi

echo

# Check git setup
echo "🌿 Git repository:"
if [ -d ".git" ]; then
    echo "  ✅ Git repository found"
    echo "  🌲 Current branch: $(git branch --show-current 2>/dev/null || echo 'unknown')"
    echo "  🏷️  Latest tag: $(git describe --tags --abbrev=0 2>/dev/null || echo 'no tags')"
    echo "  📍 Remote origin: $(git config --get remote.origin.url 2>/dev/null || echo 'not set')"
else
    echo "  ❌ Not a git repository"
fi

echo

# Check system files
echo "🗂️  System files:"
if [ -f ".env" ]; then
    echo "  ✅ .env file found"
else
    echo "  ⚠️  .env file missing"
fi

if [ -f ".env.example" ]; then
    echo "  ✅ .env.example found"
else
    echo "  ❌ .env.example missing"
fi

if [ -f "ecosystem.config.js" ]; then
    echo "  ✅ ecosystem.config.js found"
else
    echo "  ❌ ecosystem.config.js missing"
fi

echo

# Check permissions
echo "🔐 Permissions:"
if [ -x "update.sh" ]; then
    echo "  ✅ update.sh is executable"
else
    echo "  ⚠️  update.sh is not executable"
fi

if [ -x "install.sh" ]; then
    echo "  ✅ install.sh is executable"
else
    echo "  ⚠️  install.sh is not executable"
fi

echo

echo "=== Diagnostics Complete ==="
echo "If you see any ❌ or ⚠️  items above, they may need to be addressed."
echo "Run './install.sh' for a fresh installation or './update.sh' to update."
