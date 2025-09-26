#!/usr/bin/env python3
"""
Global Market Data Service - Multi-Exchange Data Collection
Supports NSE, BSE, NYSE, NASDAQ, LSE, and major crypto exchanges worldwide
"""

import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import json
import time
import sys
import os
from typing import Dict, List, Optional
import requests
from concurrent.futures import ThreadPoolExecutor
import threading

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Market data providers
import yfinance as yf
import ccxt

class GlobalMarketService:
    """Comprehensive global market data service"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.latest_data = {}
        self.is_running = False
        
        # Setup exchanges
        self.setup_exchanges()
        
        # Setup instrument lists
        self.setup_instruments()
        
        # Data quality tracking
        self.data_stats = {
            "total_fetched": 0,
            "successful_fetches": 0,
            "failed_fetches": 0,
            "last_update": None
        }
    
    def setup_exchanges(self):
        """Setup all supported exchanges"""
        
        # Crypto exchanges
        self.crypto_exchanges = {
            'binance': ccxt.binance(),
            'coinbase': ccxt.coinbasepro() if hasattr(ccxt, 'coinbasepro') else None,
            'kraken': ccxt.kraken(),
            'bybit': ccxt.bybit() if hasattr(ccxt, 'bybit') else None,
        }
        
        # Remove None exchanges
        self.crypto_exchanges = {k: v for k, v in self.crypto_exchanges.items() if v is not None}
        
        self.logger.info(f"Initialized {len(self.crypto_exchanges)} crypto exchanges")
    
    def setup_instruments(self):
        """Setup comprehensive instrument lists for all major markets"""
        
        # Indian Markets (NSE/BSE)
        self.indian_stocks = {
            # NSE Top 50 (Nifty 50)
            'nse_nifty50': [
                'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS',
                'ICICIBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ASIANPAINT.NS',
                'ITC.NS', 'AXISBANK.NS', 'LT.NS', 'DMART.NS', 'SUNPHARMA.NS',
                'TITAN.NS', 'ULTRACEMCO.NS', 'NESTLEIND.NS', 'WIPRO.NS', 'MARUTI.NS',
                'NTPC.NS', 'POWERGRID.NS', 'BAJFINANCE.NS', 'M&M.NS', 'TECHM.NS',
                'HCLTECH.NS', 'COALINDIA.NS', 'INDUSINDBK.NS', 'TATAMOTORS.NS', 'GRASIM.NS',
                'ADANIENT.NS', 'JSWSTEEL.NS', 'HINDALCO.NS', 'TATASTEEL.NS', 'CIPLA.NS',
                'BRITANNIA.NS', 'DRREDDY.NS', 'EICHERMOT.NS', 'APOLLOHOSP.NS', 'DIVISLAB.NS',
                'BAJAJFINSV.NS', 'HEROMOTOCO.NS', 'ONGC.NS', 'SHRIRAMFIN.NS', 'UPL.NS',
                'TRENT.NS', 'LTIM.NS', 'ADANIPORTS.NS', 'SBILIFE.NS', 'HDFCLIFE.NS'
            ],
            
            # BSE Sensex
            'bse_sensex': [
                'RELIANCE.BO', 'TCS.BO', 'HDFCBANK.BO', 'INFY.BO', 'ICICIBANK.BO',
                'KOTAKBANK.BO', 'HINDUNILVR.BO', 'SBIN.BO', 'BHARTIARTL.BO', 'ITC.BO',
                'ASIANPAINT.BO', 'AXISBANK.BO', 'LT.BO', 'SUNPHARMA.BO', 'TITAN.BO',
                'ULTRACEMCO.BO', 'NESTLEIND.BO', 'WIPRO.BO', 'MARUTI.BO', 'NTPC.BO',
                'POWERGRID.BO', 'BAJFINANCE.BO', 'M&M.BO', 'TECHM.BO', 'HCLTECH.BO',
                'COALINDIA.BO', 'INDUSINDBK.BO', 'TATAMOTORS.BO', 'JSWSTEEL.BO', 'HINDALCO.BO'
            ],
            
            # Additional Indian stocks
            'indian_popular': [
                'ADANIGREEN.NS', 'ZOMATO.NS', 'PAYTM.NS', 'NYKAA.NS', 'POLICYBZR.NS',
                'IRCTC.NS', 'HAL.NS', 'BEL.NS', 'SAIL.NS', 'NMDC.NS'
            ]
        }
        
        # US Markets (NYSE/NASDAQ)
        self.us_stocks = {
            # FAANG + Tech Giants
            'tech_giants': [
                'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'NVDA', 'NFLX',
                'ADBE', 'CRM', 'ORCL', 'INTC', 'AMD', 'QCOM', 'AVGO', 'TXN'
            ],
            
            # S&P 500 Top Holdings
            'sp500_top': [
                'AAPL', 'MSFT', 'AMZN', 'NVDA', 'GOOGL', 'TSLA', 'META', 'UNH',
                'XOM', 'LLY', 'V', 'JNJ', 'WMT', 'JPM', 'PG', 'MA', 'AVGO', 'HD',
                'CVX', 'MRK', 'COST', 'ABBV', 'PEP', 'KO', 'BAC', 'TMO', 'MCD'
            ],
            
            # Popular Trading Stocks
            'popular_trading': [
                'SPY', 'QQQ', 'IWM', 'VTI', 'GME', 'AMC', 'BB', 'NOK', 'PLTR',
                'COIN', 'HOOD', 'SQ', 'PYPL', 'ZM', 'SHOP', 'ROKU', 'DKNG'
            ]
        }
        
        # European Markets
        self.european_stocks = {
            # UK (LSE)
            'uk_ftse': [
                'SHEL.L', 'AZN.L', 'LSEG.L', 'UU.L', 'DIAGEO.L', 'BP.L', 'RIO.L',
                'HSBA.L', 'VODAFONE.L', 'BT-A.L', 'LLOY.L', 'BARC.L', 'TESCO.L'
            ],
            
            # Germany (Frankfurt)
            'german_dax': [
                'SAP.DE', 'ASME.DE', 'SIE.DE', 'ALV.DE', 'DTE.DE', 'BAS.DE',
                'VOW3.DE', 'BMW.DE', 'EOAN.DE', 'MUV2.DE', 'ADS.DE', 'LIN.DE'
            ]
        }
        
        # Asian Markets
        self.asian_stocks = {
            # Japan (TSE)
            'japan_nikkei': [
                'TSM', 'SONY', 'NTT', 'TM', 'MUFG', 'SMFG', 'HMC', 'ASML'
            ],
            
            # China
            'chinese_adrs': [
                'BABA', 'PDD', 'JD', 'BIDU', 'NIO', 'XPEV', 'LI', 'DIDI',
                'TME', 'NTES', 'WB', 'BILI', 'EDU', 'TAL'
            ]
        }
        
        # Cryptocurrency Markets
        self.crypto_instruments = {
            # Major Cryptos
            'major_crypto': [
                'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'ADA/USDT',
                'SOL/USDT', 'DOGE/USDT', 'DOT/USDT', 'MATIC/USDT', 'SHIB/USDT'
            ],
            
            # DeFi Tokens
            'defi_tokens': [
                'UNI/USDT', 'LINK/USDT', 'AAVE/USDT', 'MKR/USDT', 'COMP/USDT',
                'SUSHI/USDT', 'YFI/USDT', 'CRV/USDT', 'BAL/USDT', 'SNX/USDT'
            ],
            
            # Layer 1 Blockchains
            'layer1_tokens': [
                'ETH/USDT', 'SOL/USDT', 'ADA/USDT', 'AVAX/USDT', 'LUNA/USDT',
                'ALGO/USDT', 'ATOM/USDT', 'NEAR/USDT', 'FTM/USDT', 'ONE/USDT'
            ]
        }
        
        # Forex Major Pairs
        self.forex_pairs = [
            'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X',
            'USDCAD=X', 'NZDUSD=X', 'EURGBP=X', 'EURJPY=X', 'GBPJPY=X'
        ]
        
        # Commodities
        self.commodities = [
            'GC=F',  # Gold
            'SI=F',  # Silver
            'CL=F',  # Crude Oil
            'NG=F',  # Natural Gas
            'HG=F',  # Copper
            'ZC=F',  # Corn
            'ZS=F',  # Soybeans
            'KC=F',  # Coffee
            'SB=F',  # Sugar
            'CT=F'   # Cotton
        ]
        
        self.logger.info("Initialized instruments for all major global markets")
        self._log_instrument_summary()
    
    def _log_instrument_summary(self):
        """Log summary of available instruments"""
        
        total_indian = sum(len(stocks) for stocks in self.indian_stocks.values())
        total_us = sum(len(stocks) for stocks in self.us_stocks.values())
        total_european = sum(len(stocks) for stocks in self.european_stocks.values())
        total_asian = sum(len(stocks) for stocks in self.asian_stocks.values())
        total_crypto = sum(len(crypto) for crypto in self.crypto_instruments.values())
        total_forex = len(self.forex_pairs)
        total_commodities = len(self.commodities)
        
        total_instruments = total_indian + total_us + total_european + total_asian + total_crypto + total_forex + total_commodities
        
        self.logger.info(f"📊 GLOBAL INSTRUMENT COVERAGE:")
        self.logger.info(f"  🇮🇳 Indian Markets (NSE/BSE): {total_indian} instruments")
        self.logger.info(f"  🇺🇸 US Markets (NYSE/NASDAQ): {total_us} instruments")
        self.logger.info(f"  🇪🇺 European Markets: {total_european} instruments")
        self.logger.info(f"  🇯🇵 Asian Markets: {total_asian} instruments")
        self.logger.info(f"  💰 Cryptocurrency: {total_crypto} instruments")
        self.logger.info(f"  💱 Forex Pairs: {total_forex} instruments")
        self.logger.info(f"  🥇 Commodities: {total_commodities} instruments")
        self.logger.info(f"  📈 TOTAL: {total_instruments} instruments across all markets")
    
    async def collect_indian_market_data(self):
        """Collect data from Indian markets (NSE/BSE)"""
        
        while self.is_running:
            try:
                self.logger.info("🇮🇳 Collecting Indian market data (NSE/BSE)...")
                
                # Collect during Indian market hours (9:15 AM - 3:30 PM IST)
                indian_time = datetime.now() + timedelta(hours=5.5)  # IST offset
                market_open = indian_time.replace(hour=9, minute=15, second=0, microsecond=0)
                market_close = indian_time.replace(hour=15, minute=30, second=0, microsecond=0)
                
                is_market_hours = market_open <= indian_time <= market_close
                
                # Collect from all Indian stock categories
                all_indian_stocks = []
                for category, stocks in self.indian_stocks.items():
                    all_indian_stocks.extend(stocks)
                
                # Limit to top stocks for efficiency
                top_indian_stocks = all_indian_stocks[:50]  # Top 50 for performance
                
                for symbol in top_indian_stocks:
                    try:
                        ticker = yf.Ticker(symbol)
                        hist = ticker.history(period='1d', interval='5m')
                        
                        if not hist.empty and len(hist) > 0:
                            # Convert to our format
                            df = hist.reset_index()
                            df['ts'] = df['Datetime']
                            df['open'] = df['Open']
                            df['high'] = df['High']
                            df['low'] = df['Low']
                            df['close'] = df['Close']
                            df['volume'] = df['Volume']
                            df['instrument'] = symbol.replace('.NS', '_NSE').replace('.BO', '_BSE')
                            
                            # Store latest data
                            self.latest_data[df['instrument'].iloc[0]] = df.tail(5)
                            
                            latest_price = df['close'].iloc[-1]
                            market_status = "🟢 OPEN" if is_market_hours else "🔴 CLOSED"
                            
                            self.logger.info(f"  ✅ {symbol:>15}: ₹{latest_price:>8,.2f} {market_status}")
                            
                            self.data_stats["successful_fetches"] += 1
                        
                    except Exception as e:
                        self.logger.warning(f"  ⚠️ {symbol:>15}: {str(e)[:50]}")
                        self.data_stats["failed_fetches"] += 1
                    
                    self.data_stats["total_fetched"] += 1
                
                # Sleep longer when market is closed
                sleep_time = 300 if is_market_hours else 1800  # 5min vs 30min
                await asyncio.sleep(sleep_time)
                
            except Exception as e:
                self.logger.error(f"Indian market data collection error: {e}")
                await asyncio.sleep(300)
    
    async def collect_us_market_data(self):
        """Collect data from US markets (NYSE/NASDAQ)"""
        
        while self.is_running:
            try:
                self.logger.info("🇺🇸 Collecting US market data (NYSE/NASDAQ)...")
                
                # Collect from all US stock categories
                all_us_stocks = []
                for category, stocks in self.us_stocks.items():
                    all_us_stocks.extend(stocks)
                
                # Remove duplicates and limit for performance
                unique_us_stocks = list(set(all_us_stocks))[:100]
                
                for symbol in unique_us_stocks:
                    try:
                        ticker = yf.Ticker(symbol)
                        hist = ticker.history(period='1d', interval='1m')
                        
                        if not hist.empty and len(hist) > 0:
                            # Convert to our format
                            df = hist.reset_index()
                            df['ts'] = df['Datetime']
                            df['open'] = df['Open']
                            df['high'] = df['High']
                            df['low'] = df['Low']
                            df['close'] = df['Close']
                            df['volume'] = df['Volume']
                            df['instrument'] = symbol + '_US'
                            
                            # Store latest data
                            self.latest_data[symbol + '_US'] = df.tail(5)
                            
                            latest_price = df['close'].iloc[-1]
                            self.logger.info(f"  ✅ {symbol:>8}: ${latest_price:>8,.2f}")
                            
                            self.data_stats["successful_fetches"] += 1
                        
                    except Exception as e:
                        self.logger.warning(f"  ⚠️ {symbol:>8}: {str(e)[:50]}")
                        self.data_stats["failed_fetches"] += 1
                    
                    self.data_stats["total_fetched"] += 1
                
                await asyncio.sleep(120)  # 2 minutes for US markets
                
            except Exception as e:
                self.logger.error(f"US market data collection error: {e}")
                await asyncio.sleep(300)
    
    async def collect_crypto_data_multi_exchange(self):
        """Collect crypto data from multiple exchanges"""
        
        while self.is_running:
            try:
                self.logger.info("💰 Collecting cryptocurrency data (Multi-Exchange)...")
                
                # Collect from all crypto categories
                all_crypto = []
                for category, cryptos in self.crypto_instruments.items():
                    all_crypto.extend(cryptos)
                
                # Remove duplicates
                unique_crypto = list(set(all_crypto))
                
                for symbol in unique_crypto:
                    # Try each exchange until successful
                    collected = False
                    
                    for exchange_name, exchange in self.crypto_exchanges.items():
                        if collected:
                            break
                        
                        try:
                            ohlcv = exchange.fetch_ohlcv(symbol, '1m', limit=5)
                            
                            if ohlcv:
                                # Convert to DataFrame
                                df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                                df['ts'] = pd.to_datetime(df['timestamp'], unit='ms')
                                df['instrument'] = symbol.replace('/', '_') + f'_{exchange_name.upper()}'
                                
                                # Store latest data
                                self.latest_data[df['instrument'].iloc[0]] = df
                                
                                latest_price = df['close'].iloc[-1]
                                self.logger.info(f"  ✅ {symbol:>12} ({exchange_name}): ${latest_price:>10,.2f}")
                                
                                self.data_stats["successful_fetches"] += 1
                                collected = True
                        
                        except Exception as e:
                            continue  # Try next exchange
                    
                    if not collected:
                        self.logger.warning(f"  ⚠️ {symbol:>12}: No exchange available")
                        self.data_stats["failed_fetches"] += 1
                    
                    self.data_stats["total_fetched"] += 1
                
                await asyncio.sleep(60)  # 1 minute for crypto
                
            except Exception as e:
                self.logger.error(f"Crypto data collection error: {e}")
                await asyncio.sleep(120)
    
    async def collect_forex_commodity_data(self):
        """Collect forex and commodity data"""
        
        while self.is_running:
            try:
                self.logger.info("💱 Collecting Forex & Commodities data...")
                
                # Combine forex and commodities
                all_instruments = self.forex_pairs + self.commodities
                
                for symbol in all_instruments:
                    try:
                        ticker = yf.Ticker(symbol)
                        hist = ticker.history(period='1d', interval='5m')
                        
                        if not hist.empty and len(hist) > 0:
                            # Convert to our format
                            df = hist.reset_index()
                            df['ts'] = df['Datetime']
                            df['open'] = df['Open']
                            df['high'] = df['High']
                            df['low'] = df['Low']
                            df['close'] = df['Close']
                            df['volume'] = df['Volume']
                            
                            # Categorize instrument
                            if '=X' in symbol:
                                df['instrument'] = symbol.replace('=X', '_FX')
                                category = "FX"
                            elif '=F' in symbol:
                                df['instrument'] = symbol.replace('=F', '_COMM')
                                category = "COMM"
                            else:
                                df['instrument'] = symbol
                                category = "OTHER"
                            
                            # Store latest data
                            self.latest_data[df['instrument'].iloc[0]] = df.tail(5)
                            
                            latest_price = df['close'].iloc[-1]
                            self.logger.info(f"  ✅ {symbol:>10} ({category}): {latest_price:>10,.4f}")
                            
                            self.data_stats["successful_fetches"] += 1
                        
                    except Exception as e:
                        self.logger.warning(f"  ⚠️ {symbol:>10}: {str(e)[:50]}")
                        self.data_stats["failed_fetches"] += 1
                    
                    self.data_stats["total_fetched"] += 1
                
                await asyncio.sleep(300)  # 5 minutes for forex/commodities
                
            except Exception as e:
                self.logger.error(f"Forex/Commodity data collection error: {e}")
                await asyncio.sleep(300)
    
    async def collect_european_asian_data(self):
        """Collect European and Asian market data"""
        
        while self.is_running:
            try:
                self.logger.info("🌍 Collecting European & Asian market data...")
                
                # Combine European and Asian stocks
                all_stocks = []
                for category, stocks in self.european_stocks.items():
                    all_stocks.extend(stocks)
                for category, stocks in self.asian_stocks.items():
                    all_stocks.extend(stocks)
                
                for symbol in all_stocks:
                    try:
                        ticker = yf.Ticker(symbol)
                        hist = ticker.history(period='1d', interval='5m')
                        
                        if not hist.empty and len(hist) > 0:
                            # Convert to our format
                            df = hist.reset_index()
                            df['ts'] = df['Datetime']
                            df['open'] = df['Open']
                            df['high'] = df['High']
                            df['low'] = df['Low']
                            df['close'] = df['Close']
                            df['volume'] = df['Volume']
                            
                            # Determine market
                            if '.L' in symbol:
                                df['instrument'] = symbol.replace('.L', '_LSE')
                                market = "LSE"
                            elif '.DE' in symbol:
                                df['instrument'] = symbol.replace('.DE', '_XETRA')
                                market = "XETRA"
                            else:
                                df['instrument'] = symbol + '_GLOBAL'
                                market = "GLOBAL"
                            
                            # Store latest data
                            self.latest_data[df['instrument'].iloc[0]] = df.tail(5)
                            
                            latest_price = df['close'].iloc[-1]
                            self.logger.info(f"  ✅ {symbol:>12} ({market}): {latest_price:>10,.2f}")
                            
                            self.data_stats["successful_fetches"] += 1
                        
                    except Exception as e:
                        self.logger.warning(f"  ⚠️ {symbol:>12}: {str(e)[:50]}")
                        self.data_stats["failed_fetches"] += 1
                    
                    self.data_stats["total_fetched"] += 1
                
                await asyncio.sleep(600)  # 10 minutes for international markets
                
            except Exception as e:
                self.logger.error(f"European/Asian data collection error: {e}")
                await asyncio.sleep(300)
    
    async def save_combined_data(self):
        """Save all collected data to files"""
        
        while self.is_running:
            try:
                if self.latest_data:
                    self.logger.info("💾 Saving combined global market data...")
                    
                    # Combine all data
                    all_data = []
                    for instrument, data in self.latest_data.items():
                        if data is not None and not data.empty:
                            data_copy = data.copy()
                            if 'instrument' not in data_copy.columns:
                                data_copy['instrument'] = instrument
                            all_data.append(data_copy)
                    
                    if all_data:
                        combined_data = pd.concat(all_data, ignore_index=True)
                        
                        # Fix timezone issues
                        if 'ts' in combined_data.columns:
                            combined_data['ts'] = pd.to_datetime(combined_data['ts']).dt.tz_localize(None)
                        
                        # Sort and keep recent data
                        combined_data = combined_data.sort_values('ts').tail(10000)
                        
                        # Save main file
                        combined_data.to_parquet("data/global_market_data.parquet", index=False)
                        
                        # Also save as live_market_data for API compatibility
                        combined_data.to_parquet("data/live_market_data.parquet", index=False)
                        
                        # Save statistics
                        self.data_stats["last_update"] = datetime.now().isoformat()
                        self.data_stats["total_instruments"] = len(self.latest_data)
                        self.data_stats["total_records"] = len(combined_data)
                        
                        with open("data/global_market_stats.json", 'w') as f:
                            json.dump(self.data_stats, f, indent=2, default=str)
                        
                        self.logger.info(f"  📊 Saved {len(combined_data)} records from {len(self.latest_data)} instruments")
                        
                        # Log market summary
                        market_summary = combined_data.groupby('instrument')['close'].last().to_dict()
                        
                        # Categorize by market
                        indian_count = sum(1 for k in market_summary.keys() if '_NSE' in k or '_BSE' in k)
                        us_count = sum(1 for k in market_summary.keys() if '_US' in k)
                        crypto_count = sum(1 for k in market_summary.keys() if 'USDT' in k or 'BTC' in k or 'ETH' in k)
                        
                        self.logger.info(f"  🇮🇳 Indian markets: {indian_count} instruments")
                        self.logger.info(f"  🇺🇸 US markets: {us_count} instruments")
                        self.logger.info(f"  💰 Crypto markets: {crypto_count} instruments")
                        self.logger.info(f"  🌍 Other markets: {len(market_summary) - indian_count - us_count - crypto_count} instruments")
                
                await asyncio.sleep(180)  # Save every 3 minutes
                
            except Exception as e:
                self.logger.error(f"Error saving combined data: {e}")
                await asyncio.sleep(300)
    
    async def start_global_collection(self):
        """Start collecting data from all global markets"""
        
        self.logger.info("🌍 STARTING GLOBAL MARKET DATA COLLECTION")
        self.logger.info("=" * 80)
        self.is_running = True
        
        # Start all collection tasks
        tasks = [
            self.collect_indian_market_data(),
            self.collect_us_market_data(),
            self.collect_crypto_data_multi_exchange(),
            self.collect_forex_commodity_data(),
            self.collect_european_asian_data(),
            self.save_combined_data(),
            self.monitor_collection_performance()
        ]
        
        await asyncio.gather(*tasks)
    
    async def monitor_collection_performance(self):
        """Monitor data collection performance"""
        
        while self.is_running:
            try:
                await asyncio.sleep(600)  # Monitor every 10 minutes
                
                success_rate = 0
                if self.data_stats["total_fetched"] > 0:
                    success_rate = (self.data_stats["successful_fetches"] / self.data_stats["total_fetched"]) * 100
                
                self.logger.info("📊 GLOBAL DATA COLLECTION PERFORMANCE:")
                self.logger.info(f"  Total Instruments: {len(self.latest_data)}")
                self.logger.info(f"  Total Fetches: {self.data_stats['total_fetched']}")
                self.logger.info(f"  Successful: {self.data_stats['successful_fetches']}")
                self.logger.info(f"  Failed: {self.data_stats['failed_fetches']}")
                self.logger.info(f"  Success Rate: {success_rate:.1f}%")
                
            except Exception as e:
                self.logger.error(f"Performance monitoring error: {e}")
    
    def stop_collection(self):
        """Stop data collection"""
        self.logger.info("🛑 Stopping global market data collection...")
        self.is_running = False
    
    def get_collection_summary(self):
        """Get summary of collected data"""
        
        summary = {
            "total_instruments": len(self.latest_data),
            "data_stats": self.data_stats,
            "market_breakdown": {},
            "latest_prices": {}
        }
        
        # Categorize instruments
        for instrument, data in self.latest_data.items():
            if not data.empty:
                latest_price = float(data['close'].iloc[-1])
                summary["latest_prices"][instrument] = latest_price
                
                # Categorize by market
                if '_NSE' in instrument or '_BSE' in instrument:
                    market = "Indian"
                elif '_US' in instrument:
                    market = "US"
                elif 'USDT' in instrument or '_BINANCE' in instrument:
                    market = "Crypto"
                elif '_FX' in instrument:
                    market = "Forex"
                elif '_COMM' in instrument:
                    market = "Commodities"
                else:
                    market = "Other"
                
                if market not in summary["market_breakdown"]:
                    summary["market_breakdown"][market] = 0
                summary["market_breakdown"][market] += 1
        
        return summary

# Global service instance
global_market_service = GlobalMarketService()

async def main():
    """Main function to run the global market data service"""
    
    try:
        await global_market_service.start_global_collection()
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal, shutting down...")
        global_market_service.stop_collection()

if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    asyncio.run(main())
