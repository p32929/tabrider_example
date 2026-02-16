#!/bin/bash

echo "Starting production mode..."
echo ""

# Build extension once
echo "[extension] Building..."
npm run build
echo "[extension] Build complete. Load from dist/ in chrome://extensions"
echo ""

# Start server
echo "[server] Starting on http://localhost:3000..."
cd server && npm run start
