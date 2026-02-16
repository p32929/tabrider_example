#!/bin/bash

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting production mode..."
echo ""

# Install dependencies
echo "[extension] Installing dependencies..."
cd "$DIR" && npm install

echo ""
echo "[server] Installing dependencies..."
cd "$DIR/server" && npm install

echo ""

# Build extension once
echo "[extension] Building..."
cd "$DIR" && npm run build
echo "[extension] Build complete. Load from dist/ in chrome://extensions"
echo ""

# Start server
echo "[server] Starting on http://localhost:3000..."
cd "$DIR/server" && npm run start
