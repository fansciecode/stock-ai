#!/usr/bin/env python3
"""
FastAPI REST API for the Stock AI Trading System
Provides endpoints for managing trading operations, monitoring performance, and system control
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import sys
import os
import json
import logging
from datetime import datetime, timedelta
import pandas as pd

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from orchestrator.orchestrator import TradingOrchestrator
from agents.trading_agent import TradingAgent
from execution.order_gateway import OrderGateway, place_market_order, place_limit_order
from data.sample_generator import SyntheticDataGenerator
from ingestion.load_sample import DataLoader

# Initialize FastAPI app
app = FastAPI(
    title="Stock AI Trading System API",
    description="REST API for AI-powered algorithmic trading system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for system state
orchestrator: Optional[TradingOrchestrator] = None
is_system_running = False

# Pydantic models for request/response
class OrderRequest(BaseModel):
    instrument: str
    side: int  # 1 for buy, -1 for sell
    quantity: float
    order_type: str = "MARKET"  # MARKET or LIMIT
    price: Optional[float] = None
    agent_id: Optional[str] = None
    strategy: Optional[str] = None

class SystemStatus(BaseModel):
    is_running: bool
    uptime: Optional[str] = None
    last_update: Optional[str] = None
    active_agents: int
    active_positions: int
    total_trades: int

class PerformanceMetrics(BaseModel):
    total_pnl: float
    win_rate: float
    total_trades: int
    active_positions: int
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None

class MarketDataRequest(BaseModel):
    symbol: str
    timeframe: str = "5m"
    limit: int = 100
    source: str = "binance"  # binance, yahoo, synthetic

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize the trading system on startup"""
    global orchestrator
    try:
        orchestrator = TradingOrchestrator()
        logger.info("Trading system API started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize trading system: {e}")

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": "Stock AI Trading System API",
        "version": "1.0.0",
        "status": "active",
        "docs": "/docs",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "system_running": is_system_running
    }

# ====================
# SYSTEM CONTROL ENDPOINTS
# ====================

@app.post("/system/start")
async def start_system():
    """Start the trading system"""
    global is_system_running, orchestrator
    
    if is_system_running:
        return {"message": "System is already running", "status": "running"}
    
    try:
        if orchestrator is None:
            orchestrator = TradingOrchestrator()
        
        success = orchestrator.start_trading()
        if success:
            is_system_running = True
            return {"message": "Trading system started successfully", "status": "started"}
        else:
            raise HTTPException(status_code=500, detail="Failed to start trading system")
    
    except Exception as e:
        logger.error(f"Error starting system: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/system/stop")
async def stop_system():
    """Stop the trading system"""
    global is_system_running, orchestrator
    
    if not is_system_running:
        return {"message": "System is already stopped", "status": "stopped"}
    
    try:
        if orchestrator:
            orchestrator.stop_trading()
        is_system_running = False
        return {"message": "Trading system stopped successfully", "status": "stopped"}
    
    except Exception as e:
        logger.error(f"Error stopping system: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/system/status", response_model=SystemStatus)
async def get_system_status():
    """Get current system status"""
    global orchestrator, is_system_running
    
    active_agents = 0
    active_positions = 0
    total_trades = 0
    
    if orchestrator:
        active_agents = len(orchestrator.trading_agents)
        if orchestrator.order_gateway:
            active_positions = len(orchestrator.order_gateway.get_positions())
            total_trades = len(orchestrator.order_gateway.get_trade_history())
    
    return SystemStatus(
        is_running=is_system_running,
        uptime=str(datetime.now() - orchestrator.last_update) if orchestrator and orchestrator.last_update else None,
        last_update=orchestrator.last_update.isoformat() if orchestrator and orchestrator.last_update else None,
        active_agents=active_agents,
        active_positions=active_positions,
        total_trades=total_trades
    )

