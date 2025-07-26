#!/bin/bash
# power-restart.sh: Rebuild frontend and restart backend for Mist of Pandaria Card Tracker

set -e

# Ensure script runs from the app home directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Stop any running backend processes on port 5000
PORT=5000
PID=$(lsof -ti tcp:$PORT)
if [ -n "$PID" ]; then
  echo "Killing backend process on port $PORT (PID: $PID)"
  kill -9 $PID
else
  echo "No backend process running on port $PORT."
fi

# Rebuild frontend
cd client
npm run build
cd ..

# Start backend
nohup node server-auth.js > server.log 2>&1 &
BACKEND_PID=$!
echo "Backend restarted (PID: $BACKEND_PID)"

echo "Frontend rebuilt and backend restarted. Access the app at http://localhost:5000"
