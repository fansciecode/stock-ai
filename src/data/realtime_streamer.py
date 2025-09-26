#!/usr/bin/env python3
"""
Real-Time Data Streaming System
Collects continuous market data from multiple sources for AI training
"""

import asyncio
import websockets
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import threading
import time
import queue
import os
import sys
from pathlib import Path
import sqlite3
import ccxt
import yfinance as yf

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from features.build_features import FeatureEngineer
from labeling.label_pipeline import LabelingPipeline

class RealTimeDataStreamer:
    """Real-time data streaming and collection system"""
    
    def __init__(self, config_file="configs/data_sources.yaml"):
        self.config_file = config_file
        self.data_queue = queue.Queue(maxsize=10000)
        self.is_running = False
        self.streams = {}
        self.data_buffer = {}
        self.feature_engineer = FeatureEngineer()
        self.labeling_pipeline = LabelingPipeline()
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Setup database for continuous storage
        self.setup_database()
        
        # Market data sources
        self.crypto_exchange = ccxt.binance()
        self.stock_symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']
        self.crypto_symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'DOT/USDT']
        
    def setup_database(self):
        """Setup SQLite database for continuous data storage"""
        
        db_dir = Path("data/realtime")
        db_dir.mkdir(parents=True, exist_ok=True)
        
        self.db_path = db_dir / "realtime_data.db"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Raw market data table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS market_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME,
                    instrument TEXT,
                    source TEXT,
                    open REAL,
                    high REAL,
                    low REAL,
                    close REAL,
                    volume REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Features table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS features (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME,
                    instrument TEXT,
                    feature_data TEXT,  -- JSON blob
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Signals table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS signals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME,
                    instrument TEXT,
                    strategy TEXT,
                    side INTEGER,
                    confidence REAL,
                    entry_price REAL,
                    stop_loss REAL,
                    take_profit REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_market_timestamp ON market_data(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_market_instrument ON market_data(instrument)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_features_timestamp ON features(timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp)')
            
            conn.commit()
        
        self.logger.info(f"Database setup complete: {self.db_path}")
    
    async def stream_crypto_data(self):
        """Stream cryptocurrency data using WebSocket"""
        
        while self.is_running:
            try:
                for symbol in self.crypto_symbols:
                    try:
                        # Fetch latest OHLCV data
                        ohlcv = self.crypto_exchange.fetch_ohlcv(symbol, '1m', limit=1)
                        
                        if ohlcv:
                            data = {
                                'timestamp': datetime.fromtimestamp(ohlcv[0][0] / 1000),
                                'instrument': symbol.replace('/', '_'),
                                'source': 'binance',
                                'open': ohlcv[0][1],
                                'high': ohlcv[0][2],
                                'low': ohlcv[0][3],
                                'close': ohlcv[0][4],
                                'volume': ohlcv[0][5]
                            }
                            
                            await self.process_data_point(data)
                            
                    except Exception as e:
                        self.logger.error(f"Error fetching {symbol}: {e}")
                
                await asyncio.sleep(60)  # 1-minute intervals
                
            except Exception as e:
                self.logger.error(f"Crypto streaming error: {e}")
                await asyncio.sleep(5)
    
    async def stream_stock_data(self):
        """Stream stock data"""
        
        while self.is_running:
            try:
                for symbol in self.stock_symbols:
                    try:
                        ticker = yf.Ticker(symbol)
                        hist = ticker.history(period='1d', interval='1m')
                        
                        if not hist.empty:
                            latest = hist.iloc[-1]
                            data = {
                                'timestamp': latest.name.to_pydatetime(),
                                'instrument': symbol,
                                'source': 'yahoo',
                                'open': latest['Open'],
                                'high': latest['High'],
                                'low': latest['Low'],
                                'close': latest['Close'],
                                'volume': latest['Volume']
                            }
                            
                            await self.process_data_point(data)
                            
                    except Exception as e:
                        self.logger.error(f"Error fetching {symbol}: {e}")
                
                await asyncio.sleep(60)  # 1-minute intervals
                
            except Exception as e:
                self.logger.error(f"Stock streaming error: {e}")
                await asyncio.sleep(5)
    
    async def process_data_point(self, data):
        """Process incoming data point"""
        
        try:
            # Store raw data
            self.store_market_data(data)
            
            # Add to buffer for feature engineering
            instrument = data['instrument']
            if instrument not in self.data_buffer:
                self.data_buffer[instrument] = []
            
            self.data_buffer[instrument].append(data)
            
            # Keep last 200 points for feature engineering
            if len(self.data_buffer[instrument]) > 200:
                self.data_buffer[instrument] = self.data_buffer[instrument][-200:]
            
            # Process features and signals if we have enough data
            if len(self.data_buffer[instrument]) >= 100:
                await self.generate_features_and_signals(instrument)
            
        except Exception as e:
            self.logger.error(f"Error processing data point: {e}")
    
    def store_market_data(self, data):
        """Store market data in database"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO market_data 
                    (timestamp, instrument, source, open, high, low, close, volume)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    data['timestamp'],
                    data['instrument'],
                    data['source'],
                    data['open'],
                    data['high'],
                    data['low'],
                    data['close'],
                    data['volume']
                ))
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing market data: {e}")
    
    async def generate_features_and_signals(self, instrument):
        """Generate features and trading signals for instrument"""
        
        try:
            # Convert buffer to DataFrame
            df = pd.DataFrame(self.data_buffer[instrument])
            df['ts'] = df['timestamp']
            df = df.sort_values('ts').reset_index(drop=True)
            
            # Generate features
            features_df = self.feature_engineer.build_all_features(df)
            
            if not features_df.empty:
                # Store features
                latest_features = features_df.iloc[-1]
                feature_data = {
                    col: float(latest_features[col]) 
                    for col in self.feature_engineer.feature_columns 
                    if pd.notna(latest_features[col])
                }
                
                self.store_features(latest_features['ts'], instrument, feature_data)
                
                # Generate trading signals
                signals = self.labeling_pipeline.strategy_manager.generate_all_signals(features_df.tail(50))
                
                if not signals.empty:
                    for _, signal in signals.iterrows():
                        self.store_signal(signal)
                        
                        # Log significant signals
                        if signal.get('confidence', 0) > 0.7:
                            self.logger.info(
                                f"🚨 HIGH CONFIDENCE SIGNAL: {signal['instrument']} "
                                f"{signal.get('strategy_type', 'UNKNOWN')} "
                                f"Side: {signal.get('side', 0)} "
                                f"Confidence: {signal.get('confidence', 0):.3f}"
                            )
                            
        except Exception as e:
            self.logger.error(f"Error generating features/signals for {instrument}: {e}")
    
    def store_features(self, timestamp, instrument, feature_data):
        """Store features in database"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO features (timestamp, instrument, feature_data)
                    VALUES (?, ?, ?)
                ''', (timestamp, instrument, json.dumps(feature_data)))
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing features: {e}")
    
    def store_signal(self, signal):
        """Store trading signal in database"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO signals 
                    (timestamp, instrument, strategy, side, confidence, entry_price, stop_loss, take_profit)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    signal.get('ts', datetime.now()),
                    signal.get('instrument', ''),
                    signal.get('strategy', ''),
                    signal.get('side', 0),
                    signal.get('confidence', 0),
                    signal.get('entry', 0),
                    signal.get('stop_loss', 0),
                    signal.get('take_profit', 0)
                ))
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"Error storing signal: {e}")
    
    async def start_streaming(self):
        """Start all data streams"""
        
        self.logger.info("🚀 Starting real-time data streaming...")
        self.is_running = True
        
        # Start multiple streams concurrently
        streams = [
            self.stream_crypto_data(),
            self.stream_stock_data(),
            self.monitoring_loop()
        ]
        
        await asyncio.gather(*streams)
    
    async def monitoring_loop(self):
        """Monitor system performance and data collection"""
        
        while self.is_running:
            try:
                # Check data collection stats
                with sqlite3.connect(self.db_path) as conn:
                    cursor = conn.cursor()
                    
                    # Count recent data points
                    cursor.execute('''
                        SELECT COUNT(*) FROM market_data 
                        WHERE created_at > datetime('now', '-1 hour')
                    ''')
                    recent_data_points = cursor.fetchone()[0]
                    
                    # Count recent signals
                    cursor.execute('''
                        SELECT COUNT(*) FROM signals 
                        WHERE created_at > datetime('now', '-1 hour')
                    ''')
                    recent_signals = cursor.fetchone()[0]
                    
                    # Count total records
                    cursor.execute('SELECT COUNT(*) FROM market_data')
                    total_data_points = cursor.fetchone()[0]
                    
                    cursor.execute('SELECT COUNT(*) FROM signals')
                    total_signals = cursor.fetchone()[0]
                
                self.logger.info(
                    f"📊 Data Collection Status: "
                    f"Recent Data: {recent_data_points}/hour, "
                    f"Recent Signals: {recent_signals}/hour, "
                    f"Total Data: {total_data_points:,}, "
                    f"Total Signals: {total_signals:,}"
                )
                
                # Export data periodically for training
                if total_data_points % 1000 == 0 and total_data_points > 0:
                    await self.export_training_data()
                
                await asyncio.sleep(300)  # 5-minute monitoring intervals
                
            except Exception as e:
                self.logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(60)
    
    async def export_training_data(self):
        """Export collected data for model training"""
        
        try:
            self.logger.info("📦 Exporting training data...")
            
            with sqlite3.connect(self.db_path) as conn:
                # Export market data
                market_df = pd.read_sql_query('''
                    SELECT timestamp as ts, instrument, open, high, low, close, volume
                    FROM market_data 
                    ORDER BY timestamp DESC 
                    LIMIT 10000
                ''', conn)
                
                if not market_df.empty:
                    market_df.to_parquet("data/realtime_market_data.parquet", index=False)
                    
                    # Generate features for the exported data
                    features_df = self.feature_engineer.build_all_features(market_df)
                    features_df.to_parquet("data/realtime_features.parquet", index=False)
                    
                    # Export signals
                    signals_df = pd.read_sql_query('''
                        SELECT timestamp as ts, instrument, strategy, side, confidence, 
                               entry_price as entry, stop_loss, take_profit
                        FROM signals 
                        ORDER BY timestamp DESC 
                        LIMIT 5000
                    ''', conn)
                    
                    if not signals_df.empty:
                        signals_df.to_parquet("data/realtime_labels.parquet", index=False)
                    
                    self.logger.info(
                        f"✅ Exported: {len(market_df)} market data points, "
                        f"{len(features_df)} feature rows, {len(signals_df)} signals"
                    )
                
        except Exception as e:
            self.logger.error(f"Error exporting training data: {e}")
    
    def stop_streaming(self):
        """Stop all data streams"""
        self.logger.info("🛑 Stopping data streaming...")
        self.is_running = False
    
    def get_recent_signals(self, hours=1, min_confidence=0.6):
        """Get recent high-confidence signals"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                query = '''
                    SELECT * FROM signals 
                    WHERE created_at > datetime('now', '-{} hour')
                    AND confidence >= ?
                    ORDER BY created_at DESC
                '''.format(hours)
                
                df = pd.read_sql_query(query, conn, params=[min_confidence])
                return df
                
        except Exception as e:
            self.logger.error(f"Error getting recent signals: {e}")
            return pd.DataFrame()
    
    def get_data_statistics(self):
        """Get data collection statistics"""
        
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                stats = {}
                
                # Market data stats
                cursor.execute('SELECT COUNT(*) FROM market_data')
                stats['total_market_data'] = cursor.fetchone()[0]
                
                cursor.execute('SELECT COUNT(DISTINCT instrument) FROM market_data')
                stats['unique_instruments'] = cursor.fetchone()[0]
                
                cursor.execute('SELECT MIN(timestamp), MAX(timestamp) FROM market_data')
                time_range = cursor.fetchone()
                stats['data_time_range'] = time_range
                
                # Signal stats
                cursor.execute('SELECT COUNT(*) FROM signals')
                stats['total_signals'] = cursor.fetchone()[0]
                
                cursor.execute('''
                    SELECT strategy, COUNT(*) as count 
                    FROM signals 
                    GROUP BY strategy
                ''')
                stats['signals_by_strategy'] = dict(cursor.fetchall())
                
                cursor.execute('''
                    SELECT AVG(confidence) FROM signals 
                    WHERE confidence > 0
                ''')
                avg_confidence = cursor.fetchone()[0]
                stats['average_confidence'] = avg_confidence if avg_confidence else 0
                
                return stats
                
        except Exception as e:
            self.logger.error(f"Error getting statistics: {e}")
            return {}

async def main():
    """Main function to run the streaming system"""
    
    streamer = RealTimeDataStreamer()
    
    try:
        await streamer.start_streaming()
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal, shutting down...")
        streamer.stop_streaming()
    except Exception as e:
        print(f"❌ Streaming error: {e}")
        streamer.stop_streaming()

if __name__ == "__main__":
    asyncio.run(main())