@app.post("/system/run-cycle")
async def run_single_cycle():
    """Run a single trading cycle"""
    global orchestrator
    
    if orchestrator is None:
        raise HTTPException(status_code=400, detail="System not initialized")
    
    try:
        success = orchestrator.run_single_cycle()
        if success:
            return {"message": "Trading cycle completed successfully", "status": "completed"}
        else:
            raise HTTPException(status_code=500, detail="Trading cycle failed")
    
    except Exception as e:
        logger.error(f"Error running trading cycle: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ====================
# MARKET DATA ENDPOINTS
# ====================

@app.get("/market-data/latest")
async def get_latest_market_data():
    """Get latest market data (prioritizes global live data)"""
    global orchestrator
    
    # Try to get global market data first
    try:
        import os
        global_data_file = "data/global_market_data.parquet"
        live_data_file = "data/live_market_data.parquet"
        
        # Prioritize global market data
        if os.path.exists(global_data_file):
            import pandas as pd
            global_data = pd.read_parquet(global_data_file)
            if not global_data.empty:
                # Get latest data from each market
                latest_by_market = global_data.groupby('instrument').tail(1)
                data = latest_by_market.tail(20).to_dict('records')  # Show more instruments
                
                # Categorize markets
                market_breakdown = {}
                for item in data:
                    instrument = item.get('instrument', '')
                    if '_NSE' in instrument or '_BSE' in instrument:
                        market = 'Indian Markets (NSE/BSE)'
                    elif '_US' in instrument:
                        market = 'US Markets (NYSE/NASDAQ)'
                    elif 'USDT' in instrument or '_BINANCE' in instrument:
                        market = 'Cryptocurrency'
                    elif '_FX' in instrument:
                        market = 'Forex'
                    elif '_COMM' in instrument:
                        market = 'Commodities'
                    else:
                        market = 'Global Markets'
                    
                    if market not in market_breakdown:
                        market_breakdown[market] = 0
                    market_breakdown[market] += 1
                
                return {
                    "data": data,
                    "count": len(data),
                    "timestamp": datetime.now().isoformat(),
                    "data_type": "GLOBAL_LIVE_DATA",
                    "source": "Global real-time feeds (NSE, BSE, NYSE, NASDAQ, Crypto, Forex, Commodities)",
                    "market_breakdown": market_breakdown,
                    "total_instruments": len(global_data.groupby('instrument'))
                }
        
        # Fallback to standard live data
        elif os.path.exists(live_data_file):
            import pandas as pd
            live_data = pd.read_parquet(live_data_file)
            if not live_data.empty:
                data = live_data.tail(10).to_dict('records')
                return {
                    "data": data,
                    "count": len(data),
                    "timestamp": datetime.now().isoformat(),
                    "data_type": "LIVE_MARKET_DATA",
                    "source": "Real-time feeds"
                }
                
    except Exception as e:
        logger.warning(f"Could not load global/live data: {e}")
    
    # Fallback to orchestrator data
    if orchestrator is None or orchestrator.market_data is None:
        raise HTTPException(status_code=404, detail="No market data available")
    
    # Convert to dict for JSON serialization
    data = orchestrator.market_data.tail(10).to_dict('records')
    return {
        "data": data,
        "count": len(data),
        "timestamp": datetime.now().isoformat(),
        "data_type": "SAMPLE_DATA",
        "source": "Synthetic/Demo data"
    }

@app.post("/market-data/fetch")
async def fetch_market_data(request: MarketDataRequest):
    """Fetch real-time market data from external sources"""
    try:
        data_loader = DataLoader()
        
        if request.source == "crypto" or request.source == "binance":
            df = data_loader.load_crypto_data(
                symbol=request.symbol,
                timeframe=request.timeframe,
                limit=request.limit
            )
        elif request.source == "stock" or request.source == "yahoo":
            df = data_loader.load_stock_data(
                symbol=request.symbol,
                period="1mo",
                interval=request.timeframe
            )
        elif request.source == "synthetic":
            generator = SyntheticDataGenerator()
            df = generator.generate_random_walk(
                n_points=request.limit,
                instrument=request.symbol
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid data source")
        
        if df is None or df.empty:
            raise HTTPException(status_code=404, detail="No data found")
        
        return {
            "symbol": request.symbol,
            "source": request.source,
            "timeframe": request.timeframe,
            "data": df.to_dict('records'),
            "count": len(df),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ====================
# TRADING ENDPOINTS
# ====================

@app.post("/trading/order")
async def place_order(order_request: OrderRequest):
    """Place a trading order"""
    global orchestrator
    
    if orchestrator is None or orchestrator.order_gateway is None:
        raise HTTPException(status_code=400, detail="Trading system not initialized")
    
    try:
        order_data = {
            "instrument": order_request.instrument,
            "side": order_request.side,
            "quantity": order_request.quantity,
            "order_type": order_request.order_type,
            "price": order_request.price,
            "agent_id": order_request.agent_id,
            "strategy": order_request.strategy
        }
        
        result = orchestrator.order_gateway.submit_order(order_data)
        return result
    
    except Exception as e:
        logger.error(f"Error placing order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trading/positions")
async def get_positions():
    """Get current trading positions"""
    global orchestrator
    
    if orchestrator is None or orchestrator.order_gateway is None:
        raise HTTPException(status_code=400, detail="Trading system not initialized")
    
    positions = orchestrator.order_gateway.get_positions()
    return {
        "positions": positions,
        "count": len(positions),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/trading/orders")
async def get_orders(limit: int = 50):
    """Get recent trading orders"""
    global orchestrator
    
    if orchestrator is None or orchestrator.order_gateway is None:
        raise HTTPException(status_code=400, detail="Trading system not initialized")
    
    trades = orchestrator.order_gateway.get_trade_history(limit)
    return {
        "trades": trades,
        "count": len(trades),
        "timestamp": datetime.now().isoformat()
    }

@app.delete("/trading/positions/{instrument}")
async def close_position(instrument: str):
    """Close a specific position"""
    global orchestrator
    
    if orchestrator is None or orchestrator.order_gateway is None:
        raise HTTPException(status_code=400, detail="Trading system not initialized")
    
    try:
        positions = orchestrator.order_gateway.get_positions()
        if instrument not in positions:
            raise HTTPException(status_code=404, detail=f"No position found for {instrument}")
        
        quantity = positions[instrument]
        side = -1 if quantity > 0 else 1  # Opposite side to close
        
        result = place_market_order(
            orchestrator.order_gateway,
            instrument=instrument,
            side=side,
            quantity=abs(quantity),
            agent_id="api_close",
            strategy="position_close"
        )
        
        return result
    
    except Exception as e:
        logger.error(f"Error closing position: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ====================
# PERFORMANCE ENDPOINTS
# ====================

@app.get("/performance/metrics", response_model=PerformanceMetrics)
async def get_performance_metrics():
    """Get system performance metrics"""
    global orchestrator
    
    if orchestrator is None:
        raise HTTPException(status_code=400, detail="System not initialized")
    
    # Aggregate performance from all agents
    total_pnl = 0.0
    total_trades = 0
    total_wins = 0
    
    for agent in orchestrator.trading_agents.values():
        perf = agent.get_performance_summary()
        if isinstance(perf, dict) and "total_pnl" in perf:
            total_pnl += perf.get("total_pnl", 0)
            total_trades += perf.get("total_trades", 0)
            total_wins += perf.get("winning_trades", 0)
    
    win_rate = total_wins / total_trades if total_trades > 0 else 0
    active_positions = len(orchestrator.order_gateway.get_positions()) if orchestrator.order_gateway else 0
    
    return PerformanceMetrics(
        total_pnl=total_pnl,
        win_rate=win_rate,
        total_trades=total_trades,
        active_positions=active_positions
    )

@app.get("/performance/agents")
async def get_agent_performance():
    """Get performance metrics for all agents"""
    global orchestrator
    
    if orchestrator is None:
        raise HTTPException(status_code=400, detail="System not initialized")
    
    agent_performance = {}
    for agent_id, agent in orchestrator.trading_agents.items():
        agent_performance[agent_id] = agent.get_performance_summary()
    
    return {
        "agents": agent_performance,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/performance/backtest")
async def get_backtest_results():
    """Get latest backtest results"""
    try:
        backtest_file = "reports/backtest_results.json"
        if not os.path.exists(backtest_file):
            raise HTTPException(status_code=404, detail="No backtest results found")
        
        with open(backtest_file, 'r') as f:
            results = json.load(f)
        
        return results
    
    except Exception as e:
        logger.error(f"Error reading backtest results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ====================
# CONFIGURATION ENDPOINTS
# ====================

@app.get("/config/strategies")
async def get_strategy_config():
    """Get current strategy configuration"""
    try:
        import yaml
        with open("configs/strategies.yaml", 'r') as f:
            config = yaml.safe_load(f)
        return config
    except Exception as e:
        logger.error(f"Error reading strategy config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/config/strategies")
async def update_strategy_config(config: Dict[str, Any]):
    """Update strategy configuration"""
    try:
        import yaml
        with open("configs/strategies.yaml", 'w') as f:
            yaml.dump(config, f, default_flow_style=False)
        return {"message": "Configuration updated successfully"}
    except Exception as e:
        logger.error(f"Error updating strategy config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ====================
# REAL-TIME ENDPOINTS
# ====================

@app.get("/realtime/signals")
async def get_latest_signals():
    """Get latest trading signals from all strategies"""
    global orchestrator
    
    if orchestrator is None or orchestrator.latest_features is None:
        raise HTTPException(status_code=400, detail="System not initialized or no features available")
    
    try:
        # Generate signals from all agents
        all_signals = []
        for agent_id, agent in orchestrator.trading_agents.items():
            signals = agent.analyze_market(orchestrator.latest_features)
            if not signals.empty:
                signals_dict = signals.to_dict('records')
                for signal in signals_dict:
                    signal['agent_id'] = agent_id
                all_signals.extend(signals_dict)
        
        return {
            "signals": all_signals,
            "count": len(all_signals),
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Error generating signals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/realtime/market-status")
async def get_market_status():
    """Get current market status and system health"""
    global orchestrator
    
    # Check live data status
    live_data_status = "DISCONNECTED"
    live_instruments = 0
    
    try:
        import os
        if os.path.exists("data/data_quality_report.json"):
            with open("data/data_quality_report.json", 'r') as f:
                quality_report = json.load(f)
                live_data_status = quality_report.get("overall_health", "UNKNOWN")
                live_instruments = len([i for i in quality_report.get("instruments", {}).values() 
                                      if i.get("status") == "FRESH"])
    except Exception:
        pass
    
    status = {
        "system_running": is_system_running,
        "market_open": True,  # This would connect to real market hours API
        "data_connected": orchestrator is not None and orchestrator.market_data is not None,
        "live_data_status": live_data_status,
        "live_instruments": live_instruments,
        "agents_active": len(orchestrator.trading_agents) if orchestrator else 0,
        "last_update": orchestrator.last_update.isoformat() if orchestrator and orchestrator.last_update else None,
        "timestamp": datetime.now().isoformat()
    }
    
    return status

@app.get("/market-data/live-status")
async def get_live_data_status():
    """Get detailed live data status"""
    
    try:
        import os
        if os.path.exists("data/data_quality_report.json"):
            with open("data/data_quality_report.json", 'r') as f:
                return json.load(f)
        else:
            return {
                "error": "Live data service not running",
                "recommendation": "Start live data service: python src/services/live_data_service.py"
            }
    except Exception as e:
        return {
            "error": f"Could not read live data status: {e}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/market-data/global-overview")
async def get_global_market_overview():
    """Get comprehensive global market overview"""
    
    try:
        import os
        import pandas as pd
        
        # Check for global market stats
        if os.path.exists("data/global_market_stats.json"):
            with open("data/global_market_stats.json", 'r') as f:
                stats = json.load(f)
        else:
            stats = {"error": "Global market service not running"}
        
        # Get market data breakdown if available
        market_data = {}
        if os.path.exists("data/global_market_data.parquet"):
            df = pd.read_parquet("data/global_market_data.parquet")
            
            # Categorize by market
            categories = {
                'Indian_Markets': df[df['instrument'].str.contains('_NSE|_BSE', na=False)],
                'US_Markets': df[df['instrument'].str.contains('_US', na=False)],
                'Cryptocurrency': df[df['instrument'].str.contains('USDT|_BINANCE|_KRAKEN', na=False)],
                'Forex': df[df['instrument'].str.contains('_FX', na=False)],
                'Commodities': df[df['instrument'].str.contains('_COMM', na=False)],
                'European_Markets': df[df['instrument'].str.contains('_LSE|_XETRA', na=False)]
            }
            
            for category, data in categories.items():
                if not data.empty:
                    latest_by_instrument = data.groupby('instrument').tail(1)
                    market_data[category] = {
                        'instrument_count': len(latest_by_instrument),
                        'total_records': len(data),
                        'latest_update': str(data['ts'].max()) if 'ts' in data.columns else None,
                        'sample_instruments': latest_by_instrument['instrument'].head(5).tolist(),
                        'price_range': {
                            'min': float(latest_by_instrument['close'].min()),
                            'max': float(latest_by_instrument['close'].max())
                        } if 'close' in latest_by_instrument.columns else None
                    }
        
        return {
            "timestamp": datetime.now().isoformat(),
            "global_stats": stats,
            "market_breakdown": market_data,
            "coverage": {
                "indian_markets": "NSE, BSE (Nifty 50, Sensex, Popular stocks)",
                "us_markets": "NYSE, NASDAQ (S&P 500, Tech giants, ETFs)",
                "cryptocurrency": "Binance, Coinbase, Kraken (50+ pairs)",
                "forex": "Major currency pairs (EUR/USD, GBP/USD, etc.)",
                "commodities": "Gold, Silver, Oil, Agricultural products",
                "european_markets": "LSE, Frankfurt (FTSE, DAX)",
                "asian_markets": "Japan, China (Nikkei, ADRs)"
            },
            "total_potential_coverage": "500+ instruments across all major global markets"
        }
        
    except Exception as e:
        return {
            "error": f"Could not generate global overview: {e}",
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
