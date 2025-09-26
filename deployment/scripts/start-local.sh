#!/bin/bash

echo "🚀 Starting AI Trading System - Local Development"
echo "Performance Tier: STANDARD"
echo "System: 8 cores, 8.0GB RAM"

# Check dependencies
echo "🔍 Checking dependencies..."
python -c "import numpy, pandas, sklearn, joblib; print('✅ Core dependencies OK')" || {
    echo "❌ Missing dependencies. Installing..."
    pip install -r requirements.txt
}

# Create necessary directories
mkdir -p data logs models reports

# Start services based on system resources
if [ "STANDARD" = "HIGH_PERFORMANCE" ] || [ "STANDARD" = "MEDIUM_PERFORMANCE" ]; then
    echo "🚀 Starting high-performance configuration..."
    
    # Start AI service
    echo "🤖 Starting AI Service..."
    python -c "import sys; sys.path.append('src'); from ai.ai_service import start_ai_service; start_ai_service()" &
    AI_PID=$!
    
    # Start backend
    echo "🔧 Starting Backend API..."
    python backend_api.py &
    BACKEND_PID=$!
    
    # Start frontend
    echo "🌐 Starting Frontend Dashboard..."
    python src/web_interface/production_dashboard.py &
    FRONTEND_PID=$!
    
else
    echo "🚀 Starting standard configuration..."
    
    # Start backend
    echo "🔧 Starting Backend API..."
    python backend_api.py &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Start frontend
    echo "🌐 Starting Frontend Dashboard..."
    python src/web_interface/production_dashboard.py &
    FRONTEND_PID=$!
fi

echo "✅ All services started!"
echo "📱 Dashboard: http://localhost:8000"
if [ ! -z "${BACKEND_PID}" ]; then
    echo "🔧 Backend API: http://localhost:8001"
fi
if [ ! -z "${AI_PID}" ]; then
    echo "🤖 AI Service: http://localhost:8002"
fi

# Save PIDs for cleanup
echo "${FRONTEND_PID}" > .frontend.pid
echo "${BACKEND_PID}" > .backend.pid
if [ ! -z "${AI_PID}" ]; then
    echo "${AI_PID}" > .ai.pid
fi

echo "💡 To stop all services, run: ./deployment/scripts/stop.sh"
