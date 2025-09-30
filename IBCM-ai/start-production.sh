#!/bin/bash
# IBCM AI - Production Environment Startup Script

echo "🏭 Starting IBCM AI in Production Mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create and configure .env file."
    exit 1
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
python3 -m pip install --upgrade pip
python3 install_dependencies.py

# Create necessary directories
mkdir -p models
mkdir -p fine_tuned_models
mkdir -p logs

# Set production environment variables
export ENVIRONMENT=production
export DEBUG=false
export LOG_LEVEL=WARNING

# Start the AI service with production settings
echo "🏭 Starting IBCM AI Production Service..."
nohup python3 main.py > logs/production.log 2>&1 &

echo "✅ IBCM AI Production Environment Started!"
echo "📡 API running on configured host and port"
echo "📋 Logs available in: logs/production.log"
echo "🔍 Monitor with: tail -f logs/production.log"
