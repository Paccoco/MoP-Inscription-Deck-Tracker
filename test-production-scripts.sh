#!/bin/bash
# Test script to verify production deployment scripts work correctly
# This script validates that all necessary components are in place

echo "=== Testing Production Deployment Scripts ==="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
error_count=0

# Function to check and report
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 exists"
        ((success_count++))
    else
        echo -e "${RED}❌${NC} $1 missing"
        ((error_count++))
    fi
}

check_executable() {
    if [ -x "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 is executable"
        ((success_count++))
    else
        echo -e "${YELLOW}⚠️${NC} $1 exists but not executable (fixing...)"
        chmod +x "$1"
        if [ -x "$1" ]; then
            echo -e "${GREEN}✅${NC} $1 is now executable"
            ((success_count++))
        else
            echo -e "${RED}❌${NC} Failed to make $1 executable"
            ((error_count++))
        fi
    fi
}

echo "📋 Checking critical production scripts:"
echo

# Check for existence of critical scripts
check_file "init-database.sh"
check_file "install.sh"
check_file "update.sh"
check_file "deploy-production.sh"
check_file "scripts/init-production-database.js"
check_file "check-database-safety.sh"

echo
echo "🔧 Checking script permissions:"
echo

# Check if scripts are executable
check_executable "init-database.sh"
check_executable "install.sh"
check_executable "update.sh"
check_executable "deploy-production.sh"
check_executable "check-database-safety.sh"

echo
echo "📊 Testing database initialization script:"
echo

# Test the database initialization script syntax
if bash -n init-database.sh; then
    echo -e "${GREEN}✅${NC} init-database.sh syntax is valid"
    ((success_count++))
else
    echo -e "${RED}❌${NC} init-database.sh has syntax errors"
    ((error_count++))
fi

# Test the Node.js production script syntax
if node -c scripts/init-production-database.js; then
    echo -e "${GREEN}✅${NC} scripts/init-production-database.js syntax is valid"
    ((success_count++))
else
    echo -e "${RED}❌${NC} scripts/init-production-database.js has syntax errors"
    ((error_count++))
fi

echo
echo "🗂️ Checking package.json and dependencies:"
echo

# Check package.json exists and is valid
if [ -f "package.json" ]; then
    if node -e "require('./package.json')" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} package.json is valid"
        ((success_count++))
        
        # Check version
        version=$(node -e "console.log(require('./package.json').version)")
        echo -e "${GREEN}📦${NC} Current version: $version"
    else
        echo -e "${RED}❌${NC} package.json is invalid"
        ((error_count++))
    fi
else
    echo -e "${RED}❌${NC} package.json missing"
    ((error_count++))
fi

echo
echo "📁 Checking required directories and files:"
echo

# Check for client build directory
if [ -d "client/build" ]; then
    echo -e "${GREEN}✅${NC} client/build directory exists"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️${NC} client/build directory missing (run: cd client && npm run build)"
fi

# Check for main server file
if [ -f "server-auth.js" ]; then
    echo -e "${GREEN}✅${NC} server-auth.js exists"
    ((success_count++))
else
    echo -e "${RED}❌${NC} server-auth.js missing"
    ((error_count++))
fi

echo
echo "🔐 Checking environment configuration:"
echo

# Check for environment files
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✅${NC} .env.example exists"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️${NC} .env.example missing"
fi

if [ -f ".env" ]; then
    echo -e "${GREEN}✅${NC} .env exists"
    ((success_count++))
else
    echo -e "${YELLOW}⚠️${NC} .env missing (will be created from .env.example during install)"
fi

echo
echo "========================================"
echo -e "${GREEN}✅ Successful checks: $success_count${NC}"
if [ $error_count -gt 0 ]; then
    echo -e "${RED}❌ Failed checks: $error_count${NC}"
else
    echo -e "${GREEN}❌ Failed checks: $error_count${NC}"
fi

echo
if [ $error_count -eq 0 ]; then
    echo -e "${GREEN}🎉 All production scripts are ready!${NC}"
    echo "You can safely deploy to production servers."
    exit 0
else
    echo -e "${RED}⚠️ Please fix the issues above before deploying to production.${NC}"
    exit 1
fi
