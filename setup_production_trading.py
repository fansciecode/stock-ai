#!/usr/bin/env python3
"""
🚀 PRODUCTION TRADING SETUP
Complete setup script to convert system to real trading platform
"""

import os
import sys
import logging
import json
from datetime import datetime
from typing import Dict, List

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('production_setup.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def create_directory_structure():
    """Create necessary directories for production"""
    directories = [
        'models',
        'data/historical',
        'data/live',
        'logs/trading',
        'logs/system',
        'backups',
        'reports/daily',
        'reports/monthly'
    ]
    
    logger.info("📁 Creating directory structure...")
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"✅ Created: {directory}")

def train_production_ai_model():
    """Train AI model with real historical data"""
    logger.info("🤖 Training production AI model...")
    
    try:
        # Import the real AI trainer
        sys.path.append('src/ai')
        from real_ai_trainer import train_production_ai_model
        
        # Train the model
        result = train_production_ai_model()
        
        if result['success'] and result['production_ready']:
            logger.info("✅ AI model training completed successfully!")
            logger.info(f"📊 Model accuracy: {result['accuracy']:.3f}")
            logger.info(f"📊 Cross-validation: {result['cv_accuracy']:.3f} ± {result['cv_std']:.3f}")
            return True
        else:
            logger.warning("⚠️ AI model training completed but may not be production-ready")
            logger.warning(f"📊 Accuracy: {result.get('accuracy', 'Unknown')}")
            return False
            
    except Exception as e:
        logger.error(f"❌ AI model training failed: {e}")
        return False

def setup_real_data_feeds():
    """Setup real market data feeds"""
    logger.info("📊 Setting up real market data feeds...")
    
    try:
        # Test market data connection
        sys.path.append('src/data')
        from real_market_data import real_market_data
        
        # Test with a few symbols
        test_symbols = ['AAPL', 'BTC-USD', 'RELIANCE.NS']
        
        for symbol in test_symbols:
            data = real_market_data.get_live_price(symbol)
            if data:
                logger.info(f"✅ {symbol}: ${data['current_price']:.2f} ({data['source']})")
            else:
                logger.warning(f"⚠️ Could not get data for {symbol}")
        
        # Check market status
        market_status = real_market_data.get_market_status()
        logger.info(f"📈 US Market Open: {market_status.get('us_market_open', False)}")
        logger.info(f"🪙 Crypto Market: Always Open")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Market data setup failed: {e}")
        return False

