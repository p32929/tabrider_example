#!/bin/bash

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting dev mode..."
echo ""

# Install dependencies
echo "[extension] Installing dependencies..."
cd "$DIR" && npm install

echo ""
echo "[server] Installing dependencies..."
cd "$DIR/server" && npm install

echo ""

# Kill background processes on exit
trap 'kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM EXIT

# Start server with hot reload
echo "[server] Starting on http://localhost:3000..."
cd "$DIR/server" && npm run dev &

# Start extension build in watch mode
echo "[extension] Building in watch mode..."
cd "$DIR" && npm run dev &

echo ""
echo "Both server and extension are running."
echo "Load the extension in Chrome: chrome://extensions → Load unpacked → select the dist/ folder"
echo "Press Ctrl+C to stop both."
echo ""

wait
