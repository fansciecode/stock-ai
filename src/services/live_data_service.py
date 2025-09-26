#!/usr/bin/env python3
"""
Live Data Service - Integrates real-time market data into the trading system
Replaces synthetic data with live market feeds
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
import threading
import queue

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import ccxt
import yfinance as yf
from ingestion.load_sample import DataLoader
from features.build_features import FeatureEngineer

class LiveDataService:
    """Service that provides real-time market data to the trading system"""
    
    def __init__(self):
        self.data_loader = DataLoader()
        self.feature_engineer = FeatureEngineer()
        self.latest_data = {}
        self.latest_features = {}
        self.is_running = False
        self.update_interval = 60  # 1 minute updates
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Market data sources
        self.crypto_symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'SOL/USDT']
        self.stock_symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA']
        
        # Data storage
        self.data_history = {symbol: [] for symbol in self.crypto_symbols + self.stock_symbols}
        
    async def start_live_data_feed(self):
        """Start the live data feed service"""
        
        self.logger.info("🔴 STARTING LIVE DATA FEED SERVICE")
        self.logger.info("=" * 50)
        self.is_running = True
        
        # Start data collection tasks
        tasks = [
            self.collect_crypto_data(),
            self.collect_stock_data(),
            self.process_and_store_data(),
            self.monitor_data_quality()
        ]
        
        await asyncio.gather(*tasks)
    
    async def collect_crypto_data(self):
        """Collect real-time crypto data"""
        
        while self.is_running:
            try:
                self.logger.info("📈 Collecting live crypto data...")
                
                for symbol in self.crypto_symbols:
                    try:
                        # Get latest crypto data
                        df = self.data_loader.load_crypto_data(symbol, '1m', 5)
                        
                        if df is not None and not df.empty:
                            # Convert symbol format
                            clean_symbol = symbol.replace('/', '_')
                            
                            # Store latest data
                            self.latest_data[clean_symbol] = df
                            
                            # Add to history (keep last 200 points)
                            self.data_history[symbol].extend(df.to_dict('records'))
                            if len(self.data_history[symbol]) > 200:
                                self.data_history[symbol] = self.data_history[symbol][-200:]
                            
                            latest_price = df['close'].iloc[-1]
                            self.logger.info(f"  ✅ {symbol}: ${latest_price:,.2f}")
                        
                    except Exception as e:
                        self.logger.error(f"  ❌ Error fetching {symbol}: {e}")
                
                await asyncio.sleep(60)  # Update every minute
                
            except Exception as e:
                self.logger.error(f"Crypto data collection error: {e}")
                await asyncio.sleep(30)
    
    async def collect_stock_data(self):
        """Collect real-time stock data"""
        
        while self.is_running:
            try:
                self.logger.info("📊 Collecting live stock data...")
                
                for symbol in self.stock_symbols:
                    try:
                        # Get latest stock data
                        df = self.data_loader.load_stock_data(symbol, '1d', '1m')
                        
                        if df is not None and not df.empty:
                            # Get only recent data (last 5 points)
                            recent_df = df.tail(5).copy()
                            
                            # Store latest data
                            self.latest_data[symbol] = recent_df
                            
                            # Add to history
                            self.data_history[symbol].extend(recent_df.to_dict('records'))
                            if len(self.data_history[symbol]) > 200:
                                self.data_history[symbol] = self.data_history[symbol][-200:]
                            
                            latest_price = recent_df['close'].iloc[-1]
                            self.logger.info(f"  ✅ {symbol}: ${latest_price:.2f}")
                        
                    except Exception as e:
                        self.logger.error(f"  ❌ Error fetching {symbol}: {e}")
                
                await asyncio.sleep(120)  # Update every 2 minutes (stock market rate limits)
                
            except Exception as e:
                self.logger.error(f"Stock data collection error: {e}")
                await asyncio.sleep(60)
    
    async def process_and_store_data(self):
        """Process collected data and generate features"""
        
        while self.is_running:
            try:
                self.logger.info("⚙️ Processing and generating features...")
                
                processed_count = 0
                
                for symbol, data in self.latest_data.items():
                    if data is not None and not data.empty:
                        try:
                            # Generate features
                            features_df = self.feature_engineer.build_all_features(data)
                            
                            if not features_df.empty:
                                self.latest_features[symbol] = features_df
                                processed_count += 1
                                
                                # Save to files for API access
                                features_df.to_parquet(f"data/live_features_{symbol}.parquet", index=False)
                                data.to_parquet(f"data/live_data_{symbol}.parquet", index=False)
                        
                        except Exception as e:
                            self.logger.error(f"Error processing {symbol}: {e}")
                
                self.logger.info(f"  ✅ Processed {processed_count} instruments")
                
                # Update the main market data file with live data
                await self.update_main_data_files()
                
                await asyncio.sleep(90)  # Process every 1.5 minutes
                
            except Exception as e:
                self.logger.error(f"Data processing error: {e}")
                await asyncio.sleep(60)
    
    async def update_main_data_files(self):
        """Update main data files with live data"""
        
        try:
            # Combine all live data
            all_data = []
            all_features = []
            
            for symbol, data in self.latest_data.items():
                if data is not None and not data.empty:
                    data_copy = data.copy()
                    data_copy['instrument'] = symbol
                    all_data.append(data_copy)
            
            for symbol, features in self.latest_features.items():
                if features is not None and not features.empty:
                    features_copy = features.copy()
                    features_copy['instrument'] = symbol
                    all_features.append(features_copy)
            
            if all_data:
                # Update main market data file
                combined_data = pd.concat(all_data, ignore_index=True)
                combined_data = combined_data.sort_values('ts').tail(1000)  # Keep last 1000 points
                combined_data.to_parquet("data/live_market_data.parquet", index=False)
                
                self.logger.info(f"  📄 Updated live market data: {len(combined_data)} records")
            
            if all_features:
                # Update main features file
                combined_features = pd.concat(all_features, ignore_index=True)
                combined_features = combined_features.sort_values('ts').tail(1000)
                combined_features.to_parquet("data/live_features.parquet", index=False)
                
                self.logger.info(f"  📄 Updated live features: {len(combined_features)} records")
        
        except Exception as e:
            self.logger.error(f"Error updating main data files: {e}")
    
    async def monitor_data_quality(self):
        """Monitor data quality and freshness"""
        
        while self.is_running:
            try:
                self.logger.info("🔍 Monitoring data quality...")
                
                current_time = datetime.now()
                quality_report = {
                    "timestamp": current_time.isoformat(),
                    "instruments": {},
                    "overall_health": "GOOD"
                }
                
                stale_threshold = timedelta(minutes=5)
                issues = 0
                
                for symbol, data in self.latest_data.items():
                    if data is not None and not data.empty:
                        latest_ts = pd.to_datetime(data['ts'].iloc[-1])
                        age = current_time - latest_ts
                        
                        status = "FRESH" if age < stale_threshold else "STALE"
                        if status == "STALE":
                            issues += 1
                        
                        quality_report["instruments"][symbol] = {
                            "status": status,
                            "last_update": latest_ts.isoformat(),
                            "age_minutes": age.total_seconds() / 60,
                            "data_points": len(data)
                        }
                    else:
                        quality_report["instruments"][symbol] = {
                            "status": "NO_DATA",
                            "last_update": None,
                            "age_minutes": None,
                            "data_points": 0
                        }
                        issues += 1
                
                # Overall health assessment
                total_instruments = len(self.latest_data)
                if issues == 0:
                    quality_report["overall_health"] = "EXCELLENT"
                elif issues <= total_instruments * 0.2:
                    quality_report["overall_health"] = "GOOD"
                elif issues <= total_instruments * 0.5:
                    quality_report["overall_health"] = "FAIR"
                else:
                    quality_report["overall_health"] = "POOR"
                
                # Save quality report
                with open("data/data_quality_report.json", 'w') as f:
                    json.dump(quality_report, f, indent=2, default=str)
                
                self.logger.info(f"  📊 Data Quality: {quality_report['overall_health']} "
                               f"({total_instruments - issues}/{total_instruments} instruments healthy)")
                
                await asyncio.sleep(300)  # Monitor every 5 minutes
                
            except Exception as e:
                self.logger.error(f"Data quality monitoring error: {e}")
                await asyncio.sleep(300)
    
    def get_latest_data(self, symbol: str = None) -> Dict:
        """Get latest market data"""
        
        if symbol:
            return self.latest_data.get(symbol, pd.DataFrame())
        else:
            return self.latest_data
    
    def get_latest_features(self, symbol: str = None) -> Dict:
        """Get latest features"""
        
        if symbol:
            return self.latest_features.get(symbol, pd.DataFrame())
        else:
            return self.latest_features
    
    def get_data_summary(self) -> Dict:
        """Get summary of available data"""
        
        summary = {
            "instruments": list(self.latest_data.keys()),
            "last_update": datetime.now().isoformat(),
            "data_status": {}
        }
        
        for symbol, data in self.latest_data.items():
            if data is not None and not data.empty:
                summary["data_status"][symbol] = {
                    "records": len(data),
                    "latest_price": float(data['close'].iloc[-1]),
                    "latest_timestamp": str(data['ts'].iloc[-1])
                }
            else:
                summary["data_status"][symbol] = {
                    "records": 0,
                    "latest_price": None,
                    "latest_timestamp": None
                }
        
        return summary
    
    def stop_service(self):
        """Stop the live data service"""
        self.logger.info("🛑 Stopping live data service...")
        self.is_running = False

# Global service instance
live_data_service = LiveDataService()

async def main():
    """Main function to run the live data service"""
    
    try:
        await live_data_service.start_live_data_feed()
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal, shutting down...")
        live_data_service.stop_service()

if __name__ == "__main__":
    asyncio.run(main())
