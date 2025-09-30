#!/bin/bash

echo "📦 Installing AI Trading System as systemd services..."

# Create user and directories
sudo useradd -r -s /bin/false trading
sudo mkdir -p /opt/ai-trading
sudo cp -r . /opt/ai-trading/
sudo chown -R trading:trading /opt/ai-trading

# Install service files
sudo cp deployment/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable ai-trading-frontend
sudo systemctl enable ai-trading-backend
sudo systemctl enable ai-trading-ai

# Start services
sudo systemctl start ai-trading-frontend
sudo systemctl start ai-trading-backend
sudo systemctl start ai-trading-ai

echo "✅ AI Trading System installed and started!"
echo "📱 Dashboard: http://localhost:8000"
echo "💡 Check status: sudo systemctl status ai-trading-*"
