#!/bin/bash

echo "🐳 Starting AI Trading System - Docker"
echo "Performance Tier: STANDARD"

# Build and start with Docker Compose
cd deployment/docker
docker-compose up --build -d

echo "✅ Docker services started!"
echo "📱 Dashboard: http://localhost:8000"
echo "🔧 Backend API: http://localhost:8001"
echo "🤖 AI Service: http://localhost:8002"

echo "💡 To view logs: docker-compose logs -f"
echo "💡 To stop: docker-compose down"
