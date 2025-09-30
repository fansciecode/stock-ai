import pandas as pd
import sys
from pathlib import Path
import yaml
from datetime import datetime, timedelta

# Optional imports
try:
    import ccxt
    CCXT_AVAILABLE = True
except ImportError:
    CCXT_AVAILABLE = False

try:
    import yfinance as yf
    YFINANCE_AVAILABLE = True
except ImportError:
    YFINANCE_AVAILABLE = False

class DataLoader:
    def __init__(self, config_path="configs/data_sources.yaml"):
        try:
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f)
        except FileNotFoundError:
            # Default config if file not found
            self.config = {
                'sample': {'instruments': ['SAMPLE_STOCK', 'SAMPLE_CRYPTO']}
            }

    def load_sample_data(self, path="data/sample_5m.parquet"):
        """Load synthetic sample data"""
        p = Path(path)
        if not p.exists():
            print(f"File not found: {path}")
            return None
        
        df = pd.read_parquet(p)
        print(f"Loaded sample data: {len(df)} rows")
        print(f"Instruments: {df['instrument'].unique()}")
        print(f"Date range: {df['ts'].min()} to {df['ts'].max()}")
        return df

    def load_crypto_data(self, symbol="BTC/USDT", timeframe="5m", limit=1000):
        """Load crypto data using CCXT"""
        if not CCXT_AVAILABLE:
            print("CCXT not available, cannot load crypto data")
            return None
        
        try:
            exchange = ccxt.binance()
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=limit)
            
            df = pd.DataFrame(ohlcv, columns=["ts", "open", "high", "low", "close", "volume"])
            df["ts"] = pd.to_datetime(df["ts"], unit="ms")
            df["instrument"] = symbol.replace("/", "_")
            
            print(f"Loaded crypto data for {symbol}: {len(df)} rows")
            return df
        except Exception as e:
            print(f"Error loading crypto data: {e}")
            return None

    def load_stock_data(self, symbol="AAPL", period="1mo", interval="5m"):
        """Load stock data using Yahoo Finance"""
        if not YFINANCE_AVAILABLE:
            print("yfinance not available, cannot load stock data")
            return None
        
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval=interval)
            
            # Reset index and rename columns
            df = df.reset_index()
            df.columns = df.columns.str.lower()
            df = df.rename(columns={"datetime": "ts"})
            df["instrument"] = symbol
            
            print(f"Loaded stock data for {symbol}: {len(df)} rows")
            return df
        except Exception as e:
            print(f"Error loading stock data: {e}")
            return None

    def validate_data(self, df):
        """Validate OHLCV data quality"""
        if df is None or df.empty:
            return False, "DataFrame is empty"
        
        required_cols = ["ts", "open", "high", "low", "close", "volume", "instrument"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return False, f"Missing columns: {missing_cols}"
        
        # Check for null values
        null_counts = df[required_cols].isnull().sum()
        if null_counts.any():
            return False, f"Null values found: {null_counts[null_counts > 0].to_dict()}"
        
        # Check OHLC consistency
        invalid_ohlc = (
            (df["high"] < df["open"]) | 
            (df["high"] < df["close"]) | 
            (df["low"] > df["open"]) | 
            (df["low"] > df["close"]) |
            (df["high"] < df["low"])
        ).sum()
        
        if invalid_ohlc > 0:
            return False, f"Invalid OHLC relationships in {invalid_ohlc} rows"
        
        return True, "Data validation passed"

    def get_data_summary(self, df):
        """Get comprehensive data summary"""
        if df is None or df.empty:
            return "No data to summarize"
        
        summary = {
            "total_rows": len(df),
            "instruments": df["instrument"].nunique(),
            "instrument_list": df["instrument"].unique().tolist(),
            "date_range": {
                "start": df["ts"].min().isoformat(),
                "end": df["ts"].max().isoformat()
            },
            "price_stats": {
                "min_close": df["close"].min(),
                "max_close": df["close"].max(),
                "avg_close": df["close"].mean()
            },
            "volume_stats": {
                "min_volume": df["volume"].min(),
                "max_volume": df["volume"].max(),
                "avg_volume": df["volume"].mean()
            }
        }
        return summary

def main():
    loader = DataLoader()
    
    # Load and validate sample data
    df = loader.load_sample_data()
    if df is not None:
        is_valid, message = loader.validate_data(df)
        print(f"Validation: {message}")
        
        if is_valid:
            summary = loader.get_data_summary(df)
            print("Data Summary:")
            for key, value in summary.items():
                print(f"  {key}: {value}")

if __name__ == "__main__":
    main()
