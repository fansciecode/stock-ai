#!/usr/bin/env python3
"""
Paper Trading Bot - Safe testing environment for AI-driven order execution
Simulates real trading without risking actual money
"""

import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime, timedelta
import asyncio
import logging
from typing import Dict, List, Optional
import json
import time

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from training.live_data_trainer import LiveDataTrainer
from features.build_features import FeatureEngineer

class PaperTradingBot:
    """Paper trading bot for testing AI trading strategies without real money"""
    
    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.positions = {}  # {instrument: {'shares': int, 'avg_price': float, 'total_value': float}}
        self.trade_history = []
        self.performance_metrics = {}
        
        # Components
        self.trainer = LiveDataTrainer()
        self.feature_engineer = FeatureEngineer()
        
        # Settings
        self.max_position_size = 0.05  # 5% of portfolio per position
        self.min_confidence = 0.6  # Minimum confidence for trade execution
        self.stop_loss_pct = 0.02  # 2% stop loss
        self.take_profit_pct = 0.04  # 4% take profit
        
        # Logging
        self.logger = self._setup_logging()
        
        # Performance tracking
        self.start_time = datetime.now()
        self.last_portfolio_value = initial_capital
        
    def _setup_logging(self):
        """Setup logging for paper trading"""
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
    
    def get_portfolio_value(self, current_prices: Dict[str, float]) -> float:
        """Calculate current portfolio value"""
        
        total_value = self.current_capital
        
        for instrument, position in self.positions.items():
            if instrument in current_prices:
                position_value = position['shares'] * current_prices[instrument]
                total_value += position_value
        
        return total_value
    
    def calculate_position_size(self, price: float, confidence: float) -> int:
        """Calculate position size based on price and confidence"""
        
        # Base position size as percentage of portfolio
        base_allocation = self.max_position_size
        
        # Adjust based on confidence
        confidence_multiplier = min(confidence / self.min_confidence, 2.0)
        final_allocation = base_allocation * confidence_multiplier
        
        # Calculate shares
        portfolio_value = self.get_portfolio_value({})
        position_value = portfolio_value * final_allocation
        shares = int(position_value / price)
        
        # Ensure we have enough capital
        required_capital = shares * price
        if required_capital > self.current_capital:
            shares = int(self.current_capital / price)
        
        return max(shares, 0)
    
    def execute_buy_order(self, instrument: str, price: float, shares: int, confidence: float) -> Dict:
        """Execute a buy order in paper trading"""
        
        if shares <= 0:
            return {'status': 'rejected', 'reason': 'Invalid shares amount'}
        
        required_capital = shares * price
        
        if required_capital > self.current_capital:
            return {'status': 'rejected', 'reason': 'Insufficient capital'}
        
        # Execute the trade
        self.current_capital -= required_capital
        
        if instrument in self.positions:
            # Add to existing position
            old_shares = self.positions[instrument]['shares']
            old_value = self.positions[instrument]['total_value']
            
            new_shares = old_shares + shares
            new_value = old_value + required_capital
            
            self.positions[instrument] = {
                'shares': new_shares,
                'avg_price': new_value / new_shares,
                'total_value': new_value
            }
        else:
            # Create new position
            self.positions[instrument] = {
                'shares': shares,
                'avg_price': price,
                'total_value': required_capital
            }
        
        # Record trade
        trade = {
            'timestamp': datetime.now().isoformat(),
            'instrument': instrument,
            'action': 'buy',
            'shares': shares,
            'price': price,
            'total_value': required_capital,
            'confidence': confidence,
            'portfolio_value_before': self.last_portfolio_value,
            'capital_remaining': self.current_capital
        }
        
        self.trade_history.append(trade)
        
        self.logger.info(f"📈 BUY: {shares} shares of {instrument} at ${price:.2f} (Confidence: {confidence:.1%})")
        
        return {'status': 'filled', 'trade': trade}
    
    def execute_sell_order(self, instrument: str, price: float, shares: int, confidence: float) -> Dict:
        """Execute a sell order in paper trading"""
        
        if instrument not in self.positions:
            return {'status': 'rejected', 'reason': 'No position to sell'}
        
        available_shares = self.positions[instrument]['shares']
        
        if shares > available_shares:
            shares = available_shares  # Sell all available shares
        
        if shares <= 0:
            return {'status': 'rejected', 'reason': 'No shares to sell'}
        
        # Execute the trade
        sale_value = shares * price
        self.current_capital += sale_value
        
        # Calculate profit/loss
        avg_buy_price = self.positions[instrument]['avg_price']
        profit_loss = (price - avg_buy_price) * shares
        profit_loss_pct = (price - avg_buy_price) / avg_buy_price * 100
        
        # Update position
        remaining_shares = available_shares - shares
        if remaining_shares > 0:
            # Partial sale
            remaining_value = remaining_shares * avg_buy_price
            self.positions[instrument] = {
                'shares': remaining_shares,
                'avg_price': avg_buy_price,
                'total_value': remaining_value
            }
        else:
            # Complete sale
            del self.positions[instrument]
        
        # Record trade
        trade = {
            'timestamp': datetime.now().isoformat(),
            'instrument': instrument,
            'action': 'sell',
            'shares': shares,
            'price': price,
            'total_value': sale_value,
            'confidence': confidence,
            'profit_loss': profit_loss,
            'profit_loss_pct': profit_loss_pct,
            'avg_buy_price': avg_buy_price,
            'portfolio_value_before': self.last_portfolio_value,
            'capital_remaining': self.current_capital
        }
        
        self.trade_history.append(trade)
        
        self.logger.info(f"📉 SELL: {shares} shares of {instrument} at ${price:.2f} "
                        f"(P&L: ${profit_loss:+.2f}, {profit_loss_pct:+.1f}%)")
        
        return {'status': 'filled', 'trade': trade}
    
    def check_stop_loss_take_profit(self, current_prices: Dict[str, float]) -> List[Dict]:
        """Check and execute stop loss or take profit orders"""
        
        orders_executed = []
        
        for instrument, position in list(self.positions.items()):
            if instrument not in current_prices:
                continue
            
            current_price = current_prices[instrument]
            avg_price = position['avg_price']
            shares = position['shares']
            
            # Calculate current P&L percentage
            pnl_pct = (current_price - avg_price) / avg_price
            
            should_sell = False
            reason = ""
            
            # Check stop loss
            if pnl_pct <= -self.stop_loss_pct:
                should_sell = True
                reason = f"Stop Loss (-{abs(pnl_pct)*100:.1f}%)"
            
            # Check take profit
            elif pnl_pct >= self.take_profit_pct:
                should_sell = True
                reason = f"Take Profit (+{pnl_pct*100:.1f}%)"
            
            if should_sell:
                result = self.execute_sell_order(instrument, current_price, shares, 1.0)
                if result['status'] == 'filled':
                    result['trade']['reason'] = reason
                    orders_executed.append(result['trade'])
                    self.logger.info(f"🛡️ {reason}: {instrument}")
        
        return orders_executed
    
    def make_trading_decision(self, instrument: str, current_data: pd.DataFrame, current_price: float) -> Optional[Dict]:
        """Make trading decision using AI models"""
        
        try:
            # Get AI prediction
            prediction = self.trainer.predict_action(instrument, current_data)
            
            if prediction['confidence'] < self.min_confidence:
                return None
            
            action = prediction['action']
            confidence = prediction['confidence']
            
            if action == 'buy':
                # Check if we already have a large position
                if instrument in self.positions:
                    current_position_value = self.positions[instrument]['shares'] * current_price
                    portfolio_value = self.get_portfolio_value({instrument: current_price})
                    position_pct = current_position_value / portfolio_value
                    
                    if position_pct > self.max_position_size * 1.5:  # Already have 1.5x max position
                        return None
                
                shares = self.calculate_position_size(current_price, confidence)
                if shares > 0:
                    return {
                        'action': 'buy',
                        'instrument': instrument,
                        'price': current_price,
                        'shares': shares,
                        'confidence': confidence,
                        'prediction': prediction
                    }
            
            elif action == 'sell':
                # Only sell if we have a position
                if instrument in self.positions:
                    shares = self.positions[instrument]['shares']
                    # Sell partial position based on confidence
                    sell_shares = int(shares * min(confidence, 1.0))
                    if sell_shares > 0:
                        return {
                            'action': 'sell',
                            'instrument': instrument,
                            'price': current_price,
                            'shares': sell_shares,
                            'confidence': confidence,
                            'prediction': prediction
                        }
            
            return None
        
        except Exception as e:
            self.logger.error(f"Decision making error for {instrument}: {e}")
            return None
    
    def get_current_market_data(self) -> Dict[str, pd.DataFrame]:
        """Get current market data for analysis"""
        
        market_data = {}
        
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
                        for instrument in df['instrument'].unique():
                            instrument_data = df[df['instrument'] == instrument].copy()
                            instrument_data = instrument_data.sort_values('ts')
                            
                            # Get recent data (last 100 points)
                            if len(instrument_data) >= 50:
                                market_data[instrument] = instrument_data.tail(100)
                
                except Exception as e:
                    self.logger.error(f"Error loading market data: {e}")
        
        return market_data
    
    def calculate_performance_metrics(self, current_prices: Dict[str, float]) -> Dict:
        """Calculate performance metrics"""
        
        current_portfolio_value = self.get_portfolio_value(current_prices)
        
        # Basic metrics
        total_return = current_portfolio_value - self.initial_capital
        total_return_pct = (total_return / self.initial_capital) * 100
        
        # Time-based metrics
        time_elapsed = datetime.now() - self.start_time
        days_elapsed = time_elapsed.total_seconds() / (24 * 3600)
        
        if days_elapsed > 0:
            annualized_return = (total_return_pct / days_elapsed) * 365
        else:
            annualized_return = 0
        
        # Trade analysis
        if self.trade_history:
            winning_trades = [t for t in self.trade_history 
                            if t['action'] == 'sell' and t.get('profit_loss', 0) > 0]
            losing_trades = [t for t in self.trade_history 
                           if t['action'] == 'sell' and t.get('profit_loss', 0) < 0]
            
            win_rate = len(winning_trades) / len([t for t in self.trade_history if t['action'] == 'sell']) * 100 if self.trade_history else 0
            
            avg_win = np.mean([t['profit_loss'] for t in winning_trades]) if winning_trades else 0
            avg_loss = np.mean([t['profit_loss'] for t in losing_trades]) if losing_trades else 0
            
            profit_factor = abs(avg_win / avg_loss) if avg_loss != 0 else float('inf')
        else:
            win_rate = 0
            avg_win = 0
            avg_loss = 0
            profit_factor = 0
        
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'initial_capital': self.initial_capital,
            'current_portfolio_value': current_portfolio_value,
            'cash_remaining': self.current_capital,
            'total_return': total_return,
            'total_return_pct': total_return_pct,
            'annualized_return_pct': annualized_return,
            'days_trading': days_elapsed,
            'total_trades': len(self.trade_history),
            'active_positions': len(self.positions),
            'win_rate_pct': win_rate,
            'avg_win': avg_win,
            'avg_loss': avg_loss,
            'profit_factor': profit_factor,
            'positions': dict(self.positions),
            'recent_trades': self.trade_history[-10:] if self.trade_history else []
        }
        
        return metrics
    
    async def run_trading_session(self, duration_hours: float = 24.0):
        """Run a paper trading session"""
        
        self.logger.info("🚀 STARTING PAPER TRADING SESSION")
        self.logger.info("=" * 60)
        self.logger.info(f"💰 Initial Capital: ${self.initial_capital:,.2f}")
        self.logger.info(f"⏰ Duration: {duration_hours} hours")
        self.logger.info(f"📊 Max Position Size: {self.max_position_size*100:.1f}%")
        self.logger.info(f"🎯 Min Confidence: {self.min_confidence*100:.1f}%")
        
        end_time = datetime.now() + timedelta(hours=duration_hours)
        iteration = 0
        
        while datetime.now() < end_time:
            try:
                iteration += 1
                self.logger.info(f"\n🔄 Trading Iteration {iteration}")
                
                # Get current market data
                market_data = self.get_current_market_data()
                
                if not market_data:
                    self.logger.warning("No market data available")
                    await asyncio.sleep(60)
                    continue
                
                # Get current prices
                current_prices = {}
                for instrument, data in market_data.items():
                    if not data.empty:
                        current_prices[instrument] = float(data['close'].iloc[-1])
                
                # Check stop loss / take profit
                sl_tp_orders = self.check_stop_loss_take_profit(current_prices)
                
                # Make trading decisions for each instrument
                for instrument, data in market_data.items():
                    if instrument in current_prices:
                        current_price = current_prices[instrument]
                        
                        decision = self.make_trading_decision(instrument, data, current_price)
                        
                        if decision:
                            if decision['action'] == 'buy':
                                result = self.execute_buy_order(
                                    decision['instrument'],
                                    decision['price'],
                                    decision['shares'],
                                    decision['confidence']
                                )
                            elif decision['action'] == 'sell':
                                result = self.execute_sell_order(
                                    decision['instrument'],
                                    decision['price'],
                                    decision['shares'],
                                    decision['confidence']
                                )
                
                # Calculate and display performance
                metrics = self.calculate_performance_metrics(current_prices)
                self.last_portfolio_value = metrics['current_portfolio_value']
                
                self.logger.info(f"💼 Portfolio Value: ${metrics['current_portfolio_value']:,.2f}")
                self.logger.info(f"📈 Total Return: ${metrics['total_return']:+,.2f} ({metrics['total_return_pct']:+.2f}%)")
                self.logger.info(f"🏆 Active Positions: {metrics['active_positions']}")
                self.logger.info(f"📊 Total Trades: {metrics['total_trades']}")
                
                # Save performance data
                with open('data/paper_trading_performance.json', 'w') as f:
                    json.dump(metrics, f, indent=2, default=str)
                
                # Wait before next iteration
                await asyncio.sleep(60)  # 1 minute intervals
                
            except Exception as e:
                self.logger.error(f"Trading session error: {e}")
                await asyncio.sleep(30)
        
        # Final performance report
        final_metrics = self.calculate_performance_metrics(current_prices)
        
        self.logger.info("\n📊 FINAL PERFORMANCE REPORT")
        self.logger.info("=" * 60)
        self.logger.info(f"💰 Initial Capital: ${self.initial_capital:,.2f}")
        self.logger.info(f"💼 Final Portfolio: ${final_metrics['current_portfolio_value']:,.2f}")
        self.logger.info(f"📈 Total Return: ${final_metrics['total_return']:+,.2f} ({final_metrics['total_return_pct']:+.2f}%)")
        self.logger.info(f"📊 Total Trades: {final_metrics['total_trades']}")
        self.logger.info(f"🎯 Win Rate: {final_metrics['win_rate_pct']:.1f}%")
        self.logger.info(f"⚖️ Profit Factor: {final_metrics['profit_factor']:.2f}")
        
        # Save final results
        with open('data/paper_trading_final_results.json', 'w') as f:
            json.dump(final_metrics, f, indent=2, default=str)
        
        return final_metrics

async def main():
    """Main function to run paper trading"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description='Paper Trading Bot')
    parser.add_argument('--capital', type=float, default=100000, help='Initial capital')
    parser.add_argument('--hours', type=float, default=24.0, help='Trading session duration in hours')
    parser.add_argument('--max-position', type=float, default=0.05, help='Maximum position size as percentage')
    
    args = parser.parse_args()
    
    bot = PaperTradingBot(initial_capital=args.capital)
    bot.max_position_size = args.max_position
    
    await bot.run_trading_session(duration_hours=args.hours)

if __name__ == "__main__":
    asyncio.run(main())
