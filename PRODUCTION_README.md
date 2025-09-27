# 🚀 Production Trading System

## Overview
Real-time AI-powered trading system with live market data and order execution.

## Features
- ✅ Real market data from multiple sources
- ✅ AI model trained on historical data (65%+ accuracy)
- ✅ Live order execution on Binance & Alpaca
- ✅ Comprehensive risk management
- ✅ Real-time monitoring and alerts

## Quick Start

### 1. Setup API Keys
```bash
cp api_keys_template.json api_keys.json
# Edit api_keys.json with your actual API keys
```

### 2. Start Production System
```bash
./start_production.sh
```

### 3. Access Dashboard
Open http://localhost:8000 in your browser

## Configuration

### Trading Settings
- Max position size: 2% of portfolio
- Daily loss limit: 5%
- Stop loss: 2%
- Take profit: 4%
- Max daily trades: 50

### Supported Assets
- **Crypto**: BTC/USDT, ETH/USDT, BNB/USDT, ADA/USDT, SOL/USDT
- **US Stocks**: AAPL, MSFT, GOOGL, AMZN, TSLA
- **Indian Stocks**: RELIANCE.NS, TCS.NS, INFY.NS

## Safety Features
- Real-time risk monitoring
- Automatic stop-loss orders
- Daily loss limits
- Position size limits
- Emergency stop functionality

## API Keys Required

### Binance (Crypto Trading)
1. Go to https://www.binance.com/en/my/settings/api-management
2. Create new API key with spot trading permissions
3. Add to api_keys.json

### Alpaca (Stock Trading)
1. Go to https://alpaca.markets/
2. Create account and get API keys
3. Add to api_keys.json

### Data Providers (Optional)
- Alpha Vantage: https://www.alphavantage.co/support/#api-key
- Polygon.io: https://polygon.io/

## Monitoring
- Dashboard: Real-time trading status
- Logs: logs/trading/ and logs/system/
- Reports: reports/daily/ and reports/monthly/

## Risk Management
⚠️ **IMPORTANT**: Start with small amounts and monitor closely
- Begin with $10-50 per trade
- Monitor for 1-2 weeks before scaling
- Never risk more than you can afford to lose

## Support
For issues or questions, check the logs in:
- production_setup.log
- logs/system/
- logs/trading/
