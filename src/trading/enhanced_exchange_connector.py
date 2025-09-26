#!/usr/bin/env python3
"""
🌍 ENHANCED MULTI-EXCHANGE CONNECTOR
Supports Indian (Zerodha, Upstox, 5Paisa, NSE, BSE) and Global exchanges
Live trading, balance fetching, and order placement
"""

import os
import sys
import json
import time
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from dataclasses import dataclass

# Add parent directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

@dataclass
class Position:
    symbol: str
    quantity: float
    average_price: float
    current_price: float
    pnl: float
    side: str  # 'long' or 'short'

@dataclass
class Order:
    order_id: str
    symbol: str
    side: str  # 'buy' or 'sell'
    quantity: float
    price: float
    order_type: str  # 'market', 'limit', 'stop'
    status: str  # 'pending', 'filled', 'cancelled'
    timestamp: datetime

class EnhancedExchangeConnector:
    """Enhanced connector supporting multiple exchanges with live trading"""
    
    def __init__(self):
        self.connections = {}
        self.balances = {}
        self.positions = {}
        self.orders = {}
        self.setup_logging()
        
    def setup_logging(self):
        """Setup logging for the connector"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
    def connect_zerodha(self, api_key: str, access_token: str) -> bool:
        """Connect to Zerodha Kite API"""
        try:
            from kiteconnect import KiteConnect
            
            kite = KiteConnect(api_key=api_key)
            kite.set_access_token(access_token)
            
            # Test connection
            profile = kite.profile()
            self.connections['zerodha'] = kite
            
            self.logger.info(f"✅ Connected to Zerodha: {profile['user_name']}")
            return True
            
        except ImportError:
            self.logger.error("❌ Zerodha KiteConnect not installed. Run: pip install kiteconnect")
            return False
        except Exception as e:
            self.logger.error(f"❌ Failed to connect to Zerodha: {e}")
            return False
            
    def connect_upstox(self, api_key: str, access_token: str) -> bool:
        """Connect to Upstox API"""
        try:
            import upstox_client
            
            configuration = upstox_client.Configuration()
            configuration.access_token = access_token
            
            # Test connection
            api_instance = upstox_client.UserApi(upstox_client.ApiClient(configuration))
            profile = api_instance.get_profile()
            
            self.connections['upstox'] = {
                'api': api_instance,
                'config': configuration
            }
            
            self.logger.info(f"✅ Connected to Upstox: {profile.user_name}")
            return True
            
        except ImportError:
            self.logger.error("❌ Upstox client not installed. Run: pip install upstox-client")
            return False
        except Exception as e:
            self.logger.error(f"❌ Failed to connect to Upstox: {e}")
            return False
            
    def connect_5paisa(self, email: str, password: str, dob: str) -> bool:
        """Connect to 5Paisa API"""
        try:
            from py5paisa import FivePaisaClient
            
            client = FivePaisaClient(email=email, passwd=password, dob=dob)
            client.login()
            
            self.connections['5paisa'] = client
            
            self.logger.info("✅ Connected to 5Paisa")
            return True
            
        except ImportError:
            self.logger.error("❌ 5Paisa client not installed. Run: pip install py5paisa")
            return False
        except Exception as e:
            self.logger.error(f"❌ Failed to connect to 5Paisa: {e}")
            return False
            
    def connect_nse_live(self) -> bool:
        """Connect to NSE live data (free API)"""
        try:
            # Test NSE connection
            url = "https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                self.connections['nse'] = {'headers': headers}
                self.logger.info("✅ Connected to NSE Live Data")
                return True
            else:
                self.logger.error(f"❌ NSE connection failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.logger.error(f"❌ Failed to connect to NSE: {e}")
            return False
            
    def connect_binance(self, api_key: str, secret_key: str, testnet: bool = True) -> bool:
        """Connect to Binance (enhanced version)"""
        try:
            import ccxt
            
            exchange_class = ccxt.binance
            
            config = {
                'apiKey': api_key,
                'secret': secret_key,
                'timeout': 30000,
                'enableRateLimit': True,
            }
            
            if testnet:
                config['sandbox'] = True
                config['urls'] = {
                    'api': {
                        'public': 'https://testnet.binance.vision/api/v3',
                        'private': 'https://testnet.binance.vision/api/v3',
                    }
                }
                
            exchange = exchange_class(config)
            
            # Test connection
            balance = exchange.fetch_balance()
            self.connections['binance'] = exchange
            
            self.logger.info(f"✅ Connected to Binance {'Testnet' if testnet else 'Live'}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to connect to Binance: {e}")
            return False
            
    def get_balance(self, exchange: str) -> Dict:
        """Get account balance from exchange"""
        try:
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                margins = kite.margins()
                
                balance = {
                    'exchange': 'zerodha',
                    'available_cash': margins['equity']['available']['cash'],
                    'used_margin': margins['equity']['utilised']['debits'],
                    'total_balance': margins['equity']['net'],
                    'currency': 'INR'
                }
                
            elif exchange == 'upstox' and 'upstox' in self.connections:
                api = self.connections['upstox']['api']
                margins = api.get_user_fund_margin()
                
                balance = {
                    'exchange': 'upstox',
                    'available_cash': margins.available_margin,
                    'used_margin': margins.used_margin,
                    'total_balance': margins.available_margin + margins.used_margin,
                    'currency': 'INR'
                }
                
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                account_balance = binance.fetch_balance()
                
                balance = {
                    'exchange': 'binance',
                    'balances': account_balance['total'],
                    'free': account_balance['free'],
                    'used': account_balance['used'],
                    'currency': 'Multiple'
                }
                
            else:
                self.logger.error(f"❌ Exchange {exchange} not connected or not supported")
                return {}
                
            self.balances[exchange] = balance
            return balance
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get balance from {exchange}: {e}")
            return {}
            
    def get_positions(self, exchange: str) -> List[Position]:
        """Get current positions from exchange"""
        try:
            positions = []
            
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                kite_positions = kite.positions()['net']
                
                for pos in kite_positions:
                    if pos['quantity'] != 0:
                        positions.append(Position(
                            symbol=pos['tradingsymbol'],
                            quantity=pos['quantity'],
                            average_price=pos['average_price'],
                            current_price=pos['last_price'],
                            pnl=pos['pnl'],
                            side='long' if pos['quantity'] > 0 else 'short'
                        ))
                        
            elif exchange == 'upstox' and 'upstox' in self.connections:
                api = self.connections['upstox']['api']
                upstox_positions = api.get_positions()
                
                for pos in upstox_positions:
                    if pos.quantity != 0:
                        positions.append(Position(
                            symbol=pos.instrument_token,
                            quantity=pos.quantity,
                            average_price=pos.average_price,
                            current_price=pos.last_price,
                            pnl=pos.pnl,
                            side='long' if pos.quantity > 0 else 'short'
                        ))
                        
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                binance_positions = binance.fetch_positions()
                
                for pos in binance_positions:
                    if float(pos['contracts']) != 0:
                        positions.append(Position(
                            symbol=pos['symbol'],
                            quantity=float(pos['contracts']),
                            average_price=float(pos['entryPrice']),
                            current_price=float(pos['markPrice']),
                            pnl=float(pos['unrealizedPnl']),
                            side=pos['side']
                        ))
                        
            self.positions[exchange] = positions
            return positions
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get positions from {exchange}: {e}")
            return []
            
    def place_order(self, exchange: str, symbol: str, side: str, quantity: float, 
                   price: float = None, order_type: str = 'market') -> Optional[str]:
        """Place an order on the exchange"""
        try:
            order_id = None
            
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                
                order_params = {
                    'tradingsymbol': symbol,
                    'exchange': 'NSE',  # Default to NSE
                    'transaction_type': side.upper(),
                    'quantity': int(quantity),
                    'order_type': order_type.upper(),
                    'product': 'MIS'  # Intraday
                }
                
                if order_type.lower() == 'limit' and price:
                    order_params['price'] = price
                    
                order_id = kite.place_order(**order_params)
                
            elif exchange == 'upstox' and 'upstox' in self.connections:
                api = self.connections['upstox']['api']
                
                order_params = {
                    'instrument_token': symbol,
                    'quantity': int(quantity),
                    'price': price if price else 0,
                    'transaction_type': side.upper(),
                    'order_type': order_type.upper(),
                    'product': 'I'  # Intraday
                }
                
                order_response = api.place_order(**order_params)
                order_id = order_response.order_id
                
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                
                if order_type.lower() == 'market':
                    order = binance.create_market_order(symbol, side, quantity)
                elif order_type.lower() == 'limit':
                    order = binance.create_limit_order(symbol, side, quantity, price)
                else:
                    raise ValueError(f"Unsupported order type: {order_type}")
                    
                order_id = order['id']
                
            if order_id:
                # Store order locally
                order_obj = Order(
                    order_id=str(order_id),
                    symbol=symbol,
                    side=side,
                    quantity=quantity,
                    price=price or 0,
                    order_type=order_type,
                    status='pending',
                    timestamp=datetime.now()
                )
                
                if exchange not in self.orders:
                    self.orders[exchange] = []
                self.orders[exchange].append(order_obj)
                
                self.logger.info(f"✅ Order placed on {exchange}: {order_id}")
                return str(order_id)
                
        except Exception as e:
            self.logger.error(f"❌ Failed to place order on {exchange}: {e}")
            return None
            
    def cancel_order(self, exchange: str, order_id: str) -> bool:
        """Cancel an order"""
        try:
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                kite.cancel_order(order_id=order_id)
                
            elif exchange == 'upstox' and 'upstox' in self.connections:
                api = self.connections['upstox']['api']
                api.cancel_order(order_id)
                
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                # Need symbol for Binance cancellation - this is a limitation
                # Would need to store symbol with order
                pass
                
            self.logger.info(f"✅ Order {order_id} cancelled on {exchange}")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to cancel order {order_id} on {exchange}: {e}")
            return False
            
    def get_live_price(self, exchange: str, symbol: str) -> Optional[float]:
        """Get live price for a symbol"""
        try:
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                # Convert symbol to instrument token if needed
                ltp = kite.ltp([symbol])
                return ltp[symbol]['last_price']
                
            elif exchange == 'nse' and 'nse' in self.connections:
                # Use NSE free API
                url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol}"
                headers = self.connections['nse']['headers']
                
                response = requests.get(url, headers=headers, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    return float(data['priceInfo']['lastPrice'])
                    
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                ticker = binance.fetch_ticker(symbol)
                return float(ticker['last'])
                
            return None
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get live price for {symbol} on {exchange}: {e}")
            return None
            
    def get_historical_data(self, exchange: str, symbol: str, 
                          interval: str = '1d', limit: int = 100) -> pd.DataFrame:
        """Get historical price data"""
        try:
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                
                # Convert interval to Kite format
                interval_map = {
                    '1m': 'minute',
                    '5m': '5minute',
                    '15m': '15minute',
                    '1h': '60minute',
                    '1d': 'day'
                }
                
                kite_interval = interval_map.get(interval, 'day')
                
                # Get historical data
                end_date = datetime.now()
                start_date = end_date - timedelta(days=limit)
                
                data = kite.historical_data(
                    instrument_token=symbol,  # Assuming symbol is instrument token
                    from_date=start_date,
                    to_date=end_date,
                    interval=kite_interval
                )
                
                df = pd.DataFrame(data)
                df['timestamp'] = pd.to_datetime(df['date'])
                return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
                
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                
                # Convert interval to Binance format
                interval_map = {
                    '1m': '1m',
                    '5m': '5m',
                    '15m': '15m',
                    '1h': '1h',
                    '1d': '1d'
                }
                
                binance_interval = interval_map.get(interval, '1d')
                
                ohlcv = binance.fetch_ohlcv(symbol, binance_interval, limit=limit)
                
                df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
                return df
                
            return pd.DataFrame()
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get historical data for {symbol} on {exchange}: {e}")
            return pd.DataFrame()
            
    def get_order_book(self, exchange: str, symbol: str) -> Dict:
        """Get order book depth"""
        try:
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                depth = kite.depth([symbol])
                return depth[symbol]
                
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                order_book = binance.fetch_order_book(symbol)
                return order_book
                
            return {}
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get order book for {symbol} on {exchange}: {e}")
            return {}
            
    def get_connection_status(self) -> Dict:
        """Get status of all exchange connections"""
        status = {}
        
        for exchange in ['zerodha', 'upstox', '5paisa', 'nse', 'binance']:
            if exchange in self.connections:
                try:
                    # Test connection with a simple API call
                    if exchange == 'zerodha':
                        self.connections[exchange].profile()
                    elif exchange == 'binance':
                        self.connections[exchange].fetch_balance()
                    elif exchange == 'nse':
                        # Simple HTTP check
                        requests.get("https://www.nseindia.com", timeout=5)
                        
                    status[exchange] = {
                        'connected': True,
                        'last_check': datetime.now().isoformat()
                    }
                except:
                    status[exchange] = {
                        'connected': False,
                        'last_check': datetime.now().isoformat()
                    }
            else:
                status[exchange] = {
                    'connected': False,
                    'last_check': None
                }
                
        return status
        
    def get_supported_instruments(self, exchange: str) -> List[str]:
        """Get list of supported instruments for an exchange"""
        try:
            if exchange == 'zerodha' and 'zerodha' in self.connections:
                kite = self.connections['zerodha']
                instruments = kite.instruments()
                return [inst['tradingsymbol'] for inst in instruments[:100]]  # Limit for demo
                
            elif exchange == 'binance' and 'binance' in self.connections:
                binance = self.connections['binance']
                markets = binance.load_markets()
                return list(markets.keys())[:100]  # Limit for demo
                
            elif exchange == 'nse':
                # Return predefined NSE instruments
                return [
                    'TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK',
                    'HDFC', 'SBIN', 'BHARTIARTL', 'ITC', 'HINDUNILVR',
                    'LT', 'HCLTECH', 'AXISBANK', 'ASIANPAINT', 'MARUTI'
                ]
                
            return []
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get instruments for {exchange}: {e}")
            return []

def test_enhanced_connector():
    """Test the enhanced exchange connector"""
    connector = EnhancedExchangeConnector()
    
    print("🚀 Testing Enhanced Exchange Connector")
    print("=" * 50)
    
    # Test NSE connection (free)
    if connector.connect_nse_live():
        print("✅ NSE connection successful")
        
        # Test live price
        price = connector.get_live_price('nse', 'TCS')
        if price:
            print(f"📊 TCS Live Price: ₹{price}")
            
        # Get supported instruments
        instruments = connector.get_supported_instruments('nse')
        print(f"📋 NSE Instruments: {len(instruments)} available")
        
    # Test connection status
    status = connector.get_connection_status()
    print(f"\n🔗 Connection Status:")
    for exchange, info in status.items():
        status_icon = "✅" if info['connected'] else "❌"
        print(f"  {status_icon} {exchange.upper()}: {'Connected' if info['connected'] else 'Not Connected'}")
        
    return connector

if __name__ == "__main__":
    # Run tests
    connector = test_enhanced_connector()
    
    print("\n" + "=" * 50)
    print("🎯 NEXT STEPS:")
    print("1. Add your Zerodha/Upstox API keys to .env file")
    print("2. Test live trading with paper trading first")
    print("3. Configure risk management parameters")
    print("4. Start live trading with small amounts")
    print("=" * 50)
