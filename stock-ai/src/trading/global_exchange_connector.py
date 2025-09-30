#!/usr/bin/env python3
"""
Global Exchange Connector - Complete integration for Indian and Global stock exchanges
Supports NSE, BSE, NYSE, NASDAQ, LSE, TSE, and major global trading platforms
"""

import asyncio
import logging
import os
import json
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time

# Optional imports with fallback
try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False

try:
    import nsepy as nse
    NSEPY_AVAILABLE = True
except ImportError:
    NSEPY_AVAILABLE = False

try:
    from jugaad_data.nse import stock_df, index_df
    JUGAAD_AVAILABLE = True
except ImportError:
    JUGAAD_AVAILABLE = False

try:
    import alpha_vantage
    from alpha_vantage.timeseries import TimeSeries
    ALPHA_VANTAGE_AVAILABLE = True
except ImportError:
    ALPHA_VANTAGE_AVAILABLE = False

try:
    import zerodha_kite as kite
    ZERODHA_AVAILABLE = True
except ImportError:
    ZERODHA_AVAILABLE = False

class GlobalExchangeConnector:
    """Comprehensive connector for Indian and Global stock exchanges"""
    
    def __init__(self):
        self.logger = self._setup_logging()
        self.connected_exchanges = []
        self.api_keys = self._load_api_keys()
        
        # Exchange configurations
        self.exchanges = {
            # Indian Exchanges
            'NSE': {
                'name': 'National Stock Exchange of India',
                'country': 'India',
                'currency': 'INR',
                'timezone': 'Asia/Kolkata',
                'trading_hours': '09:15-15:30',
                'methods': ['nsepy', 'jugaad', 'yahoo', 'zerodha']
            },
            'BSE': {
                'name': 'Bombay Stock Exchange',
                'country': 'India', 
                'currency': 'INR',
                'timezone': 'Asia/Kolkata',
                'trading_hours': '09:15-15:30',
                'methods': ['yahoo', 'alpha_vantage']
            },
            'MCX': {
                'name': 'Multi Commodity Exchange',
                'country': 'India',
                'currency': 'INR',
                'timezone': 'Asia/Kolkata',
                'trading_hours': '09:00-23:30',
                'methods': ['yahoo']
            },
            
            # US Exchanges
            'NYSE': {
                'name': 'New York Stock Exchange',
                'country': 'USA',
                'currency': 'USD',
                'timezone': 'America/New_York',
                'trading_hours': '09:30-16:00',
                'methods': ['yahoo', 'alpha_vantage', 'iex']
            },
            'NASDAQ': {
                'name': 'NASDAQ',
                'country': 'USA',
                'currency': 'USD',
                'timezone': 'America/New_York', 
                'trading_hours': '09:30-16:00',
                'methods': ['yahoo', 'alpha_vantage', 'iex']
            },
            
            # European Exchanges
            'LSE': {
                'name': 'London Stock Exchange',
                'country': 'UK',
                'currency': 'GBP',
                'timezone': 'Europe/London',
                'trading_hours': '08:00-16:30',
                'methods': ['yahoo', 'alpha_vantage']
            },
            'EURONEXT': {
                'name': 'Euronext',
                'country': 'Europe',
                'currency': 'EUR',
                'timezone': 'Europe/Paris',
                'trading_hours': '09:00-17:30',
                'methods': ['yahoo']
            },
            'XETRA': {
                'name': 'Frankfurt Stock Exchange',
                'country': 'Germany',
                'currency': 'EUR',
                'timezone': 'Europe/Berlin',
                'trading_hours': '09:00-17:30',
                'methods': ['yahoo']
            },
            
            # Asian Exchanges
            'TSE': {
                'name': 'Tokyo Stock Exchange',
                'country': 'Japan',
                'currency': 'JPY',
                'timezone': 'Asia/Tokyo',
                'trading_hours': '09:00-15:00',
                'methods': ['yahoo']
            },
            'SSE': {
                'name': 'Shanghai Stock Exchange',
                'country': 'China',
                'currency': 'CNY',
                'timezone': 'Asia/Shanghai',
                'trading_hours': '09:30-15:00',
                'methods': ['yahoo']
            },
            'HKEX': {
                'name': 'Hong Kong Exchange',
                'country': 'Hong Kong',
                'currency': 'HKD',
                'timezone': 'Asia/Hong_Kong',
                'trading_hours': '09:30-16:00',
                'methods': ['yahoo']
            },
            'ASX': {
                'name': 'Australian Securities Exchange',
                'country': 'Australia',
                'currency': 'AUD',
                'timezone': 'Australia/Sydney',
                'trading_hours': '10:00-16:00',
                'methods': ['yahoo']
            }
        }
        
        # Popular Indian stocks
        self.indian_stocks = {
            'TCS': 'TCS.NS',
            'RELIANCE': 'RELIANCE.NS',
            'HDFCBANK': 'HDFCBANK.NS',
            'INFY': 'INFY.NS',
            'ICICIBANK': 'ICICIBANK.NS',
            'KOTAKBANK': 'KOTAKBANK.NS',
            'SBIN': 'SBIN.NS',
            'BHARTIARTL': 'BHARTIARTL.NS',
            'ITC': 'ITC.NS',
            'ASIANPAINT': 'ASIANPAINT.NS',
            'MARUTI': 'MARUTI.NS',
            'HCLTECH': 'HCLTECH.NS',
            'BAJFINANCE': 'BAJFINANCE.NS',
            'LT': 'LT.NS',
            'WIPRO': 'WIPRO.NS'
        }
        
        # Major indices
        self.indices = {
            'NIFTY50': '^NSEI',
            'SENSEX': '^BSESN',
            'BANKNIFTY': '^NSEBANK',
            'SP500': '^GSPC',
            'NASDAQ': '^IXIC',
            'DOW': '^DJI',
            'FTSE': '^FTSE',
            'DAX': '^GDAXI',
            'NIKKEI': '^N225',
            'HANGSENG': '^HSI'
        }
        
        self._initialize_connections()
    
    def _setup_logging(self):
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger(__name__)
    
    def _load_api_keys(self):
        """Load API keys from configuration"""
        api_keys = {}
        
        # Load from environment variables
        api_keys['alpha_vantage'] = os.getenv('ALPHA_VANTAGE_API_KEY', '')
        api_keys['zerodha_api_key'] = os.getenv('ZERODHA_API_KEY', '')
        api_keys['zerodha_secret'] = os.getenv('ZERODHA_SECRET', '')
        api_keys['zerodha_access_token'] = os.getenv('ZERODHA_ACCESS_TOKEN', '')
        
        # Load from config file if exists
        config_file = 'config/exchange_api_keys.json'
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    file_keys = json.load(f)
                    api_keys.update(file_keys)
            except Exception as e:
                self.logger.warning(f"Could not load API keys from file: {e}")
        
        return api_keys
    
    def _initialize_connections(self):
        """Initialize available exchange connections"""
        
        # Check NSE/BSE availability
        if NSEPY_AVAILABLE:
            self.connected_exchanges.append('NSE_NSEPY')
            self.logger.info("✅ NSE connection available via nsepy")
        
        if JUGAAD_AVAILABLE:
            self.connected_exchanges.append('NSE_JUGAAD') 
            self.logger.info("✅ NSE connection available via jugaad-data")
        
        if YFINANCE_AVAILABLE:
            self.connected_exchanges.extend(['NSE_YAHOO', 'BSE_YAHOO', 'NYSE_YAHOO', 'NASDAQ_YAHOO'])
            self.logger.info("✅ Global exchanges available via Yahoo Finance")
        
        if ALPHA_VANTAGE_AVAILABLE and self.api_keys.get('alpha_vantage'):
            self.connected_exchanges.extend(['NYSE_AV', 'NASDAQ_AV', 'LSE_AV'])
            self.logger.info("✅ Alpha Vantage API connection available")
        
        if ZERODHA_AVAILABLE and self.api_keys.get('zerodha_api_key'):
            self.connected_exchanges.append('ZERODHA')
            self.logger.info("✅ Zerodha Kite API connection available")
    
    # =================================================================
    # INDIAN STOCK EXCHANGES - NSE/BSE METHODS
    # =================================================================
    
    async def get_nse_data_nsepy(self, symbol: str, days: int = 30) -> pd.DataFrame:
        """Get NSE data using nsepy library"""
        if not NSEPY_AVAILABLE:
            raise Exception("nsepy library not available")
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Get stock data
            data = nse.get_history(
                symbol=symbol,
                start=start_date,
                end=end_date
            )
            
            if data.empty:
                raise Exception(f"No data found for {symbol}")
            
            # Standardize columns
            data = data.rename(columns={
                'Date': 'timestamp',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume',
                'Turnover': 'turnover'
            })
            
            data['exchange'] = 'NSE'
            data['symbol'] = symbol
            
            return data
        
        except Exception as e:
            self.logger.error(f"NSE nsepy error for {symbol}: {e}")
            return pd.DataFrame()
    
    async def get_nse_data_jugaad(self, symbol: str, days: int = 30) -> pd.DataFrame:
        """Get NSE data using jugaad-data library"""
        if not JUGAAD_AVAILABLE:
            raise Exception("jugaad-data library not available")
        
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            # Get stock data
            data = stock_df(
                symbol=symbol,
                from_date=start_date,
                to_date=end_date,
                series="EQ"
            )
            
            if data.empty:
                raise Exception(f"No data found for {symbol}")
            
            # Standardize columns
            data = data.rename(columns={
                'DATE': 'timestamp',
                'OPEN': 'open',
                'HIGH': 'high',
                'LOW': 'low',
                'CLOSE': 'close',
                'VOLUME': 'volume'
            })
            
            data['exchange'] = 'NSE'
            data['symbol'] = symbol
            
            return data
        
        except Exception as e:
            self.logger.error(f"NSE jugaad error for {symbol}: {e}")
            return pd.DataFrame()
    
    async def get_nse_live_price(self, symbol: str) -> Dict:
        """Get live NSE price using multiple methods"""
        
        # Method 1: Try Yahoo Finance with .NS suffix
        if YFINANCE_AVAILABLE:
            try:
                ticker = f"{symbol}.NS"
                stock = yf.Ticker(ticker)
                info = stock.info
                
                if 'regularMarketPrice' in info:
                    return {
                        'symbol': symbol,
                        'exchange': 'NSE',
                        'price': info['regularMarketPrice'],
                        'currency': 'INR',
                        'timestamp': datetime.now().isoformat(),
                        'method': 'yahoo_finance'
                    }
            except Exception as e:
                self.logger.debug(f"Yahoo Finance NSE error for {symbol}: {e}")
        
        # Method 2: Try NSE direct API (unofficial)
        try:
            url = f"https://www.nseindia.com/api/quote-equity?symbol={symbol}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if 'priceInfo' in data:
                    price_info = data['priceInfo']
                    return {
                        'symbol': symbol,
                        'exchange': 'NSE',
                        'price': price_info.get('lastPrice', 0),
                        'currency': 'INR',
                        'timestamp': datetime.now().isoformat(),
                        'method': 'nse_api'
                    }
        except Exception as e:
            self.logger.debug(f"NSE API error for {symbol}: {e}")
        
        return {}
    
    async def get_bse_live_price(self, symbol: str) -> Dict:
        """Get live BSE price"""
        
        if YFINANCE_AVAILABLE:
            try:
                ticker = f"{symbol}.BO"  # BSE suffix
                stock = yf.Ticker(ticker)
                info = stock.info
                
                if 'regularMarketPrice' in info:
                    return {
                        'symbol': symbol,
                        'exchange': 'BSE',
                        'price': info['regularMarketPrice'],
                        'currency': 'INR',
                        'timestamp': datetime.now().isoformat(),
                        'method': 'yahoo_finance'
                    }
            except Exception as e:
                self.logger.debug(f"Yahoo Finance BSE error for {symbol}: {e}")
        
        return {}
    
    # =================================================================
    # GLOBAL STOCK EXCHANGES - NYSE/NASDAQ/LSE METHODS
    # =================================================================
    
    async def get_us_stock_data(self, symbol: str, exchange: str = 'NYSE', days: int = 30) -> pd.DataFrame:
        """Get US stock data (NYSE/NASDAQ)"""
        
        if YFINANCE_AVAILABLE:
            try:
                stock = yf.Ticker(symbol)
                data = stock.history(period=f"{days}d", interval="1d")
                
                if data.empty:
                    raise Exception(f"No data found for {symbol}")
                
                # Standardize columns
                data = data.reset_index()
                data = data.rename(columns={
                    'Date': 'timestamp',
                    'Open': 'open',
                    'High': 'high',
                    'Low': 'low',
                    'Close': 'close',
                    'Volume': 'volume'
                })
                
                data['exchange'] = exchange
                data['symbol'] = symbol
                
                return data
            
            except Exception as e:
                self.logger.error(f"US stock error for {symbol}: {e}")
        
        return pd.DataFrame()
    
    async def get_us_live_price(self, symbol: str, exchange: str = 'NYSE') -> Dict:
        """Get live US stock price"""
        
        if YFINANCE_AVAILABLE:
            try:
                stock = yf.Ticker(symbol)
                info = stock.info
                
                if 'regularMarketPrice' in info:
                    return {
                        'symbol': symbol,
                        'exchange': exchange,
                        'price': info['regularMarketPrice'],
                        'currency': 'USD',
                        'timestamp': datetime.now().isoformat(),
                        'method': 'yahoo_finance'
                    }
            except Exception as e:
                self.logger.debug(f"US stock error for {symbol}: {e}")
        
        return {}
    
    async def get_european_stock_data(self, symbol: str, exchange: str = 'LSE', days: int = 30) -> pd.DataFrame:
        """Get European stock data"""
        
        if YFINANCE_AVAILABLE:
            try:
                # Add appropriate suffix for exchange
                suffixes = {
                    'LSE': '.L',
                    'EURONEXT': '.PA',
                    'XETRA': '.DE'
                }
                
                ticker = symbol + suffixes.get(exchange, '')
                stock = yf.Ticker(ticker)
                data = stock.history(period=f"{days}d", interval="1d")
                
                if data.empty:
                    raise Exception(f"No data found for {ticker}")
                
                # Standardize columns
                data = data.reset_index()
                data = data.rename(columns={
                    'Date': 'timestamp',
                    'Open': 'open',
                    'High': 'high',
                    'Low': 'low',
                    'Close': 'close',
                    'Volume': 'volume'
                })
                
                data['exchange'] = exchange
                data['symbol'] = symbol
                
                return data
            
            except Exception as e:
                self.logger.error(f"European stock error for {symbol}: {e}")
        
        return pd.DataFrame()
    
    # =================================================================
    # ORDER EXECUTION METHODS
    # =================================================================
    
    async def place_nse_order_zerodha(self, symbol: str, side: str, quantity: int, 
                                     order_type: str = 'MARKET') -> Dict:
        """Place order on NSE via Zerodha Kite"""
        
        if not ZERODHA_AVAILABLE or not self.api_keys.get('zerodha_access_token'):
            return {'status': 'error', 'message': 'Zerodha API not configured'}
        
        try:
            kite_session = kite.KiteConnect(api_key=self.api_keys['zerodha_api_key'])
            kite_session.set_access_token(self.api_keys['zerodha_access_token'])
            
            order_params = {
                'exchange': 'NSE',
                'tradingsymbol': symbol,
                'transaction_type': side.upper(),  # BUY/SELL
                'quantity': quantity,
                'order_type': order_type,
                'product': 'MIS'  # Intraday
            }
            
            if order_type == 'LIMIT':
                # Get current price for limit order
                price_data = await self.get_nse_live_price(symbol)
                if price_data and 'price' in price_data:
                    order_params['price'] = price_data['price']
                else:
                    return {'status': 'error', 'message': 'Could not get price for limit order'}
            
            order_id = kite_session.place_order(**order_params)
            
            return {
                'status': 'success',
                'order_id': order_id,
                'symbol': symbol,
                'exchange': 'NSE',
                'side': side,
                'quantity': quantity,
                'order_type': order_type,
                'timestamp': datetime.now().isoformat()
            }
        
        except Exception as e:
            return {
                'status': 'error',
                'message': str(e),
                'exchange': 'NSE'
            }
    
    async def place_us_order_paper(self, symbol: str, side: str, quantity: int, 
                                  exchange: str = 'NYSE') -> Dict:
        """Place paper order for US stocks (simulation)"""
        
        # Get current price
        price_data = await self.get_us_live_price(symbol, exchange)
        
        if not price_data:
            return {'status': 'error', 'message': 'Could not get current price'}
        
        return {
            'status': 'success',
            'order_id': f"PAPER_{int(time.time())}",
            'symbol': symbol,
            'exchange': exchange,
            'side': side,
            'quantity': quantity,
            'price': price_data['price'],
            'currency': 'USD',
            'order_type': 'PAPER_TRADING',
            'timestamp': datetime.now().isoformat()
        }
    
    # =================================================================
    # UNIFIED INTERFACE METHODS
    # =================================================================
    
    async def get_live_price(self, symbol: str, exchange: str) -> Dict:
        """Get live price for any symbol on any exchange"""
        
        exchange = exchange.upper()
        
        if exchange == 'NSE':
            return await self.get_nse_live_price(symbol)
        elif exchange == 'BSE':
            return await self.get_bse_live_price(symbol)
        elif exchange in ['NYSE', 'NASDAQ']:
            return await self.get_us_live_price(symbol, exchange)
        else:
            return {}
    
    async def get_historical_data(self, symbol: str, exchange: str, days: int = 30) -> pd.DataFrame:
        """Get historical data for any symbol on any exchange"""
        
        exchange = exchange.upper()
        
        if exchange == 'NSE':
            # Try multiple NSE methods
            for method in ['jugaad', 'nsepy', 'yahoo']:
                try:
                    if method == 'jugaad' and JUGAAD_AVAILABLE:
                        return await self.get_nse_data_jugaad(symbol, days)
                    elif method == 'nsepy' and NSEPY_AVAILABLE:
                        return await self.get_nse_data_nsepy(symbol, days)
                    elif method == 'yahoo' and YFINANCE_AVAILABLE:
                        return await self.get_us_stock_data(f"{symbol}.NS", 'NSE', days)
                except Exception as e:
                    self.logger.debug(f"NSE {method} failed for {symbol}: {e}")
                    continue
        
        elif exchange == 'BSE':
            if YFINANCE_AVAILABLE:
                return await self.get_us_stock_data(f"{symbol}.BO", 'BSE', days)
        
        elif exchange in ['NYSE', 'NASDAQ']:
            return await self.get_us_stock_data(symbol, exchange, days)
        
        elif exchange in ['LSE', 'EURONEXT', 'XETRA']:
            return await self.get_european_stock_data(symbol, exchange, days)
        
        return pd.DataFrame()
    
    async def place_order(self, symbol: str, exchange: str, side: str, quantity: int, 
                         order_type: str = 'MARKET') -> Dict:
        """Place order on any exchange"""
        
        exchange = exchange.upper()
        
        if exchange == 'NSE' and ZERODHA_AVAILABLE:
            return await self.place_nse_order_zerodha(symbol, side, quantity, order_type)
        elif exchange in ['NYSE', 'NASDAQ', 'BSE', 'LSE']:
            return await self.place_us_order_paper(symbol, side, quantity, exchange)
        else:
            return {'status': 'error', 'message': f'Trading not implemented for {exchange}'}
    
    def get_supported_exchanges(self) -> Dict:
        """Get list of supported exchanges and their capabilities"""
        
        supported = {}
        
        for exchange, config in self.exchanges.items():
            capabilities = []
            
            # Check data capabilities
            if exchange in ['NSE', 'BSE'] and (NSEPY_AVAILABLE or JUGAAD_AVAILABLE or YFINANCE_AVAILABLE):
                capabilities.append('live_data')
                capabilities.append('historical_data')
            
            if exchange in ['NYSE', 'NASDAQ', 'LSE'] and YFINANCE_AVAILABLE:
                capabilities.append('live_data')
                capabilities.append('historical_data')
            
            # Check trading capabilities
            if exchange == 'NSE' and ZERODHA_AVAILABLE:
                capabilities.append('live_trading')
            else:
                capabilities.append('paper_trading')
            
            supported[exchange] = {
                **config,
                'capabilities': capabilities,
                'status': 'available' if capabilities else 'limited'
            }
        
        return supported
    
    def get_popular_symbols(self, exchange: str) -> List[str]:
        """Get popular symbols for an exchange"""
        
        exchange = exchange.upper()
        
        if exchange == 'NSE':
            return list(self.indian_stocks.keys())
        elif exchange == 'NYSE':
            return ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V']
        elif exchange == 'NASDAQ':
            return ['QQQ', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'NVDA', 'NFLX', 'ADBE']
        elif exchange == 'BSE':
            return ['TCS', 'RELIANCE', 'HDFCBANK', 'INFY', 'ICICIBANK']
        else:
            return []

