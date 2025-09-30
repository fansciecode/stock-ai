#!/usr/bin/env python3
"""
Autonomous Trading Bot - Fully automated AI-driven trading system
Continuously monitors markets, makes AI decisions, and executes orders
"""

import sys
import os
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List
import pandas as pd
import json

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from trading.ai_order_executor import AIOrderExecutor
from training.live_data_trainer import LiveDataTrainer

class AutonomousTrader:
    """Fully autonomous AI trading system"""
    
    def __init__(self):
        self.ai_executor = AIOrderExecutor()
        self.ai_trainer = LiveDataTrainer()
        self.logger = self._setup_logging()
        
        # Trading parameters
        self.trading_pairs = [
            'BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT'
        ]
        self.scan_interval = 60  # Check markets every 60 seconds
        self.is_running = False
        
        # Performance tracking
        self.start_time = None
        self.cycles_completed = 0
        self.orders_placed = 0
        
    def _setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
    
    async def start_autonomous_trading(self):
        """Start the autonomous trading system"""
        
        self.logger.info("🤖 STARTING AUTONOMOUS AI TRADING SYSTEM")
        self.logger.info("=" * 60)
        self.logger.info(f"📊 Trading Pairs: {', '.join(self.trading_pairs)}")
        self.logger.info(f"⏰ Scan Interval: {self.scan_interval} seconds")
        self.logger.info(f"💰 Max Position: ${self.ai_executor.max_position_value}")
        self.logger.info(f"🎯 Min Confidence: {self.ai_executor.min_confidence:.1%}")
        
        self.is_running = True
        self.start_time = datetime.now()
        
        try:
            while self.is_running:
                await self.trading_cycle()
                await asyncio.sleep(self.scan_interval)
        
        except KeyboardInterrupt:
            self.logger.info("🛑 Received shutdown signal")
            await self.shutdown()
        
        except Exception as e:
            self.logger.error(f"❌ Critical error in trading loop: {e}")
            await self.emergency_shutdown()
    
    async def trading_cycle(self):
        """Single trading cycle: analyze all pairs and execute orders"""
        
        self.cycles_completed += 1
        self.logger.info(f"\n🔄 Trading Cycle #{self.cycles_completed}")
        self.logger.info(f"⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Get latest market data
            market_data = await self.get_latest_market_data()
            
            if not market_data:
                self.logger.warning("⚠️ No market data available, skipping cycle")
                return
            
            # Check each trading pair
            for symbol in self.trading_pairs:
                if symbol in market_data:
                    await self.analyze_and_trade(symbol, market_data[symbol])
                else:
                    self.logger.warning(f"⚠️ No data for {symbol}")
            
            # Performance summary
            await self.log_cycle_summary()
            
        except Exception as e:
            self.logger.error(f"❌ Error in trading cycle: {e}")
    
    async def get_latest_market_data(self) -> Dict[str, pd.DataFrame]:
        """Get latest market data for all trading pairs"""
        
        market_data = {}
        
        try:
            # Check for live data files
            data_files = [
                "data/global_market_data.parquet",
                "data/live_market_data.parquet"
            ]
            
            for file_path in data_files:
                if os.path.exists(file_path):
                    try:
                        df = pd.read_parquet(file_path)
                        
                        if not df.empty:
                            for symbol in self.trading_pairs:
                                # Map symbol formats
                                file_symbol = symbol.replace('/', '_') + '_BINANCE'
                                
                                if file_symbol in df['instrument'].values:
                                    symbol_data = df[df['instrument'] == file_symbol].copy()
                                    symbol_data = symbol_data.sort_values('ts').tail(100)
                                    
                                    if len(symbol_data) >= 20:  # Minimum data for analysis
                                        market_data[symbol] = symbol_data
                    
                    except Exception as e:
                        self.logger.error(f"Error loading {file_path}: {e}")
            
            # Check individual files
            for symbol in self.trading_pairs:
                file_symbol = symbol.replace('/', '_')
                file_path = f"data/live_data_{file_symbol}.parquet"
                
                if os.path.exists(file_path) and symbol not in market_data:
                    try:
                        df = pd.read_parquet(file_path)
                        if not df.empty and len(df) >= 20:
                            market_data[symbol] = df
                    except Exception as e:
                        self.logger.error(f"Error loading {file_path}: {e}")
        
        except Exception as e:
            self.logger.error(f"Error getting market data: {e}")
        
        return market_data
    
    async def analyze_and_trade(self, symbol: str, data: pd.DataFrame):
        """Analyze a symbol and execute trades if conditions are met"""
        
        try:
            current_price = float(data['close'].iloc[-1])
            
            self.logger.info(f"📊 Analyzing {symbol} @ ${current_price:,.2f}")
            
            # Execute AI analysis and potential order
            result = await self.ai_executor.analyze_and_execute(
                symbol=symbol,
                market_data=data,
                exchange='binance'
            )
            
            if result['status'] == 'executed':
                self.orders_placed += 1
                self.logger.info(f"✅ ORDER EXECUTED: {result['action'].upper()} {symbol}")
                self.logger.info(f"   Shares: {result['shares']:.6f}")
                self.logger.info(f"   Price: ${result['price']:.2f}")
                self.logger.info(f"   Confidence: {result['confidence']:.1%}")
                self.logger.info(f"   Order ID: {result['order_id']}")
            
            elif result['status'] == 'skipped':
                self.logger.debug(f"⏭️ Skipped {symbol}: {result['reason']}")
            
            elif result['status'] == 'failed':
                self.logger.error(f"❌ Failed to execute {symbol}: {result['message']}")
        
        except Exception as e:
            self.logger.error(f"❌ Error analyzing {symbol}: {e}")
    
    async def log_cycle_summary(self):
        """Log summary of current trading cycle"""
        
        # Get performance metrics
        performance = self.ai_executor.get_performance_summary()
        
        # Calculate uptime
        uptime = datetime.now() - self.start_time
        uptime_hours = uptime.total_seconds() / 3600
        
        self.logger.info(f"📈 CYCLE SUMMARY:")
        self.logger.info(f"   Uptime: {uptime_hours:.1f} hours")
        self.logger.info(f"   Cycles: {self.cycles_completed}")
        self.logger.info(f"   Orders Placed: {self.orders_placed}")
        self.logger.info(f"   Total P&L: ${performance['total_profit_loss']:+.2f}")
        self.logger.info(f"   Win Rate: {performance['win_rate_pct']:.1f}%")
        self.logger.info(f"   Active Positions: {performance['active_positions']}")
        
        # Save performance data
        cycle_data = {
            'timestamp': datetime.now().isoformat(),
            'cycle': self.cycles_completed,
            'uptime_hours': uptime_hours,
            'orders_placed': self.orders_placed,
            'performance': performance
        }
        
        # Append to log file
        with open('data/autonomous_trading_log.jsonl', 'a') as f:
            f.write(json.dumps(cycle_data, default=str) + '\n')
    
    async def shutdown(self):
        """Graceful shutdown of trading system"""
        
        self.logger.info("🛑 Shutting down autonomous trading system...")
        self.is_running = False
        
        # Final performance report
        final_performance = self.ai_executor.get_performance_summary()
        
        self.logger.info("📊 FINAL PERFORMANCE REPORT:")
        self.logger.info(f"   Total Runtime: {datetime.now() - self.start_time}")
        self.logger.info(f"   Cycles Completed: {self.cycles_completed}")
        self.logger.info(f"   Orders Placed: {self.orders_placed}")
        self.logger.info(f"   Final P&L: ${final_performance['total_profit_loss']:+.2f}")
        self.logger.info(f"   Win Rate: {final_performance['win_rate_pct']:.1f}%")
        
        # Save final report
        final_report = {
            'shutdown_time': datetime.now().isoformat(),
            'total_runtime': str(datetime.now() - self.start_time),
            'cycles_completed': self.cycles_completed,
            'orders_placed': self.orders_placed,
            'final_performance': final_performance
        }
        
        with open('data/autonomous_trading_final_report.json', 'w') as f:
            json.dump(final_report, f, indent=2, default=str)
        
        self.logger.info("✅ Shutdown complete")
    
    async def emergency_shutdown(self):
        """Emergency shutdown with position closure"""
        
        self.logger.error("🚨 EMERGENCY SHUTDOWN INITIATED")
        
        try:
            # Attempt to close all positions
            if self.ai_executor.active_positions:
                self.logger.info("🔄 Attempting to close all positions...")
                
                for symbol in list(self.ai_executor.active_positions.keys()):
                    try:
                        position = self.ai_executor.active_positions[symbol]
                        # This would implement emergency position closure
                        self.logger.info(f"⚠️ Emergency closure needed for {symbol}: {position['shares']} shares")
                    
                    except Exception as e:
                        self.logger.error(f"❌ Failed to close {symbol}: {e}")
        
        except Exception as e:
            self.logger.error(f"❌ Emergency shutdown error: {e}")
        
        finally:
            self.is_running = False
            self.logger.error("🛑 Emergency shutdown complete")

# Global autonomous trader instance
autonomous_trader = AutonomousTrader()

async def main():
    """Main function to start autonomous trading"""
    
    print("🤖 AUTONOMOUS AI TRADING SYSTEM")
    print("=" * 60)
    print("⚠️  WARNING: This will place real orders if exchange APIs are configured")
    print("🧪 Ensure you've tested with testnet/paper trading first")
    print("")
    
    response = input("Start autonomous trading? (yes/no): ").lower().strip()
    
    if response == 'yes':
        print("🚀 Starting autonomous trading...")
        await autonomous_trader.start_autonomous_trading()
    else:
        print("❌ Autonomous trading cancelled")

if __name__ == "__main__":
    asyncio.run(main())
