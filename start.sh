#!/bin/bash
set -e
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  npm install
fi
if [ ! -d web/node_modules ]; then
  npm install --prefix web
fi

node server/index.js &
API_PID=$!

cleanup() {
  kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT

cd web
npx vite --host 0.0.0.0 --port 5173
