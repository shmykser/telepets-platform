#!/bin/bash

# Telepets Platform Build Script
set -e

echo "🚀 Building Telepets Platform..."

# Build frontends
echo "📦 Building WebApp (React)..."
cd ../frontends/webapp
npm install
npm run build

echo "🎮 Building MiniGames (Phaser)..."
cd ../games
npm install
npm run build

# Build backend
echo "🔧 Building Backend (FastAPI)..."
cd ../../backend
pip install -r requirements.txt

echo "✅ Build completed successfully!"
echo "📁 Built files:"
echo "  - WebApp: frontends/webapp/dist/"
echo "  - Games: frontends/games/dist/"
echo "  - Backend: backend/"

echo "🐳 To start with Docker:"
echo "  cd infra && docker-compose up -d"
