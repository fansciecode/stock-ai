#!/usr/bin/env python3
"""
🔴 REAL ORDER MANAGER
Actually places real orders on exchanges (not simulation)
"""

import logging
import ccxt
import sqlite3
from typing import Dict, Any, Optional

class RealOrderManager:
    """Real order manager that actually places orders"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.exchanges = {}
        
    def get_live_api_keys(self, user_email: str, exchange: str):
        """Get live API keys for user and exchange"""
        try:
            db_path = 'src/web_interface/users.db'
            
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                
                # Get user ID
                cursor.execute('SELECT user_id FROM users WHERE email = ?', (user_email,))
                user_result = cursor.fetchone()
                
                if not user_result:
                    return None
                
                user_id = user_result[0]
                
                # Get live API keys
                cursor.execute("""
                    SELECT api_key, secret_key FROM api_keys 
                    WHERE user_id = ? AND exchange = ? AND is_testnet = 0 AND is_active = 1
                    LIMIT 1
                """, (user_id, exchange))
                
                key_result = cursor.fetchone()
                
                if key_result:
                    return {
                        'api_key': key_result[0],
                        'secret_key': key_result[1]
                    }
                
                return None
                
        except Exception as e:
            self.logger.error(f"Error getting API keys: {e}")
            return None
    
    def place_real_order(self, user_email: str, symbol: str, side: str, amount: float) -> Dict[str, Any]:
        """Place a REAL order on the exchange"""
        try:
            # Determine exchange
            if 'USDT' in symbol or '/' in symbol:
                exchange_name = 'binance'
            elif any(x in symbol for x in ['NSE', 'BSE']):
                exchange_name = 'zerodha'
            else:
                exchange_name = 'binance'
            
            # Get API keys
            keys = self.get_live_api_keys(user_email, exchange_name)
            if not keys:
                return {
                    'success': False,
                    'error': f'No live {exchange_name} API keys found'
                }
            
            if exchange_name == 'binance':
                return self._place_binance_order(keys, symbol, side, amount)
            elif exchange_name == 'zerodha':
                return self._place_zerodha_order(keys, symbol, side, amount)
            else:
                return {
                    'success': False,
                    'error': f'Exchange {exchange_name} not supported'
                }
                
        except Exception as e:
            self.logger.error(f"Real order placement failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _place_binance_order(self, keys: Dict, symbol: str, side: str, amount: float) -> Dict[str, Any]:
        """Place real order on Binance"""
        try:
            # Create live Binance client
            binance = ccxt.binance({
                'apiKey': keys['api_key'],
                'secret': keys['secret_key'],
                'sandbox': False,  # LIVE trading
                'enableRateLimit': True
            })
            
            # Get current price
            ticker = binance.fetch_ticker(symbol)
            current_price = ticker['last']
            
            # Calculate quantity
            quantity = amount / current_price
            
            # Place market order
            if side.upper() == 'BUY':
                order = binance.create_market_buy_order(symbol, quantity)
            else:
                order = binance.create_market_sell_order(symbol, quantity)
            
            self.logger.info(f"🔴 REAL BINANCE ORDER: {side} {quantity:.8f} {symbol} @ ${current_price:.2f}")
            
            return {
                'success': True,
                'order_id': order['id'],
                'symbol': order['symbol'],
                'side': order['side'],
                'amount': order['amount'],
                'price': current_price,
                'status': order['status'],
                'exchange': 'binance',
                'timestamp': order['datetime'],
                'real_order': True
            }
            
        except Exception as e:
            self.logger.error(f"Binance order failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _place_zerodha_order(self, keys: Dict, symbol: str, side: str, amount: float) -> Dict[str, Any]:
        """Place real order on Zerodha (placeholder)"""
        # Zerodha integration would go here
        return {
            'success': False,
            'error': 'Zerodha integration not yet implemented'
        }

# Global instance
real_order_manager = RealOrderManager()
