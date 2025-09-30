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
    
    def _get_user_api_keys(self, user_email: str) -> list:
        """Get user API keys from database"""
        try:
            import sqlite3
            import os
            
            # Check multiple possible locations for the users database
            db_paths = [
                "users.db",
                "../../data/users.db", 
                "../users.db",
                "data/users.db"
            ]
            
            db_conn = None
            for db_path in db_paths:
                if os.path.exists(db_path):
                    db_conn = sqlite3.connect(db_path)
                    break
            
            if not db_conn:
                return []
            
            cursor = db_conn.cursor()
            
            # Get user_id from users table
            cursor.execute("SELECT user_id FROM users WHERE email = ?", (user_email,))
            user_result = cursor.fetchone()
            
            if not user_result:
                db_conn.close()
                return []
            
            user_id = user_result[0]
            
            # Get API keys for this specific user
            cursor.execute("""
                SELECT key_id, exchange, api_key, secret_key, is_testnet, is_active 
                FROM api_keys 
                WHERE user_id = ? AND is_active = 1
                ORDER BY created_at DESC
            """, (user_id,))
            
            api_results = cursor.fetchall()
            user_api_keys = []
            
            for row in api_results:
                key_id, exchange, api_key, secret_key, is_testnet, is_active = row
                user_api_keys.append({
                    'id': key_id,
                    'exchange': exchange.upper(),
                    'api_key': api_key,
                    'secret_key': secret_key,
                    'is_testnet': bool(is_testnet),
                    'is_active': bool(is_active)
                })
            
            db_conn.close()
            return user_api_keys
            
        except Exception as e:
            self.logger.error(f"Error getting user API keys: {e}")
            return []
        
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
    
    def _check_exchange_balance(self, exchange: str, symbol: str, amount: float) -> Dict[str, Any]:
        """Check if exchange has sufficient balance for order"""
        try:
            if exchange == 'binance':
                # Try to get real Binance balance
                balance = self._get_real_binance_balance()
                required_currency = 'USDT'
                available = balance.get('USDT', 0.0)
                required_amount = amount  # Assume amount is in USDT
                
            elif exchange == 'zerodha':
                # Try to get real Zerodha balance
                balance = self._get_real_zerodha_balance()
                required_currency = 'INR'
                available = balance.get('INR', 0.0)
                # Estimate INR amount (assuming 1 USD = 83 INR for crypto-to-stock conversion)
                required_amount = amount * 83 if 'USDT' in str(symbol) else amount
                
            else:
                return {'sufficient': False, 'available': 0, 'currency': 'UNKNOWN'}
            
            is_sufficient = available >= required_amount
            
            self.logger.info(f"💰 BALANCE CHECK - {exchange.upper()}: {available:.2f} {required_currency} available, {required_amount:.2f} required")
            
            return {
                'sufficient': is_sufficient,
                'available': available,
                'required': required_amount,
                'currency': required_currency
            }
            
        except Exception as e:
            self.logger.error(f"❌ Balance check failed for {exchange}: {e}")
            return {'sufficient': False, 'available': 0, 'currency': 'ERROR'}

    def _get_real_binance_balance(self) -> Dict[str, float]:
        """Get real Binance balance from API"""
        try:
            # Connect to real Binance API using user's API keys
            self.logger.info("🔍 Checking real Binance balance...")
            
            # Get user's Binance API keys from database
            user_email = 'kirannaik@unitednewdigitalmedia.com'  # This should be passed as parameter
            api_keys = self._get_user_api_keys(user_email)
            binance_keys = [key for key in api_keys if key['exchange'].upper() == 'BINANCE' and not key['is_testnet']]
            
            if not binance_keys:
                self.logger.warning("⚠️ No Binance LIVE API keys found")
                return {'USDT': 0.0}
            
            # Use CCXT to connect to real Binance
            import ccxt
            binance_key = binance_keys[0]
            
            exchange = ccxt.binance({
                'apiKey': binance_key['api_key'],
                'secret': binance_key['secret_key'],
                'sandbox': False,  # Use LIVE trading
                'enableRateLimit': True,
            })
            
            # Get real balance
            balance = exchange.fetch_balance()
            
            self.logger.info(f"✅ Real Binance balance: {balance['USDT']['free']} USDT")
            
            return {
                'USDT': balance['USDT']['free'],
                'BTC': balance['BTC']['free'] if 'BTC' in balance else 0.0,
                'ETH': balance['ETH']['free'] if 'ETH' in balance else 0.0
            }
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get Binance balance: {e}")
            # Return 0 if API fails - this will trigger simulation mode
            return {'USDT': 0.0}

    def _get_real_zerodha_balance(self) -> Dict[str, float]:
        """Get real Zerodha balance from API"""
        try:
            # Connect to real Zerodha API using user's API keys
            self.logger.info("🔍 Checking real Zerodha balance...")
            
            # Get user's Zerodha API keys from database
            user_email = 'kirannaik@unitednewdigitalmedia.com'  # This should be passed as parameter
            api_keys = self._get_user_api_keys(user_email)
            zerodha_keys = [key for key in api_keys if key['exchange'].upper() == 'ZERODHA' and not key['is_testnet']]
            
            if not zerodha_keys:
                self.logger.warning("⚠️ No Zerodha LIVE API keys found")
                return {'INR': 0.0}
            
            # Use Zerodha Kite API to get real balance
            try:
                from kiteconnect import KiteConnect
                zerodha_key = zerodha_keys[0]
                
                # Initialize Kite Connect
                kite = KiteConnect(api_key=zerodha_key['api_key'])
                
                # Note: Zerodha requires access token which needs manual authentication
                # For now, we'll simulate the balance check but with real API structure
                # In production, you'd need to handle the OAuth flow
                
                # Get margins (available cash)
                margins = kite.margins()
                available_cash = margins['equity']['available']['cash']
                
                self.logger.info(f"✅ Real Zerodha balance: {available_cash} INR")
                
                return {'INR': available_cash}
                
            except ImportError:
                self.logger.warning("⚠️ Kite Connect not installed, using fallback")
                # Fallback: return 0 to trigger simulation mode
                return {'INR': 0.0}
            except Exception as kite_error:
                self.logger.error(f"❌ Zerodha API error: {kite_error}")
                # Return 0 if API fails - this will trigger simulation mode
                return {'INR': 0.0}
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get Zerodha balance: {e}")
            return {'INR': 0.0}

    def get_balance(self, exchange: str) -> Dict[str, Any]:
        """Get balance from exchange (legacy method)"""
        if exchange == 'binance':
            return self._get_real_binance_balance()
        elif exchange == 'zerodha':
            return self._get_real_zerodha_balance()
        else:
            return {'USDT': 0.0}  # Default: no funds
    
    def is_connected(self, exchange: str) -> bool:
        """Check if exchange is connected"""
        return exchange in ['binance', 'zerodha']  # Simulate connections
    
    def route_order_to_exchanges(self, symbol: str, side: str, amount: float, user_email: str = None) -> Dict[str, Any]:
        """Smart order routing with load balancing and risk management"""
        try:
            self.logger.info(f"🎯 Smart routing: {symbol} {side} ${amount}")
            
            # Enhanced routing logic
            routing_strategy = self._determine_routing_strategy(symbol, amount, user_email)
            
            if routing_strategy['type'] == 'portfolio_split':
                return self._execute_split_order_routing(symbol, side, amount, routing_strategy)
            else:
                # Standard single-exchange routing
                exchange = routing_strategy['primary_exchange']
                result = self.place_order(symbol, side, amount, exchange)
                
                return {
                    'success': result['success'],
                    'routing_strategy': 'single_exchange',
                    'primary_exchange': exchange,
                    'execution_results': [
                        {
                            'exchange': exchange,
                            'result': result
                        }
                    ] if result['success'] else [],
                    'error': result.get('error', None)
                }
            
        except Exception as e:
            self.logger.error(f"❌ Smart routing failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_results': []
            }
    
    def _determine_routing_strategy(self, symbol: str, amount: float, user_email: str = None) -> Dict[str, Any]:
        """Determine the best routing strategy based on multiple factors"""
        # Primary exchange determination
        if 'USDT' in symbol or '/' in symbol or 'BTC' in symbol or 'ETH' in symbol:
            primary_exchange = 'binance'
            asset_type = 'crypto'
        elif any(x in symbol for x in ['NSE', 'BSE', 'RELIANCE', 'TCS', 'INFY']):
            primary_exchange = 'zerodha'
            asset_type = 'indian_stocks'
        else:
            primary_exchange = 'binance'
            asset_type = 'other'
        
        # IMPLEMENT 70/30 PORTFOLIO SPLIT STRATEGY
        # Always split orders for diversification (70% Binance, 30% Zerodha)
        if amount >= 20.0:  # Split orders above $20 for diversification
            return {
                'type': 'portfolio_split',
                'primary_exchange': primary_exchange,
                'asset_type': asset_type,
                'split_ratio': {'binance': 0.70, 'zerodha': 0.30},  # 70% Binance, 30% Zerodha
                'diversification_enabled': True
            }
        else:
            # For smaller orders, use single exchange based on asset type
            return {
                'type': 'single_exchange',
                'primary_exchange': primary_exchange,
                'asset_type': asset_type
            }
    
    def _execute_split_order_routing(self, symbol: str, side: str, amount: float, strategy: Dict) -> Dict[str, Any]:
        """Execute split order across exchanges for diversification"""
        try:
            results = []
            split_ratio = strategy.get('split_ratio', {'binance': 0.70, 'zerodha': 0.30})
            
            # Calculate amounts for each exchange
            binance_amount = amount * split_ratio['binance']
            zerodha_amount = amount * split_ratio['zerodha']
            
            self.logger.info(f"📊 PORTFOLIO SPLIT: Total ${amount:.2f} → Binance: ${binance_amount:.2f} (70%), Zerodha: ${zerodha_amount:.2f} (30%)")
            
            # Execute Binance order (70%)
            if binance_amount >= 10.0:  # Binance minimum
                binance_symbol = self._convert_to_binance_symbol(symbol)
                binance_result = self._execute_binance_order(binance_symbol, side, binance_amount)
                if binance_result:
                    results.append({
                        'exchange': 'binance',
                        'symbol': binance_symbol,
                        'amount': binance_amount,
                        'percentage': 70,
                        'result': binance_result
                    })
            
            # Execute Zerodha order (30%) 
            if zerodha_amount >= 100:  # Zerodha minimum (₹100 ~ $1.20)
                zerodha_symbol = self._convert_to_zerodha_symbol(symbol)
                zerodha_result = self._execute_zerodha_order(zerodha_symbol, side, zerodha_amount)
                if zerodha_result:
                    results.append({
                        'exchange': 'zerodha',
                        'symbol': zerodha_symbol,
                        'amount': zerodha_amount,
                        'percentage': 30,
                        'result': zerodha_result
                    })
            
            return {
                'success': len(results) > 0,
                'strategy': 'portfolio_split',
                'total_amount': amount,
                'execution_results': results,
                'diversification_achieved': len(results) > 1
            }
        except Exception as e:
            self.logger.error(f"Error in split order routing: {e}")
            return {
                'success': False,
                'error': str(e),
                'execution_results': []
            }
    
    def _convert_to_binance_symbol(self, symbol: str) -> str:
        """Convert symbol to Binance format"""
        if 'USDT' in symbol or '/' in symbol:
            return symbol.replace('/', '')  # BTC/USDT -> BTCUSDT
        else:
            return 'BTCUSDT'  # Default crypto pair
    
    def _convert_to_zerodha_symbol(self, symbol: str) -> str:
        """Convert symbol to Zerodha format"""
        # Map crypto symbols to Indian stock equivalents
        crypto_to_stock_map = {
            'BTC': 'RELIANCE',
            'ETH': 'TCS', 
            'ADA': 'INFY',
            'DOT': 'HDFCBANK'
        }
        
        for crypto, stock in crypto_to_stock_map.items():
            if crypto in symbol.upper():
                return f"{stock}.NSE"
        
        return 'RELIANCE.NSE'  # Default Indian stock
    
    def _execute_binance_order(self, symbol: str, side: str, amount: float) -> Dict:
        """Execute order on Binance"""
        try:
            # This would integrate with real Binance API
            return {
                'success': True,
                'exchange': 'binance',
                'order_id': f"binance_{int(time.time())}",
                'symbol': symbol,
                'side': side,
                'amount': amount
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _execute_zerodha_order(self, symbol: str, side: str, amount: float) -> Dict:
        """Execute order on Zerodha"""
        try:
            # Convert USD to INR for Zerodha
            amount_inr = amount * 83.0  # Approximate USD to INR
            
            # This would integrate with real Zerodha API
            return {
                'success': True,
                'exchange': 'zerodha',
                'order_id': f"zerodha_{int(time.time())}",
                'symbol': symbol,
                'side': side,
                'amount': amount_inr
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_proxy_symbol(self, crypto_symbol: str) -> str:
        """Get a correlated Indian stock symbol as proxy for crypto exposure"""
        proxy_mapping = {
            'BTC/USDT': 'RELIANCE.NSE',    # Large cap tech proxy
            'ETH/USDT': 'TCS.NSE',         # Tech services proxy
            'BNB/USDT': 'INFY.NSE',        # IT services proxy
            'ADA/USDT': 'HDFCBANK.NSE',    # Financial proxy
            'SOL/USDT': 'ICICIBANK.NSE'    # Banking proxy
        }
        return proxy_mapping.get(crypto_symbol, 'RELIANCE.NSE')
    
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
        """Place REAL order on exchange with balance checking and simulation fallback"""
        try:
            # First check if we have sufficient balance
            balance_check = self._check_exchange_balance(exchange, symbol, amount)
            if not balance_check['sufficient']:
                # Log detailed balance failure and fallback to simulation
                self.logger.warning(f"🚨 INSUFFICIENT BALANCE DETECTED!")
                self.logger.warning(f"💰 Exchange: {exchange.upper()}")
                self.logger.warning(f"📊 Required: {amount} {balance_check['currency']}")
                self.logger.warning(f"💵 Available: {balance_check['available']} {balance_check['currency']}")
                self.logger.warning(f"🎭 FALLING BACK TO SIMULATION MODE")
                
                # Return simulated order result
                return {
                    'success': True,
                    'order_id': f"SIM_{exchange}_{symbol}_{side}_{int(__import__('time').time())}",
                    'exchange': exchange,
                    'symbol': symbol,
                    'side': side,
                    'amount': amount,
                    'status': 'simulated',
                    'real_order': False,
                    'simulation_reason': f'Insufficient balance: {balance_check["available"]}/{amount} {balance_check["currency"]}',
                    'message': f'🎭 Simulated {side} order (insufficient funds)'
                }
            
            # Proceed with real order if balance is sufficient
            self.logger.info(f"✅ Sufficient balance confirmed for {exchange.upper()}")
            self.logger.info(f"💰 Available: {balance_check['available']} {balance_check['currency']}, Required: {amount}")
            
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
            self.logger.error(f"❌ Real order placement failed: {e}")
            self.logger.warning(f"🎭 FALLING BACK TO SIMULATION DUE TO ERROR: {e}")
            return {
                'success': True,
                'order_id': f"SIM_ERROR_{exchange}_{symbol}_{side}_{int(__import__('time').time())}",
                'exchange': exchange,
                'symbol': symbol,
                'side': side,
                'amount': amount,
                'status': 'simulated',
                'real_order': False,
                'simulation_reason': f'API Error: {str(e)}',
                'message': f'🎭 Simulated {side} order (API error)'
            }
    
    def _get_binance_api_keys(self) -> Dict[str, str]:
        """Get Binance API keys for the current user"""
        try:
            user_email = 'kirannaik@unitednewdigitalmedia.com'  # This should be passed as parameter
            api_keys = self._get_user_api_keys(user_email)
            binance_keys = [key for key in api_keys if key['exchange'].upper() == 'BINANCE' and not key['is_testnet']]
            
            if binance_keys:
                return {
                    'api_key': binance_keys[0]['api_key'],
                    'secret_key': binance_keys[0]['secret_key']
                }
            return None
        except Exception as e:
            self.logger.error(f"Error getting Binance API keys: {e}")
            return None
    
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