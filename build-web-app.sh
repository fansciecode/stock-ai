#!/bin/bash

# IBCM Stack Web App Build Script
# This script helps build and run the web-app Docker container

set -e

echo "🔧 IBCM Stack Web App Build Script"
echo "=================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Build the web-app specifically
echo "🏗️  Building web-app Docker image..."
docker-compose build web-app

if [ $? -eq 0 ]; then
    echo "✅ Web-app build completed successfully!"
    echo ""
    echo "🚀 To run the entire stack:"
    echo "   docker-compose up -d"
    echo ""
    echo "🚀 To run only the web-app:"
    echo "   docker-compose up web-app"
    echo ""
    echo "🔍 To check logs:"
    echo "   docker-compose logs web-app"
    echo ""
    echo "🛑 To stop the services:"
    echo "   docker-compose down"
else
    echo "❌ Web-app build failed. Please check the error messages above."
    exit 1
fi