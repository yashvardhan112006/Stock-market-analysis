#!/usr/bin/env bash
# Quickstart script for local development
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"

echo "Starting Portfolio Risk & Returns Analytics Dashboard..."

# 1. Ensure Python dependencies
if ! python3 -c "import fastapi, yfinance, pandas, numpy" &>/dev/null; then
  echo "Installing backend requirements..."
  python3 -m pip install -q -r "$ROOT_DIR/backend/requirements.txt"
fi

# 2. Ensure Node dependencies
if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
  echo "Installing frontend packages..."
  (cd "$ROOT_DIR/frontend" && npm install --silent)
fi

# 3. Clean up existing port bindings if needed
lsof -ti:"$BACKEND_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:"$FRONTEND_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true

# 4. Launch servers
cd "$ROOT_DIR"
python3 -m uvicorn backend.app.server:app --port "$BACKEND_PORT" --log-level info &
BACKEND_PID=$!

cd "$ROOT_DIR/frontend"
npm run dev -- --port "$FRONTEND_PORT" --open &
FRONTEND_PID=$!

echo ""
echo "Services initialized:"
echo "  Frontend : http://localhost:$FRONTEND_PORT"
echo "  API Docs : http://localhost:$BACKEND_PORT/docs"
echo "  Health   : http://localhost:$BACKEND_PORT/api/health"
echo ""
echo "Press Ctrl+C to terminate both servers."

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true; exit 0' INT TERM
wait