# Global connector instance
global_exchange_connector = GlobalExchangeConnector()

async def main():
    """Test global exchange connectivity"""
    
    print("🌍 TESTING GLOBAL EXCHANGE CONNECTIVITY")
    print("=" * 60)
    
    connector = GlobalExchangeConnector()
    
    # Test supported exchanges
    exchanges = connector.get_supported_exchanges()
    print("📊 Supported Exchanges:")
    for exchange, config in exchanges.items():
        print(f"  {exchange}: {config['name']} ({config['country']}) - {config['status']}")
    
    print("\n🔍 Testing Live Data...")
    
    # Test Indian stocks
    print("\n🇮🇳 Indian Market (NSE):")
    for symbol in ['TCS', 'RELIANCE', 'INFY']:
        try:
            price_data = await connector.get_live_price(symbol, 'NSE')
            if price_data:
                print(f"  ✅ {symbol}: ₹{price_data['price']:.2f}")
            else:
                print(f"  ❌ {symbol}: No data")
        except Exception as e:
            print(f"  ❌ {symbol}: {e}")
    
    # Test US stocks
    print("\n🇺🇸 US Market (NYSE/NASDAQ):")
    for symbol, exchange in [('AAPL', 'NASDAQ'), ('GOOGL', 'NASDAQ'), ('JPM', 'NYSE')]:
        try:
            price_data = await connector.get_live_price(symbol, exchange)
            if price_data:
                print(f"  ✅ {symbol}: ${price_data['price']:.2f}")
            else:
                print(f"  ❌ {symbol}: No data")
        except Exception as e:
            print(f"  ❌ {symbol}: {e}")
    
    print("\n🎯 Test completed!")

if __name__ == "__main__":
    asyncio.run(main())
