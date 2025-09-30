#!/bin/bash
# IBCM AI - Development Environment Startup Script

echo "🚀 Starting IBCM AI in Development Mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Please configure .env file with your settings"
fi

# Install dependencies if needed
echo "📦 Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 install_dependencies.py

# Create necessary directories
mkdir -p models
mkdir -p fine_tuned_models
mkdir -p logs

# Set environment variables
export ENVIRONMENT=development
export DEBUG=true
export LOG_LEVEL=INFO

# Start the AI service
echo "🤖 Starting IBCM AI Service..."
python3 main.py

echo "✅ IBCM AI Development Environment Ready!"
echo "📡 API available at: http://localhost:8001"
echo "📚 Documentation: http://localhost:8001/docs"
