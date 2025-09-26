#!/bin/bash

echo "🛑 Stopping AI Trading System..."

# Stop services by PID files
for pidfile in .frontend.pid .backend.pid .ai.pid; do
    if [ -f "$pidfile" ]; then
        PID=$(cat "$pidfile")
        if kill -0 "$PID" 2>/dev/null; then
            echo "🛑 Stopping process $PID..."
            kill "$PID"
        fi
        rm -f "$pidfile"
    fi
done

# Kill any remaining processes
pkill -f "production_dashboard.py"
pkill -f "backend_api.py"
pkill -f "ai_service.py"

echo "✅ All services stopped"
