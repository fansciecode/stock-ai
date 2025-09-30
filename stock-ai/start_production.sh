#!/bin/bash
# Production Trading System Startup Script

echo "🚀 Starting Production Trading System..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Check if AI model exists
if [ ! -f "models/real_trading_model_*.joblib" ]; then
    echo "🤖 Training AI model (first time setup)..."
    python3 setup_production_trading.py --train-only
fi

# Start the production dashboard
echo "🌐 Starting production dashboard..."
python3 src/web_interface/production_dashboard.py

echo "✅ Production system started!"
