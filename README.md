# Stock AI Trading System

A comprehensive AI-powered trading system with multiple strategies, ML models, and autonomous trading agents.

## 🚀 Features

- **Multi-Strategy Framework**: Order Block Tap, VWAP Reversion, MA Crossover, and more
- **AI Trading Agents**: Autonomous agents that make trading decisions based on trained ML models
- **Advanced Feature Engineering**: 100+ technical indicators and market features
- **Risk Management**: Comprehensive risk controls and position management
- **Backtesting Engine**: Vectorized backtesting with detailed performance metrics
- **Execution System**: Mock exchange with realistic slippage and commission
- **Real-time Orchestration**: Coordinates all components in real-time
- **Audit Trail**: Complete logging and audit trail for all trades

## 📁 Project Structure

```
stock-ai/
├── configs/                    # Configuration files
│   ├── data_sources.yaml     # Data source configurations
│   └── strategies.yaml       # Strategy parameters
├── data/                      # Data storage
├── src/
│   ├── data/                  # Data generation and loading
│   ├── ingestion/            # Data ingestion modules
│   ├── features/             # Feature engineering
│   ├── strategies/           # Trading strategies
│   ├── labeling/             # Signal labeling for ML
│   ├── models/               # ML model training
│   ├── agents/               # AI trading agents
│   ├── execution/            # Order execution system
│   ├── backtest/             # Backtesting engine
│   └── orchestrator/         # System orchestrator
├── models/                   # Trained ML models
├── reports/                  # Performance reports
├── logs/                     # System logs
└── docs/                     # Documentation
```

## 🛠️ Installation

1. **Clone the repository**
```bash
cd stock-ai
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

## 🚀 Quick Start

### 1. Generate Sample Data
```bash
cd src/data
python sample_generator.py
```

### 2. Build Features
```bash
cd ../features
python build_features.py --input ../../data/sample_5m.parquet --output ../../data/features.parquet
```

### 3. Generate Labels
```bash
cd ../labeling
python label_pipeline.py --features ../../data/features.parquet --out ../../data/labels.parquet
```

### 4. Train ML Model
```bash
cd ../models
python train.py --features ../../data/features.parquet --labels ../../data/labels.parquet --out ../../models/trading_model.joblib
```

### 5. Run Backtest
```bash
cd ../backtest
python vector_backtest.py --raw ../../data/sample_5m.parquet --labels ../../data/labels.parquet --out ../../reports/backtest_results.json
```

### 6. Run Trading System
```bash
cd ../orchestrator
python orchestrator.py --mode single
```

## 📊 Trading Strategies

### Order Block Tap
- Identifies supply/demand zones
- Looks for price rejection at key levels
- High probability reversal trades

### VWAP Mean Reversion
- Mean reversion around VWAP
- Combined with RSI for confirmation
- Good for ranging markets

### Moving Average Crossover
- EMA crossover signals
- Trend-following strategy
- Momentum confirmation

### Risk Management
- Position sizing based on volatility (ATR)
- Maximum risk per trade: 2%
- Maximum total portfolio risk: 10%
- Maximum concurrent positions: 5

## 🤖 AI Agents

The system includes autonomous trading agents that:
- Analyze market conditions using trained ML models
- Generate trading signals with confidence scores
- Manage risk and position sizing
- Execute trades through the order gateway
- Track performance and adapt strategies

### Agent Configuration
```yaml
agent_config:
  max_positions: 5
  max_risk_per_trade: 0.02
  confidence_threshold: 0.6
  risk_reward_ratio: 2.0
```

## 💹 Execution System

### Order Gateway Features
- Multiple order types (Market, Limit, Stop)
- Risk validation before execution
- Mock exchange with realistic fills
- Commission and slippage modeling
- Complete audit trail

### Risk Controls
- Position size limits
- Notional value limits
- Order frequency limits
- Instrument whitelist/blacklist

## 📈 Performance Monitoring

### Real-time Metrics
- Win rate and profit factor
- Sharpe ratio and max drawdown
- Total return and volatility
- Strategy-level performance

### Reporting
- Automated performance reports
- Trade-level analysis
- Risk exposure monitoring
- Agent performance tracking

## 🔧 Configuration

### Data Sources (configs/data_sources.yaml)
```yaml
india:
  provider: zerodha
  instruments: [NIFTY50, RELIANCE, TCS]

crypto:
  provider: ccxt
  symbols: [BTC/USDT, ETH/USDT]
```

### Strategies (configs/strategies.yaml)
```yaml
ob_tap:
  enabled: true
  params:
    lookback: 20
    thresh_pct: 0.015
    risk_reward: 2.0
```

## 🧪 Testing

### Run All Tests
```bash
# Test data generation
python src/data/sample_generator.py

# Test feature engineering
python src/features/build_features.py

# Test strategy signals
python src/labeling/label_pipeline.py

# Test model training
python src/models/train.py

# Test backtesting
python src/backtest/vector_backtest.py

# Test execution system
python src/execution/order_gateway.py

# Test full system
python src/orchestrator/orchestrator.py --mode single
```

### Individual Component Tests
```bash
# Test order gateway
cd src/execution
python order_gateway.py

# Test trading agent
cd ../agents
python trading_agent.py

# Test feature engineering
cd ../features
python build_features.py --input ../../data/sample_5m.parquet
```

## 📊 Sample Output

### Backtest Results
```json
{
  "total_trades": 45,
  "win_rate": 0.6222,
  "total_return_pct": 12.45,
  "sharpe_ratio": 1.23,
  "max_drawdown_pct": -5.67,
  "profit_factor": 2.1
}
```

### Trading Signals
```
2024-01-15 10:30:00 - AAPL BUY @ 150.25, SL: 147.50, TP: 155.75, Confidence: 0.78
2024-01-15 10:35:00 - GOOGL SELL @ 2500.00, SL: 2525.00, TP: 2450.00, Confidence: 0.82
```

## 🚨 Important Notes

### For Live Trading
- **⚠️ This is a simulation system** - Do not connect to live brokers without thorough testing
- Implement proper API key management
- Add circuit breakers and kill switches
- Test with paper trading first
- Implement proper error handling
- Monitor system 24/7

### Risk Disclaimer
- Past performance does not guarantee future results
- Trading involves substantial risk of loss
- Only trade with capital you can afford to lose
- This system is for educational purposes

## 🔧 Extending the System

### Adding New Strategies
1. Create strategy class inheriting from `BaseStrategy`
2. Implement `generate_signals()` method
3. Add strategy to labeling pipeline
4. Update configuration files

### Adding New Data Sources
1. Implement data connector in `src/ingestion/`
2. Update `data_sources.yaml`
3. Modify data loader to handle new format

### Adding New Features
1. Add feature calculation to `FeatureEngineer`
2. Update feature selection in model training
3. Test with backtesting system

## 📞 Support

For questions or issues:
1. Check the logs in `logs/` directory
2. Review configuration files
3. Run individual component tests
4. Check sample data generation

## 🎯 Roadmap

- [ ] Real broker integration (Zerodha, Interactive Brokers)
- [ ] Advanced ML models (Transformers, LSTMs)
- [ ] Portfolio optimization
- [ ] Multi-timeframe analysis
- [ ] Alternative data integration
- [ ] Web dashboard for monitoring
- [ ] Mobile alerts and notifications

## 📝 License

This project is for educational purposes. Use at your own risk.
