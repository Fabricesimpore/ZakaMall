#!/bin/bash

# ZakaMall Production Startup Script
# This script ensures proper environment setup for production deployment

echo "🚀 Starting ZakaMall in production mode..."

# Check if environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
  echo "❌ ERROR: SESSION_SECRET environment variable is not set"
  exit 1
fi

# Create logs directory if it doesn't exist
mkdir -p logs
echo "📁 Created logs directory"

# Check if built files exist
if [ ! -f "dist/index.js" ]; then
  echo "❌ ERROR: Built files not found. Please run 'npm run build' first"
  exit 1
fi

if [ ! -d "dist/public" ]; then
  echo "❌ ERROR: Client build not found. Please run 'npm run build' first"
  exit 1
fi

# Set production environment
export NODE_ENV=production

echo "✅ Environment checks passed"
echo "🌟 Starting ZakaMall server..."

# Start the application
node dist/index.js