#!/usr/bin/env python3
"""
📊 REAL MARKET DATA PROVIDER
Integrates with multiple data sources for live market data
"""

import yfinance as yf
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
import logging
from typing import Dict, List, Optional, Tuple
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

class RealMarketDataProvider:
    """Real-time market data provider using multiple sources"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # API Keys (add your keys here)
        self.alpha_vantage_key = os.getenv('ALPHA_VANTAGE_API_KEY', 'demo')
        self.polygon_key = os.getenv('POLYGON_API_KEY', 'demo')
        
        # Data sources priority
        self.data_sources = ['yfinance', 'alpha_vantage', 'polygon']
        
        # Cache for recent data
        self.price_cache = {}
        self.cache_duration = 60  # seconds
        
        # Supported instruments
        self.instruments = {
            # US Stocks
            'AAPL': {'type': 'stock', 'exchange': 'NASDAQ', 'name': 'Apple Inc'},
            'MSFT': {'type': 'stock', 'exchange': 'NASDAQ', 'name': 'Microsoft Corp'},
            'GOOGL': {'type': 'stock', 'exchange': 'NASDAQ', 'name': 'Alphabet Inc'},
            'AMZN': {'type': 'stock', 'exchange': 'NASDAQ', 'name': 'Amazon.com Inc'},
            'TSLA': {'type': 'stock', 'exchange': 'NASDAQ', 'name': 'Tesla Inc'},
            'META': {'type': 'stock', 'exchange': 'NASDAQ', 'name': 'Meta Platforms'},
            'NVDA': {'type': 'stock', 'exchange': 'NASDAQ', 'name': 'NVIDIA Corporation'},
            'JPM': {'type': 'stock', 'exchange': 'NYSE', 'name': 'JPMorgan Chase & Co'},
            'JNJ': {'type': 'stock', 'exchange': 'NYSE', 'name': 'Johnson & Johnson'},
            'V': {'type': 'stock', 'exchange': 'NYSE', 'name': 'Visa Inc'},
            
            # Crypto (via Binance/YFinance)
            'BTC-USD': {'type': 'crypto', 'exchange': 'Binance', 'name': 'Bitcoin'},
            'ETH-USD': {'type': 'crypto', 'exchange': 'Binance', 'name': 'Ethereum'},
            'BNB-USD': {'type': 'crypto', 'exchange': 'Binance', 'name': 'Binance Coin'},
            'ADA-USD': {'type': 'crypto', 'exchange': 'Binance', 'name': 'Cardano'},
            'SOL-USD': {'type': 'crypto', 'exchange': 'Binance', 'name': 'Solana'},
            
            # Indian Stocks (via NSE)
            'RELIANCE.NS': {'type': 'stock', 'exchange': 'NSE', 'name': 'Reliance Industries'},
            'TCS.NS': {'type': 'stock', 'exchange': 'NSE', 'name': 'Tata Consultancy Services'},
            'INFY.NS': {'type': 'stock', 'exchange': 'NSE', 'name': 'Infosys Limited'},
            'HDFCBANK.NS': {'type': 'stock', 'exchange': 'NSE', 'name': 'HDFC Bank Limited'},
            'ICICIBANK.NS': {'type': 'stock', 'exchange': 'NSE', 'name': 'ICICI Bank Limited'},
        }
    
    def get_live_price(self, symbol: str) -> Optional[Dict]:
        """Get live price for a symbol"""
        try:
            # Check cache first
            cache_key = f"{symbol}_price"
            if cache_key in self.price_cache:
                cached_data, timestamp = self.price_cache[cache_key]
                if time.time() - timestamp < self.cache_duration:
                    return cached_data
            
            # Try different data sources
            for source in self.data_sources:
                try:
                    if source == 'yfinance':
                        data = self._get_yfinance_price(symbol)
                    elif source == 'alpha_vantage':
                        data = self._get_alpha_vantage_price(symbol)
                    elif source == 'polygon':
                        data = self._get_polygon_price(symbol)
                    else:
                        continue
                    
                    if data:
                        # Cache the result
                        self.price_cache[cache_key] = (data, time.time())
                        return data
                        
                except Exception as e:
                    self.logger.warning(f"Failed to get price from {source} for {symbol}: {e}")
                    continue
            
            self.logger.error(f"Failed to get price for {symbol} from all sources")
            return None
            
        except Exception as e:
            self.logger.error(f"Error getting live price for {symbol}: {e}")
            return None
    
    def _get_yfinance_price(self, symbol: str) -> Optional[Dict]:
        """Get price from Yahoo Finance"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            hist = ticker.history(period="1d", interval="1m")
            
            if hist.empty:
                return None
            
            current_price = hist['Close'].iloc[-1]
            open_price = hist['Open'].iloc[0]
            high_price = hist['High'].max()
            low_price = hist['Low'].min()
            volume = hist['Volume'].sum()
            
            # Calculate additional metrics
            price_change = current_price - open_price
            price_change_pct = (price_change / open_price) * 100 if open_price > 0 else 0
            
            return {
                'symbol': symbol,
                'current_price': float(current_price),
                'open_price': float(open_price),
                'high_price': float(high_price),
                'low_price': float(low_price),
                'volume': int(volume),
                'price_change': float(price_change),
                'price_change_pct': float(price_change_pct),
                'timestamp': datetime.now().isoformat(),
                'source': 'yfinance',
                'market_cap': info.get('marketCap', 0),
                'pe_ratio': info.get('trailingPE', 0),
                'name': info.get('longName', symbol)
            }
            
        except Exception as e:
            self.logger.error(f"YFinance error for {symbol}: {e}")
            return None
    
    def _get_alpha_vantage_price(self, symbol: str) -> Optional[Dict]:
        """Get price from Alpha Vantage"""
        try:
            if self.alpha_vantage_key == 'demo':
                return None
                
            url = f"https://www.alphavantage.co/query"
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': symbol,
                'apikey': self.alpha_vantage_key
            }
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if 'Global Quote' not in data:
                return None
            
            quote = data['Global Quote']
            
            return {
                'symbol': symbol,
                'current_price': float(quote['05. price']),
                'open_price': float(quote['02. open']),
                'high_price': float(quote['03. high']),
                'low_price': float(quote['04. low']),
                'volume': int(quote['06. volume']),
                'price_change': float(quote['09. change']),
                'price_change_pct': float(quote['10. change percent'].rstrip('%')),
                'timestamp': datetime.now().isoformat(),
                'source': 'alpha_vantage'
            }
            
        except Exception as e:
            self.logger.error(f"Alpha Vantage error for {symbol}: {e}")
            return None
    
    def _get_polygon_price(self, symbol: str) -> Optional[Dict]:
        """Get price from Polygon.io"""
        try:
            if self.polygon_key == 'demo':
                return None
                
            url = f"https://api.polygon.io/v2/aggs/ticker/{symbol}/prev"
            params = {'apikey': self.polygon_key}
            
            response = requests.get(url, params=params, timeout=10)
            data = response.json()
            
            if 'results' not in data or not data['results']:
                return None
            
            result = data['results'][0]
            
            return {
                'symbol': symbol,
                'current_price': float(result['c']),  # close
                'open_price': float(result['o']),     # open
                'high_price': float(result['h']),     # high
                'low_price': float(result['l']),      # low
                'volume': int(result['v']),           # volume
                'price_change': float(result['c'] - result['o']),
                'price_change_pct': ((result['c'] - result['o']) / result['o']) * 100,
                'timestamp': datetime.now().isoformat(),
                'source': 'polygon'
            }
            
        except Exception as e:
            self.logger.error(f"Polygon error for {symbol}: {e}")
            return None
    
    def get_multiple_prices(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get prices for multiple symbols concurrently"""
        results = {}
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Submit all requests
            future_to_symbol = {
                executor.submit(self.get_live_price, symbol): symbol 
                for symbol in symbols
            }
            
            # Collect results
            for future in as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                try:
                    data = future.result()
                    if data:
                        results[symbol] = data
                except Exception as e:
                    self.logger.error(f"Error getting price for {symbol}: {e}")
        
        return results
    
    def get_historical_data(self, symbol: str, period: str = "1y", interval: str = "1d") -> Optional[pd.DataFrame]:
        """Get historical data for backtesting and training"""
        try:
            ticker = yf.Ticker(symbol)
            hist = ticker.history(period=period, interval=interval)
            
            if hist.empty:
                return None
            
            # Add technical indicators
            hist['SMA_20'] = hist['Close'].rolling(window=20).mean()
            hist['SMA_50'] = hist['Close'].rolling(window=50).mean()
            hist['RSI'] = self._calculate_rsi(hist['Close'])
            hist['MACD'], hist['MACD_Signal'] = self._calculate_macd(hist['Close'])
            hist['Volatility'] = hist['Close'].pct_change().rolling(window=20).std()
            
            return hist
            
        except Exception as e:
            self.logger.error(f"Error getting historical data for {symbol}: {e}")
            return None
    
    def _calculate_rsi(self, prices: pd.Series, window: int = 14) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def _calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series]:
        """Calculate MACD indicator"""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        macd = ema_fast - ema_slow
        macd_signal = macd.ewm(span=signal).mean()
        return macd, macd_signal
    
    def get_market_status(self) -> Dict:
        """Get current market status"""
        try:
            now = datetime.now()
            
            # US Market hours (EST)
            us_open = now.replace(hour=9, minute=30, second=0, microsecond=0)
            us_close = now.replace(hour=16, minute=0, second=0, microsecond=0)
            
            # Check if it's a weekday
            is_weekday = now.weekday() < 5
            
            us_market_open = is_weekday and us_open <= now <= us_close
            
            return {
                'us_market_open': us_market_open,
                'crypto_market_open': True,  # Crypto markets are always open
                'current_time': now.isoformat(),
                'next_us_open': us_open.isoformat() if not us_market_open else None,
                'next_us_close': us_close.isoformat() if us_market_open else None
            }
            
        except Exception as e:
            self.logger.error(f"Error getting market status: {e}")
            return {'error': str(e)}
    
    def get_supported_instruments(self) -> Dict:
        """Get list of supported instruments"""
        return self.instruments
    
    def validate_symbol(self, symbol: str) -> bool:
        """Validate if symbol is supported"""
        return symbol in self.instruments

# Global instance
real_market_data = RealMarketDataProvider()

def get_live_market_data(symbols: List[str]) -> Dict:
    """Get live market data for multiple symbols"""
    return real_market_data.get_multiple_prices(symbols)

def get_single_price(symbol: str) -> Optional[Dict]:
    """Get live price for a single symbol"""
    return real_market_data.get_live_price(symbol)