def create_production_config():
    """Create production configuration file"""
    logger.info("⚙️ Creating production configuration...")
    
    config = {
        "trading": {
            "mode": "LIVE",
            "max_position_size_pct": 2.0,
            "max_daily_loss_pct": 5.0,
            "min_order_size_usd": 10,
            "max_order_size_usd": 1000,
            "max_daily_trades": 50,
            "stop_loss_pct": 2.0,
            "take_profit_pct": 4.0
        },
        "ai_model": {
            "min_accuracy_threshold": 0.65,
            "retrain_frequency_days": 7,
            "feature_update_interval_hours": 24
        },
        "data_sources": {
            "primary": "yfinance",
            "backup": ["alpha_vantage", "polygon"],
            "cache_duration_seconds": 60
        },
        "exchanges": {
            "binance": {
                "enabled": True,
                "testnet": False,
                "supported_assets": ["BTC/USDT", "ETH/USDT", "BNB/USDT", "ADA/USDT", "SOL/USDT"]
            },
            "alpaca": {
                "enabled": True,
                "paper_trading": False,
                "supported_assets": ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
            }
        },
        "monitoring": {
            "log_level": "INFO",
            "alert_on_loss_pct": 3.0,
            "daily_report_time": "18:00",
            "backup_frequency_hours": 6
        },
        "setup_date": datetime.now().isoformat(),
        "version": "1.0.0"
    }
    
    try:
        with open('production_config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info("✅ Production configuration created")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create configuration: {e}")
        return False

def setup_api_key_management():
    """Setup secure API key management"""
    logger.info("🔑 Setting up API key management...")
    
    api_key_template = {
        "binance": {
            "live": {
                "api_key": "YOUR_BINANCE_LIVE_API_KEY",
                "api_secret": "YOUR_BINANCE_LIVE_API_SECRET",
                "testnet": False
            },
            "testnet": {
                "api_key": "YOUR_BINANCE_TESTNET_API_KEY", 
                "api_secret": "YOUR_BINANCE_TESTNET_API_SECRET",
                "testnet": True
            }
        },
        "alpaca": {
            "live": {
                "api_key": "YOUR_ALPACA_LIVE_API_KEY",
                "api_secret": "YOUR_ALPACA_LIVE_API_SECRET",
                "paper_trading": False
            },
            "paper": {
                "api_key": "YOUR_ALPACA_PAPER_API_KEY",
                "api_secret": "YOUR_ALPACA_PAPER_API_SECRET", 
                "paper_trading": True
            }
        },
        "data_providers": {
            "alpha_vantage": "YOUR_ALPHA_VANTAGE_API_KEY",
            "polygon": "YOUR_POLYGON_API_KEY"
        }
    }
    
    try:
        with open('api_keys_template.json', 'w') as f:
            json.dump(api_key_template, f, indent=2)
        
        logger.info("✅ API key template created: api_keys_template.json")
        logger.info("🔒 IMPORTANT: Replace placeholder values with your actual API keys")
        logger.info("🔒 SECURITY: Never commit api_keys.json to version control")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create API key template: {e}")
        return False

def create_startup_script():
    """Create production startup script"""
    logger.info("🚀 Creating startup script...")
    
    startup_script = '''#!/bin/bash
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
'''
    
    try:
        with open('start_production.sh', 'w') as f:
            f.write(startup_script)
        
        # Make executable
        os.chmod('start_production.sh', 0o755)
        
        logger.info("✅ Startup script created: start_production.sh")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create startup script: {e}")
        return False

def create_requirements_file():
    """Create requirements.txt for production"""
    logger.info("📦 Creating requirements.txt...")
    
    requirements = [
        "yfinance>=0.1.96",
        "ccxt>=4.5.0",
        "requests>=2.32.0",
        "pandas>=2.3.0",
        "numpy>=2.0.0",
        "scikit-learn>=1.6.0",
        "joblib>=1.5.0",
        "flask>=3.0.0",
        "flask-cors>=5.0.0",
        "python-dotenv>=1.0.0",
        "cryptography>=46.0.0",
        "schedule>=1.2.0",
        "psutil>=6.0.0"
    ]
    
    try:
        with open('requirements.txt', 'w') as f:
            f.write('\n'.join(requirements))
        
        logger.info("✅ Requirements file created")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create requirements file: {e}")
        return False

def create_production_readme():
    """Create production README"""
    logger.info("📚 Creating production README...")
    
    readme_content = '''# 🚀 Production Trading System

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
'''
    
    try:
        with open('PRODUCTION_README.md', 'w') as f:
            f.write(readme_content)
        
        logger.info("✅ Production README created")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to create README: {e}")
        return False

def run_production_setup():
    """Run complete production setup"""
    logger.info("=" * 80)
    logger.info("🚀 PRODUCTION TRADING SYSTEM SETUP")
    logger.info("=" * 80)
    
    setup_steps = [
        ("Creating directory structure", create_directory_structure),
        ("Creating requirements file", create_requirements_file),
        ("Setting up real data feeds", setup_real_data_feeds),
        ("Training AI model", train_production_ai_model),
        ("Creating production config", create_production_config),
        ("Setting up API key management", setup_api_key_management),
        ("Creating startup script", create_startup_script),
        ("Creating production README", create_production_readme)
    ]
    
    completed_steps = 0
    total_steps = len(setup_steps)
    
    for step_name, step_function in setup_steps:
        logger.info(f"\n🔧 {step_name}...")
        try:
            if step_function():
                completed_steps += 1
                logger.info(f"✅ {step_name} completed")
            else:
                logger.error(f"❌ {step_name} failed")
        except Exception as e:
            logger.error(f"❌ {step_name} failed: {e}")
    
    # Summary
    logger.info("\n" + "=" * 80)
    logger.info("📋 SETUP SUMMARY")
    logger.info("=" * 80)
    logger.info(f"✅ Completed: {completed_steps}/{total_steps} steps")
    
    if completed_steps == total_steps:
        logger.info("🎉 PRODUCTION SETUP COMPLETED SUCCESSFULLY!")
        logger.info("\n📋 NEXT STEPS:")
        logger.info("1. 🔑 Edit api_keys.json with your actual API keys")
        logger.info("2. 🧪 Test with small amounts first ($10-50)")
        logger.info("3. 🚀 Run: ./start_production.sh")
        logger.info("4. 🌐 Access dashboard: http://localhost:8000")
        logger.info("5. 📊 Monitor performance for 1-2 weeks before scaling")
        
        logger.info("\n⚠️ IMPORTANT SAFETY REMINDERS:")
        logger.info("- Start with testnet/paper trading first")
        logger.info("- Use small position sizes initially")
        logger.info("- Monitor the system closely")
        logger.info("- Never risk more than you can afford to lose")
        
    elif completed_steps >= total_steps * 0.8:
        logger.warning("⚠️ SETUP MOSTLY COMPLETED")
        logger.warning("Some steps failed but system may still be functional")
        logger.warning("Check logs above for specific issues")
        
    else:
        logger.error("❌ SETUP FAILED")
        logger.error("Multiple critical steps failed")
        logger.error("Review logs and fix issues before proceeding")
    
    logger.info("=" * 80)

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Production Trading System Setup')
    parser.add_argument('--train-only', action='store_true', help='Only train the AI model')
    args = parser.parse_args()
    
    if args.train_only:
        logger.info("🤖 Training AI model only...")
        train_production_ai_model()
    else:
        run_production_setup()

if __name__ == "__main__":
    main()
