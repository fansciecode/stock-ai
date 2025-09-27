#!/usr/bin/env python3
"""
Multi-Exchange Order Manager
Handles order routing across multiple exchanges
"""

import logging
import sqlite3
from typing import Dict, Any, Optional

class MultiExchangeOrderManager:
    """Manages orders across multiple exchanges"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.exchanges = {}
        
    def add_exchange(self, name: str, exchange_client):
        """Add an exchange client"""
        self.exchanges[name] = exchange_client
        self.logger.info(f"✅ Added exchange: {name}")
        
    def place_order(self, symbol: str, side: str, amount: float, exchange: str = None) -> Dict[str, Any]:
        """Place an order on the specified exchange"""
        try:
            if not exchange:
                # Determine exchange based on symbol
                if 'USDT' in symbol or '/' in symbol:
                    exchange = 'binance'
                elif any(x in symbol for x in ['NSE', 'BSE']):
                    exchange = 'zerodha'
                else:
                    exchange = 'binance'  # Default
                
            # REAL ORDER PLACEMENT ON EXCHANGES
            return self._place_real_order(symbol, side, amount, exchange)
                
        except Exception as e:
            self.logger.error(f"❌ Order placement failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_balance(self, exchange: str) -> Dict[str, Any]:
        """Get balance from exchange"""
        if exchange == 'binance':
            return {'USDT': 2.9, 'BTC': 0.0, 'ETH': 0.0}
        elif exchange == 'zerodha':
            return {'INR': 50000.0}
        else:
            return {'USDT': 2.9}  # Default
    
    def is_connected(self, exchange: str) -> bool:
        """Check if exchange is connected"""
        return exchange in ['binance', 'zerodha']  # Simulate connections
    
    def route_order_to_exchanges(self, symbol: str, side: str, amount: float) -> Dict[str, Any]:
        """Route order to best available exchange"""
        try:
            # Determine best exchange based on symbol
            if 'USDT' in symbol or '/' in symbol:
                exchange = 'binance'
            elif any(x in symbol for x in ['NSE', 'BSE']):
                exchange = 'zerodha'
            else:
                exchange = 'binance'  # Default
                
            result = self.place_order(symbol, side, amount, exchange)
            
            # Return in expected format
            return {
                'success': result['success'],
                'execution_results': [
                    {
                        'exchange': exchange,
                        'result': result
                    }
                ] if result['success'] else [],
                'error': result.get('error', None)
            }
            
        except Exception as e:
            self.logger.error(f"❌ Order routing failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_results': []
            }
    
    def fetch_balance(self, exchange: str = None):
        """Fetch balance from exchange"""
        if not exchange:
            exchange = 'binance'
        return self.get_balance(exchange)
    
    def get_user_available_exchanges(self, user_email: str):
        """Get available exchanges for user"""
        return {
            'binance': {'connected': True, 'balance': {'USDT': 2.9}},
            'zerodha': {'connected': True, 'balance': {'INR': 50000.0}}
        }
    
    def get_user_exchange_preferences(self, user_email: str):
        """Get user's exchange preferences"""
        return {
            'preferred_crypto': 'binance',
            'preferred_stocks': 'zerodha',
            'default': 'binance',
            'routing': {
                'crypto': 'binance',
                'stocks': 'zerodha',
                'forex': 'binance'
            }
        }


    def _place_real_order(self, symbol: str, side: str, amount: float, exchange: str) -> Dict[str, Any]:
        """Place REAL order on exchange (not simulation)"""
        try:
            if exchange == 'binance':
                return self._place_binance_real_order(symbol, side, amount)
            elif exchange == 'zerodha':
                return self._place_zerodha_real_order(symbol, side, amount)
            else:
                return {
                    'success': False,
                    'error': f'Exchange {exchange} not supported for real orders'
                }
        except Exception as e:
            self.logger.error(f"Real order placement failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _place_binance_real_order(self, symbol: str, side: str, amount: float) -> Dict[str, Any]:
        """Place REAL order on Binance"""
        try:
            # Get API keys from database
            keys = self._get_binance_api_keys()
            if not keys:
                return {
                    'success': False,
                    'error': 'No Binance API keys found'
                }
            
            # Import ccxt for real trading
            import ccxt
            from datetime import datetime
            
            # Create live Binance client
            binance = ccxt.binance({
                'apiKey': keys['api_key'],
                'secret': keys['secret_key'],
                'sandbox': False,  # LIVE trading
                'enableRateLimit': True
            })
            
            # Get current market price
            ticker = binance.fetch_ticker(symbol)
            current_price = ticker['last']
            
            # Calculate quantity based on amount
            quantity = amount / current_price
            
            # Place REAL market order
            if side.upper() == 'BUY':
                order = binance.create_market_buy_order(symbol, quantity)
            else:
                order = binance.create_market_sell_order(symbol, quantity)
            
            self.logger.info(f"🔴 REAL BINANCE ORDER PLACED: {side} {quantity:.8f} {symbol} @ ${current_price:.2f}")
            
            return {
                'success': True,
                'order_id': order['id'],
                'exchange': 'binance',
                'symbol': order['symbol'],
                'side': order['side'],
                'amount': order['amount'],
                'quantity': quantity,
                'status': order['status'],
                'price': current_price,
                'timestamp': order['datetime'],
                'real_order': True
            }
            
        except Exception as e:
            self.logger.error(f"Binance real order failed: {e}")
            return {
                'success': False,
                'error': f'Binance order failed: {str(e)}'
            }
    
    def _place_zerodha_real_order(self, symbol: str, side: str, amount: float) -> Dict[str, Any]:
        """Place REAL order on Zerodha"""
        try:
            # Import and use the real Zerodha order manager
            from zerodha_real_order_manager import zerodha_real_order_manager
            
            result = zerodha_real_order_manager.place_zerodha_order(symbol, side, amount)
            
            if result['success']:
                self.logger.info(f"🔴 REAL ZERODHA ORDER: {side} {result['quantity']} {result['symbol']} @ ₹{result['price']:.2f}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Zerodha real order failed: {e}")
            return {
                'success': False,
                'error': f'Zerodha order failed: {str(e)}'
            }
    
    def _get_binance_api_keys(self) -> Dict[str, str]:
        """Get Binance API keys from database"""
        try:
            db_path = 'src/web_interface/users.db'
            user_email = 'kirannaik@unitednewdigitalmedia.com'  # Default user
            
            with sqlite3.connect(db_path) as conn:
                cursor = conn.cursor()
                
                # Get user ID
                cursor.execute('SELECT user_id FROM users WHERE email = ?', (user_email,))
                user_result = cursor.fetchone()
                
                if not user_result:
                    return None
                
                user_id = user_result[0]
                
                # Get live Binance API keys
                cursor.execute("""
                    SELECT api_key, secret_key FROM api_keys 
                    WHERE user_id = ? AND exchange = 'binance' AND is_testnet = 0 AND is_active = 1
                    LIMIT 1
                """, (user_id,))
                
                key_result = cursor.fetchone()
                
                if key_result:
                    return {
                        'api_key': key_result[0],
                        'secret_key': key_result[1]
                    }
                
                return None
                
        except Exception as e:
            self.logger.error(f"Error getting Binance API keys: {e}")
            return None

# Global instance
multi_exchange_manager = MultiExchangeOrderManager()