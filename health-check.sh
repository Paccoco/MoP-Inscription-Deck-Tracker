#!/bin/bash
# Health Check Script for MoP Card Tracker
# This script helps diagnose application startup issues

echo "=== MoP Card Tracker Health Check ==="
echo "Timestamp: $(date)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the application directory"
    echo "Please run this script from the MoP-Inscription-Deck-Tracker directory"
    exit 1
fi

echo "📁 Application Directory: $(pwd)"

# Check PM2 status
echo ""
echo "🔍 PM2 Status:"
if command -v pm2 >/dev/null 2>&1; then
    pm2 list
    echo ""
    echo "📊 PM2 Process Details:"
    pm2 show mop-card-tracker 2>/dev/null || echo "Process 'mop-card-tracker' not found"
else
    echo "❌ PM2 not installed"
fi

# Check if process is listening on port
echo ""
echo "🌐 Port Check:"
if netstat -tlnp 2>/dev/null | grep -q ":5000 "; then
    echo "✅ Port 5000 is in use"
    netstat -tlnp 2>/dev/null | grep ":5000 "
else
    echo "❌ Port 5000 is not in use"
fi

# Check application response
echo ""
echo "🏥 Application Health:"
if curl -f --max-time 10 http://localhost:5000/api/version 2>/dev/null; then
    echo ""
    echo "✅ Application is responding"
else
    echo "❌ Application is not responding"
    
    # Try to get more info
    echo ""
    echo "🔍 Additional Diagnostics:"
    
    # Check if the process exists but isn't responding
    if pgrep -f "node.*server.js" >/dev/null; then
        echo "✅ Node process is running"
    else
        echo "❌ Node process not found"
    fi
    
    # Check recent logs
    echo ""
    echo "📋 Recent PM2 Logs (last 20 lines):"
    pm2 logs mop-card-tracker --lines 20 --nostream 2>/dev/null || echo "No PM2 logs available"
fi

# Check database
echo ""
echo "🗄️  Database Check:"
if [ -f "cards.db" ]; then
    echo "✅ Database file exists"
    db_size=$(stat -c%s "cards.db" 2>/dev/null || echo "unknown")
    echo "   Size: $db_size bytes"
    
    # Check if database is accessible
    if command -v sqlite3 >/dev/null 2>&1; then
        table_count=$(sqlite3 cards.db "SELECT COUNT(*) FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "0")
        echo "   Tables: $table_count"
    fi
else
    echo "❌ Database file not found"
fi

# Check environment file
echo ""
echo "⚙️  Environment Check:"
if [ -f ".env" ]; then
    echo "✅ .env file exists"
    echo "   Environment variables found:"
    grep -E "^[A-Z_]+" .env | cut -d'=' -f1 | sed 's/^/   - /' || echo "   No variables found"
else
    echo "❌ .env file not found"
fi

# Check node modules
echo ""
echo "📦 Dependencies Check:"
if [ -d "node_modules" ]; then
    echo "✅ Server node_modules exists"
else
    echo "❌ Server node_modules missing"
fi

if [ -d "client/node_modules" ]; then
    echo "✅ Client node_modules exists"
else
    echo "❌ Client node_modules missing"
fi

if [ -d "client/build" ]; then
    echo "✅ Client build exists"
    build_files=$(find client/build -name "*.js" -o -name "*.css" | wc -l)
    echo "   Build files: $build_files"
else
    echo "❌ Client build missing"
fi

# Check ecosystem config
echo ""
echo "🏗️  PM2 Config Check:"
if [ -f "ecosystem.config.js" ]; then
    echo "✅ ecosystem.config.js exists"
else
    echo "❌ ecosystem.config.js missing"
fi

# System resource check
echo ""
echo "💾 System Resources:"
echo "   Memory usage: $(free -h | grep '^Mem:' | awk '{print $3 "/" $2}')"
echo "   Disk usage: $(df -h . | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo "   Load average: $(uptime | awk -F'load average:' '{print $2}')"

echo ""
echo "=== Health Check Complete ==="
echo ""
echo "💡 Common Issues & Solutions:"
echo "   • If PM2 process is stopped: pm2 start ecosystem.config.js"
echo "   • If dependencies missing: npm install && cd client && npm install"
echo "   • If build missing: cd client && npm run build"
echo "   • If database missing: ./init-database.sh"
echo "   • To view live logs: pm2 logs mop-card-tracker"
echo "   • To restart application: pm2 restart mop-card-tracker"
