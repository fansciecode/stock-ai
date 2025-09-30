#!/usr/bin/env python3
"""
AI Order Executor - Bridge between AI decisions and actual order execution
Converts AI predictions into real trading orders with risk management
"""

import sys
import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional
import json

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from training.live_data_trainer import LiveDataTrainer
from trading.exchange_connector import ExchangeConnector
from features.build_features import FeatureEngineer

class AIOrderExecutor:
    """Executes trades based on AI predictions with comprehensive risk management"""
    
    def __init__(self):
        self.ai_trainer = LiveDataTrainer()
        self.exchange_connector = ExchangeConnector()
        self.feature_engineer = FeatureEngineer()
        
        # Risk management parameters
        self.max_position_value = 1000  # Start small
        self.min_confidence = 0.7  # 70% minimum confidence
        self.max_daily_trades = 10
        self.stop_loss_pct = 0.02  # 2%
        self.take_profit_pct = 0.04  # 4%
        
        # Trading state
        self.daily_trades = 0
        self.active_positions = {}
        self.trade_history = []
        
        # Logging
        self.logger = self._setup_logging()
        
        # Performance tracking
        self.total_profit_loss = 0.0
        self.winning_trades = 0
        self.losing_trades = 0
    
    def _setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger(__name__)
    
    async def analyze_and_execute(self, symbol: str, market_data: pd.DataFrame, 
                                 exchange: str = 'binance') -> Dict:
        """Main function: Analyze market data and execute trades if conditions are met"""
        
        try:
            # Step 1: Get AI prediction
            prediction = self.ai_trainer.predict_action(symbol, market_data)
            
            self.logger.info(f"🤖 AI Analysis for {symbol}:")
            self.logger.info(f"   Action: {prediction['action']}")
            self.logger.info(f"   Confidence: {prediction['confidence']:.1%}")
            
            # Step 2: Risk checks
            if not self._risk_checks_passed(symbol, prediction):
                return {'status': 'skipped', 'reason': 'Risk checks failed', 'prediction': prediction}
            
            # Step 3: Execute order if confidence is high enough
            if prediction['confidence'] >= self.min_confidence:
                execution_result = await self._execute_ai_order(symbol, prediction, exchange, market_data)
                return execution_result
            else:
                return {'status': 'skipped', 'reason': f"Low confidence: {prediction['confidence']:.1%}", 'prediction': prediction}
        
        except Exception as e:
            self.logger.error(f"❌ Analysis/execution failed for {symbol}: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def _risk_checks_passed(self, symbol: str, prediction: Dict) -> bool:
        """Comprehensive risk management checks"""
        
        # Check 1: Daily trade limit
        if self.daily_trades >= self.max_daily_trades:
            self.logger.warning(f"⚠️ Daily trade limit reached: {self.daily_trades}")
            return False
        
        # Check 2: Minimum confidence
        if prediction['confidence'] < self.min_confidence:
            self.logger.warning(f"⚠️ Confidence too low: {prediction['confidence']:.1%}")
            return False
        
        # Check 3: Action validity
        if prediction['action'] not in ['buy', 'sell']:
            self.logger.warning(f"⚠️ Invalid action: {prediction['action']}")
            return False
        
        # Check 4: Existing position limits
        if symbol in self.active_positions and prediction['action'] == 'buy':
            current_value = self.active_positions[symbol]['value']
            if current_value > self.max_position_value:
                self.logger.warning(f"⚠️ Position limit exceeded for {symbol}: ${current_value}")
                return False
        
        return True
    
    async def _execute_ai_order(self, symbol: str, prediction: Dict, exchange: str, 
                               market_data: pd.DataFrame) -> Dict:
        """Execute the actual order based on AI prediction"""
        
        try:
            # Get current price
            current_price = float(market_data['close'].iloc[-1])
            
            # Calculate position size based on confidence and risk
            position_value = self._calculate_position_size(prediction['confidence'], current_price)
            shares = position_value / current_price
            
            action = prediction['action']
            
            self.logger.info(f"📊 Executing {action.upper()} order:")
            self.logger.info(f"   Symbol: {symbol}")
            self.logger.info(f"   Price: ${current_price:.2f}")
            self.logger.info(f"   Position Value: ${position_value:.2f}")
            self.logger.info(f"   Shares: {shares:.6f}")
            
            # Execute the order
            order_result = await self.exchange_connector.place_order(
                exchange_name=exchange,
                symbol=symbol,
                side=action,
                amount=shares,
                order_type='market'
            )
            
            if order_result['status'] == 'success':
                # Update positions and trade history
                await self._update_positions(symbol, action, shares, current_price, prediction, order_result)
                
                self.daily_trades += 1
                
                return {
                    'status': 'executed',
                    'action': action,
                    'symbol': symbol,
                    'shares': shares,
                    'price': current_price,
                    'confidence': prediction['confidence'],
                    'order_id': order_result['order_id'],
                    'exchange': exchange
                }
            else:
                self.logger.error(f"❌ Order execution failed: {order_result['message']}")
                return {'status': 'failed', 'message': order_result['message']}
        
        except Exception as e:
            self.logger.error(f"❌ Order execution error: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def _calculate_position_size(self, confidence: float, current_price: float) -> float:
        """Calculate position size based on confidence and risk parameters"""
        
        # Base position value
        base_value = self.max_position_value * 0.1  # Start with 10% of max
        
        # Scale by confidence (higher confidence = larger position)
        confidence_multiplier = min(confidence / self.min_confidence, 2.0)
        
        # Final position value
        position_value = base_value * confidence_multiplier
        
        # Ensure minimum viable trade size
        min_trade_value = 10  # $10 minimum
        position_value = max(position_value, min_trade_value)
        
        return position_value
    
    async def _update_positions(self, symbol: str, action: str, shares: float, 
                               price: float, prediction: Dict, order_result: Dict):
        """Update position tracking and trade history"""
        
        trade_record = {
            'timestamp': datetime.now().isoformat(),
            'symbol': symbol,
            'action': action,
            'shares': shares,
            'price': price,
            'value': shares * price,
            'confidence': prediction['confidence'],
            'order_id': order_result['order_id'],
            'exchange': order_result['exchange'],
            'ai_prediction': prediction
        }
        
        self.trade_history.append(trade_record)
        
        # Update positions
        if action == 'buy':
            if symbol in self.active_positions:
                # Add to existing position
                pos = self.active_positions[symbol]
                new_shares = pos['shares'] + shares
                new_value = pos['value'] + (shares * price)
                pos['shares'] = new_shares
                pos['avg_price'] = new_value / new_shares
                pos['value'] = new_value
            else:
                # New position
                self.active_positions[symbol] = {
                    'shares': shares,
                    'avg_price': price,
                    'value': shares * price,
                    'entry_time': datetime.now().isoformat()
                }
        
        elif action == 'sell':
            if symbol in self.active_positions:
                pos = self.active_positions[symbol]
                # Calculate P&L
                profit_loss = (price - pos['avg_price']) * min(shares, pos['shares'])
                self.total_profit_loss += profit_loss
                
                if profit_loss > 0:
                    self.winning_trades += 1
                else:
                    self.losing_trades += 1
                
                # Update position
                pos['shares'] -= shares
                if pos['shares'] <= 0:
                    del self.active_positions[symbol]
                else:
                    pos['value'] = pos['shares'] * pos['avg_price']
                
                trade_record['profit_loss'] = profit_loss
                
                self.logger.info(f"💰 P&L: ${profit_loss:+.2f}")
        
        # Save trade history
        self._save_trade_data()
    
    def _save_trade_data(self):
        """Save trading data to file"""
        
        data = {
            'timestamp': datetime.now().isoformat(),
            'active_positions': self.active_positions,
            'trade_history': self.trade_history[-50:],  # Keep last 50 trades
            'performance': {
                'total_profit_loss': self.total_profit_loss,
                'winning_trades': self.winning_trades,
                'losing_trades': self.losing_trades,
                'win_rate': self.winning_trades / max(self.winning_trades + self.losing_trades, 1) * 100,
                'daily_trades': self.daily_trades
            }
        }
        
        with open('data/ai_trading_results.json', 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    async def monitor_positions(self):
        """Monitor active positions for stop loss/take profit"""
        
        for symbol, position in list(self.active_positions.items()):
            try:
                # Get current market data for this symbol
                # This would normally come from your live data feed
                # For now, we'll skip this detailed implementation
                pass
            
            except Exception as e:
                self.logger.error(f"❌ Position monitoring error for {symbol}: {e}")
    
    def get_performance_summary(self) -> Dict:
        """Get current performance summary"""
        
        total_trades = self.winning_trades + self.losing_trades
        win_rate = (self.winning_trades / max(total_trades, 1)) * 100
        
        return {
            'total_profit_loss': self.total_profit_loss,
            'total_trades': total_trades,
            'winning_trades': self.winning_trades,
            'losing_trades': self.losing_trades,
            'win_rate_pct': win_rate,
            'daily_trades': self.daily_trades,
            'active_positions': len(self.active_positions),
            'active_position_details': self.active_positions
        }

# Global executor instance
ai_order_executor = AIOrderExecutor()

async def main():
    """Test AI order execution (demo mode)"""
    
    print("🤖 AI ORDER EXECUTION TEST")
    print("=" * 40)
    
    # This would normally get live market data
    # For testing, we'll create sample data
    import pandas as pd
    import numpy as np
    
    sample_data = pd.DataFrame({
        'ts': pd.date_range('2025-01-01', periods=50, freq='1H'),
        'open': 100 + np.random.randn(50).cumsum(),
        'high': 100 + np.random.randn(50).cumsum() + 1,
        'low': 100 + np.random.randn(50).cumsum() - 1,
        'close': 100 + np.random.randn(50).cumsum(),
        'volume': np.random.randint(1000, 10000, 50)
    })
    
    # Test AI analysis (won't execute real orders without API keys)
    result = await ai_order_executor.analyze_and_execute(
        symbol='BTC/USDT',
        market_data=sample_data,
        exchange='binance'
    )
    
    print(f"Result: {result}")
    
    # Show performance
    performance = ai_order_executor.get_performance_summary()
    print(f"Performance: {performance}")

if __name__ == "__main__":
    asyncio.run(main())
