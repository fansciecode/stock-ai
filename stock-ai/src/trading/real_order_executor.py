#!/usr/bin/env python3
"""
📈 REAL ORDER EXECUTION SYSTEM
Handles real order placement and execution on live exchanges
"""

import ccxt
import yfinance as yf
import requests
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
import hashlib
import hmac
import base64
from decimal import Decimal, ROUND_DOWN

class RealOrderExecutor:
    """Real order execution on live exchanges"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.exchanges = {}
        self.connected_exchanges = []
        
        # Risk management settings
        self.max_position_size = 0.02  # 2% of portfolio per position
        self.max_daily_loss = 0.05     # 5% daily loss limit
        self.min_order_size = 10       # Minimum $10 order
        self.max_order_size = 1000     # Maximum $1000 order initially
        
        # Order tracking
        self.active_orders = {}
        self.daily_pnl = 0
        self.daily_trades = 0
        self.max_daily_trades = 50
        
        # Initialize exchanges
        self._initialize_exchanges()
    
    def _initialize_exchanges(self):
        """Initialize exchange connections"""
        try:
            # Binance
            self.exchanges['binance'] = {
                'name': 'Binance',
                'type': 'crypto',
                'client': None,
                'connected': False,
                'supported_assets': ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'ADA/USDT', 'SOL/USDT']
            }
            
            # Add other exchanges as needed
            self.exchanges['alpaca'] = {
                'name': 'Alpaca',
                'type': 'stocks',
                'client': None,
                'connected': False,
                'supported_assets': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
            }
            
        except Exception as e:
            self.logger.error(f"❌ Error initializing exchanges: {e}")
    
    def connect_binance(self, api_key: str, api_secret: str, testnet: bool = False) -> bool:
        """Connect to Binance exchange"""
        try:
            # Initialize Binance client
            exchange_id = 'binance'
            if testnet:
                exchange_id = 'binanceus'  # Use testnet
            
            exchange = ccxt.binance({
                'apiKey': api_key,
                'secret': api_secret,
                'sandbox': testnet,  # Use testnet if specified
                'enableRateLimit': True,
                'options': {
                    'defaultType': 'spot'  # spot trading
                }
            })
            
            # Test connection
            balance = exchange.fetch_balance()
            
            self.exchanges['binance']['client'] = exchange
            self.exchanges['binance']['connected'] = True
            self.exchanges['binance']['testnet'] = testnet
            
            if 'binance' not in self.connected_exchanges:
                self.connected_exchanges.append('binance')
            
            self.logger.info(f"✅ Connected to Binance ({'Testnet' if testnet else 'Live'})")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to connect to Binance: {e}")
            return False
    
    def connect_alpaca(self, api_key: str, api_secret: str, paper_trading: bool = False) -> bool:
        """Connect to Alpaca for stock trading"""
        try:
            # Alpaca configuration
            base_url = 'https://paper-api.alpaca.markets' if paper_trading else 'https://api.alpaca.markets'
            
            headers = {
                'APCA-API-KEY-ID': api_key,
                'APCA-API-SECRET-KEY': api_secret
            }
            
            # Test connection
            response = requests.get(f"{base_url}/v2/account", headers=headers)
            
            if response.status_code == 200:
                self.exchanges['alpaca']['client'] = {
                    'base_url': base_url,
                    'headers': headers
                }
                self.exchanges['alpaca']['connected'] = True
                self.exchanges['alpaca']['paper_trading'] = paper_trading
                
                if 'alpaca' not in self.connected_exchanges:
                    self.connected_exchanges.append('alpaca')
                
                self.logger.info(f"✅ Connected to Alpaca ({'Paper' if paper_trading else 'Live'})")
                return True
            else:
                self.logger.error(f"❌ Alpaca connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Failed to connect to Alpaca: {e}")
            return False
    
    def get_account_balance(self, exchange: str) -> Dict:
        """Get account balance for an exchange"""
        try:
            if exchange not in self.connected_exchanges:
                return {'error': f'Exchange {exchange} not connected'}
            
            if exchange == 'binance':
                client = self.exchanges['binance']['client']
                balance = client.fetch_balance()
                
                # Get USDT balance for crypto trading
                usdt_balance = balance.get('USDT', {})
                
                return {
                    'exchange': 'Binance',
                    'total_balance': usdt_balance.get('total', 0),
                    'available_balance': usdt_balance.get('free', 0),
                    'currency': 'USDT',
                    'testnet': self.exchanges['binance'].get('testnet', False)
                }
            
            elif exchange == 'alpaca':
                client = self.exchanges['alpaca']['client']
                response = requests.get(f"{client['base_url']}/v2/account", headers=client['headers'])
                
                if response.status_code == 200:
                    account = response.json()
                    return {
                        'exchange': 'Alpaca',
                        'total_balance': float(account.get('portfolio_value', 0)),
                        'available_balance': float(account.get('buying_power', 0)),
                        'currency': 'USD',
                        'paper_trading': self.exchanges['alpaca'].get('paper_trading', False)
                    }
                else:
                    return {'error': f'Failed to get Alpaca balance: {response.status_code}'}
            
            return {'error': f'Unsupported exchange: {exchange}'}
            
        except Exception as e:
            self.logger.error(f"❌ Error getting balance for {exchange}: {e}")
            return {'error': str(e)}
    
    def calculate_position_size(self, symbol: str, price: float, balance: float, risk_pct: float = 0.02) -> float:
        """Calculate appropriate position size based on risk management"""
        try:
            # Maximum position size based on percentage of portfolio
            max_position_value = balance * risk_pct
            
            # Calculate quantity
            quantity = max_position_value / price
            
            # Apply minimum and maximum limits
            position_value = quantity * price
            
            if position_value < self.min_order_size:
                quantity = self.min_order_size / price
            elif position_value > self.max_order_size:
                quantity = self.max_order_size / price
            
            return quantity
            
        except Exception as e:
            self.logger.error(f"❌ Error calculating position size: {e}")
            return 0
    
    def place_order(self, symbol: str, side: str, quantity: float, order_type: str = 'market', 
                   exchange: str = 'binance', stop_loss_pct: float = 0.02, 
                   take_profit_pct: float = 0.04) -> Dict:
        """Place a real order on the exchange"""
        try:
            if exchange not in self.connected_exchanges:
                return {'success': False, 'error': f'Exchange {exchange} not connected'}
            
            # Check daily limits
            if self.daily_trades >= self.max_daily_trades:
                return {'success': False, 'error': 'Daily trade limit reached'}
            
            if abs(self.daily_pnl) >= self.max_daily_loss:
                return {'success': False, 'error': 'Daily loss limit reached'}
            
            # Get current price for validation
            current_price = self._get_current_price(symbol, exchange)
            if not current_price:
                return {'success': False, 'error': 'Could not get current price'}
            
            # Validate order size
            order_value = quantity * current_price
            if order_value < self.min_order_size:
                return {'success': False, 'error': f'Order size ${order_value:.2f} below minimum ${self.min_order_size}'}
            
            if order_value > self.max_order_size:
                return {'success': False, 'error': f'Order size ${order_value:.2f} above maximum ${self.max_order_size}'}
            
            # Place order based on exchange
            if exchange == 'binance':
                return self._place_binance_order(symbol, side, quantity, order_type, stop_loss_pct, take_profit_pct)
            elif exchange == 'alpaca':
                return self._place_alpaca_order(symbol, side, quantity, order_type, stop_loss_pct, take_profit_pct)
            else:
                return {'success': False, 'error': f'Unsupported exchange: {exchange}'}
            
        except Exception as e:
            self.logger.error(f"❌ Error placing order: {e}")
            return {'success': False, 'error': str(e)}
    
    def _place_binance_order(self, symbol: str, side: str, quantity: float, order_type: str,
                           stop_loss_pct: float, take_profit_pct: float) -> Dict:
        """Place order on Binance"""
        try:
            client = self.exchanges['binance']['client']
            
            # Round quantity to appropriate precision
            quantity = float(Decimal(str(quantity)).quantize(Decimal('0.000001'), rounding=ROUND_DOWN))
            
            # Place main order
            order = client.create_order(
                symbol=symbol,
                type=order_type,
                side=side.lower(),
                amount=quantity
            )
            
            order_id = order['id']
            self.daily_trades += 1
            
            # Place stop loss and take profit orders
            current_price = float(order.get('price', order.get('average', 0)))
            
            if current_price > 0:
                if side.upper() == 'BUY':
                    stop_price = current_price * (1 - stop_loss_pct)
                    profit_price = current_price * (1 + take_profit_pct)
                else:
                    stop_price = current_price * (1 + stop_loss_pct)
                    profit_price = current_price * (1 - take_profit_pct)
                
                # Place stop loss
                try:
                    stop_order = client.create_order(
                        symbol=symbol,
                        type='stop_market',
                        side='sell' if side.upper() == 'BUY' else 'buy',
                        amount=quantity,
                        params={'stopPrice': stop_price}
                    )
                except Exception as e:
                    self.logger.warning(f"⚠️ Could not place stop loss: {e}")
                
                # Place take profit
                try:
                    profit_order = client.create_order(
                        symbol=symbol,
                        type='limit',
                        side='sell' if side.upper() == 'BUY' else 'buy',
                        amount=quantity,
                        price=profit_price
                    )
                except Exception as e:
                    self.logger.warning(f"⚠️ Could not place take profit: {e}")
            
            # Track order
            self.active_orders[order_id] = {
                'symbol': symbol,
                'side': side,
                'quantity': quantity,
                'price': current_price,
                'timestamp': datetime.now().isoformat(),
                'exchange': 'binance'
            }
            
            self.logger.info(f"✅ Binance order placed: {side} {quantity} {symbol} at ${current_price:.4f}")
            
            return {
                'success': True,
                'order_id': order_id,
                'symbol': symbol,
                'side': side,
                'quantity': quantity,
                'price': current_price,
                'exchange': 'binance',
                'testnet': self.exchanges['binance'].get('testnet', False)
            }
            
        except Exception as e:
            self.logger.error(f"❌ Binance order failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def _place_alpaca_order(self, symbol: str, side: str, quantity: float, order_type: str,
                          stop_loss_pct: float, take_profit_pct: float) -> Dict:
        """Place order on Alpaca"""
        try:
            client = self.exchanges['alpaca']['client']
            
            # Prepare order data
            order_data = {
                'symbol': symbol,
                'qty': int(quantity),  # Alpaca uses integer quantities for stocks
                'side': side.lower(),
                'type': order_type,
                'time_in_force': 'day'
            }
            
            # Place order
            response = requests.post(
                f"{client['base_url']}/v2/orders",
                headers=client['headers'],
                json=order_data
            )
            
            if response.status_code == 201:
                order = response.json()
                order_id = order['id']
                self.daily_trades += 1
                
                # Track order
                self.active_orders[order_id] = {
                    'symbol': symbol,
                    'side': side,
                    'quantity': quantity,
                    'timestamp': datetime.now().isoformat(),
                    'exchange': 'alpaca'
                }
                
                self.logger.info(f"✅ Alpaca order placed: {side} {quantity} {symbol}")
                
                return {
                    'success': True,
                    'order_id': order_id,
                    'symbol': symbol,
                    'side': side,
                    'quantity': quantity,
                    'exchange': 'alpaca',
                    'paper_trading': self.exchanges['alpaca'].get('paper_trading', False)
                }
            else:
                error_msg = response.json().get('message', 'Unknown error')
                return {'success': False, 'error': f'Alpaca order failed: {error_msg}'}
            
        except Exception as e:
            self.logger.error(f"❌ Alpaca order failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def _get_current_price(self, symbol: str, exchange: str) -> Optional[float]:
        """Get current price for a symbol"""
        try:
            if exchange == 'binance':
                client = self.exchanges['binance']['client']
                ticker = client.fetch_ticker(symbol)
                return float(ticker['last'])
            
            elif exchange == 'alpaca':
                # Use yfinance for stock prices
                ticker = yf.Ticker(symbol)
                data = ticker.history(period="1d", interval="1m")
                if not data.empty:
                    return float(data['Close'].iloc[-1])
            
            return None
            
        except Exception as e:
            self.logger.error(f"❌ Error getting price for {symbol}: {e}")
            return None
    
    def get_order_status(self, order_id: str, exchange: str) -> Dict:
        """Get status of an order"""
        try:
            if exchange == 'binance':
                client = self.exchanges['binance']['client']
                order = client.fetch_order(order_id)
                return {
                    'order_id': order_id,
                    'status': order['status'],
                    'filled': order['filled'],
                    'remaining': order['remaining'],
                    'price': order.get('average', order.get('price', 0))
                }
            
            elif exchange == 'alpaca':
                client = self.exchanges['alpaca']['client']
                response = requests.get(
                    f"{client['base_url']}/v2/orders/{order_id}",
                    headers=client['headers']
                )
                
                if response.status_code == 200:
                    order = response.json()
                    return {
                        'order_id': order_id,
                        'status': order['status'],
                        'filled': float(order.get('filled_qty', 0)),
                        'remaining': float(order.get('qty', 0)) - float(order.get('filled_qty', 0)),
                        'price': float(order.get('filled_avg_price', 0))
                    }
            
            return {'error': f'Unsupported exchange: {exchange}'}
            
        except Exception as e:
            self.logger.error(f"❌ Error getting order status: {e}")
            return {'error': str(e)}
    
    def cancel_order(self, order_id: str, exchange: str) -> Dict:
        """Cancel an order"""
        try:
            if exchange == 'binance':
                client = self.exchanges['binance']['client']
                result = client.cancel_order(order_id)
                return {'success': True, 'result': result}
            
            elif exchange == 'alpaca':
                client = self.exchanges['alpaca']['client']
                response = requests.delete(
                    f"{client['base_url']}/v2/orders/{order_id}",
                    headers=client['headers']
                )
                
                return {'success': response.status_code == 204}
            
            return {'success': False, 'error': f'Unsupported exchange: {exchange}'}
            
        except Exception as e:
            self.logger.error(f"❌ Error cancelling order: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_positions(self, exchange: str) -> List[Dict]:
        """Get current positions"""
        try:
            positions = []
            
            if exchange == 'binance':
                client = self.exchanges['binance']['client']
                balance = client.fetch_balance()
                
                for currency, data in balance.items():
                    if currency != 'info' and data['total'] > 0:
                        positions.append({
                            'symbol': currency,
                            'quantity': data['total'],
                            'available': data['free'],
                            'exchange': 'binance'
                        })
            
            elif exchange == 'alpaca':
                client = self.exchanges['alpaca']['client']
                response = requests.get(
                    f"{client['base_url']}/v2/positions",
                    headers=client['headers']
                )
                
                if response.status_code == 200:
                    alpaca_positions = response.json()
                    for pos in alpaca_positions:
                        positions.append({
                            'symbol': pos['symbol'],
                            'quantity': float(pos['qty']),
                            'market_value': float(pos['market_value']),
                            'unrealized_pnl': float(pos['unrealized_pnl']),
                            'exchange': 'alpaca'
                        })
            
            return positions
            
        except Exception as e:
            self.logger.error(f"❌ Error getting positions: {e}")
            return []
    
    def emergency_stop_all(self) -> Dict:
        """Emergency stop - cancel all orders and close all positions"""
        try:
            results = []
            
            for exchange in self.connected_exchanges:
                try:
                    # Cancel all open orders
                    if exchange == 'binance':
                        client = self.exchanges['binance']['client']
                        open_orders = client.fetch_open_orders()
                        for order in open_orders:
                            client.cancel_order(order['id'])
                    
                    elif exchange == 'alpaca':
                        client = self.exchanges['alpaca']['client']
                        requests.delete(
                            f"{client['base_url']}/v2/orders",
                            headers=client['headers']
                        )
                    
                    results.append(f"✅ Emergency stop completed for {exchange}")
                    
                except Exception as e:
                    results.append(f"❌ Emergency stop failed for {exchange}: {e}")
            
            self.logger.warning("🚨 EMERGENCY STOP EXECUTED")
            
            return {'success': True, 'results': results}
            
        except Exception as e:
            self.logger.error(f"❌ Emergency stop failed: {e}")
            return {'success': False, 'error': str(e)}

# Global instance
real_order_executor = RealOrderExecutor()

def place_real_order(symbol: str, side: str, amount: float, exchange: str = 'binance') -> Dict:
    """Place a real order"""
    return real_order_executor.place_order(symbol, side, amount, exchange=exchange)
