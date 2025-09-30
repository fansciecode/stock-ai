import pandas as pd
import numpy as np
import argparse
from pathlib import Path

# Optional TA library imports
try:
    import talib as ta
    TALIB_AVAILABLE = True
except ImportError:
    TALIB_AVAILABLE = False

try:
    from ta import add_all_ta_features
    TA_AVAILABLE = True
except ImportError:
    TA_AVAILABLE = False

class FeatureEngineer:
    def __init__(self):
        self.feature_columns = []

    def calculate_basic_features(self, df):
        """Calculate basic technical indicators"""
        df = df.copy()
        
        # Price-based features
        df["hl2"] = (df["high"] + df["low"]) / 2
        df["hlc3"] = (df["high"] + df["low"] + df["close"]) / 3
        df["ohlc4"] = (df["open"] + df["high"] + df["low"] + df["close"]) / 4
        
        # Returns
        df["returns_1"] = df["close"].pct_change()
        df["returns_5"] = df["close"].pct_change(periods=5)
        df["log_returns"] = np.log(df["close"] / df["close"].shift(1))
        
        # Volatility
        df["volatility_10"] = df["returns_1"].rolling(10).std()
        df["volatility_20"] = df["returns_1"].rolling(20).std()
        df["volatility_50"] = df["returns_1"].rolling(50).std()
        
        return df

    def calculate_moving_averages(self, df):
        """Calculate various moving averages"""
        df = df.copy()
        
        # Simple Moving Averages
        for period in [5, 9, 21, 50, 100, 200]:
            df[f"sma_{period}"] = df["close"].rolling(period).mean()
        
        # Exponential Moving Averages
        for period in [9, 21, 50]:
            df[f"ema_{period}"] = df["close"].ewm(span=period).mean()
        
        # Moving Average relationships
        df["sma_9_21_ratio"] = df["sma_9"] / df["sma_21"]
        df["ema_9_21_ratio"] = df["ema_9"] / df["ema_21"]
        df["price_sma_50_ratio"] = df["close"] / df["sma_50"]
        
        return df

    def calculate_oscillators(self, df):
        """Calculate oscillator indicators"""
        df = df.copy()
        
        # RSI
        for period in [14, 21]:
            df[f"rsi_{period}"] = self._rsi(df["close"], period)
        
        # Stochastic
        df["stoch_k"], df["stoch_d"] = self._stochastic(df, 14, 3, 3)
        
        # Williams %R
        df["williams_r"] = self._williams_r(df, 14)
        
        # CCI
        df["cci"] = self._cci(df, 20)
        
        return df

    def calculate_momentum_indicators(self, df):
        """Calculate momentum indicators"""
        df = df.copy()
        
        # MACD
        df["macd"], df["macd_signal"], df["macd_histogram"] = self._macd(df["close"])
        
        # Rate of Change
        for period in [10, 20]:
            df[f"roc_{period}"] = df["close"].pct_change(periods=period)
        
        # Momentum
        for period in [10, 20]:
            df[f"momentum_{period}"] = df["close"] / df["close"].shift(period)
        
        return df

    def calculate_volume_indicators(self, df):
        """Calculate volume-based indicators"""
        df = df.copy()
        
        # Volume Moving Averages
        df["volume_sma_20"] = df["volume"].rolling(20).mean()
        df["volume_ratio"] = df["volume"] / df["volume_sma_20"]
        
        # On Balance Volume
        df["obv"] = self._obv(df)
        
        # Volume Price Trend
        df["vpt"] = self._vpt(df)
        
        # Money Flow Index
        df["mfi"] = self._mfi(df, 14)
        
        return df

    def calculate_volatility_indicators(self, df):
        """Calculate volatility indicators"""
        df = df.copy()
        
        # Bollinger Bands
        df["bb_upper"], df["bb_middle"], df["bb_lower"] = self._bollinger_bands(df["close"], 20, 2)
        df["bb_width"] = (df["bb_upper"] - df["bb_lower"]) / df["bb_middle"]
        df["bb_position"] = (df["close"] - df["bb_lower"]) / (df["bb_upper"] - df["bb_lower"])
        
        # Average True Range
        df["atr"] = self._atr(df, 14)
        df["atr_ratio"] = df["atr"] / df["close"]
        
        return df

    def calculate_vwap(self, df):
        """Calculate VWAP and related metrics"""
        df = df.copy()
        
        # Typical price
        typical_price = (df["high"] + df["low"] + df["close"]) / 3
        
        # VWAP for different periods
        for period in [20, 60, 100]:
            pv = typical_price * df["volume"]
            df[f"vwap_{period}"] = pv.rolling(period).sum() / df["volume"].rolling(period).sum()
            df[f"vwap_deviation_{period}"] = (df["close"] - df[f"vwap_{period}"]) / df[f"vwap_{period}"]
        
        return df

    def calculate_support_resistance(self, df):
        """Calculate support and resistance levels"""
        df = df.copy()
        
        # Pivot points
        df["pivot"] = (df["high"] + df["low"] + df["close"]) / 3
        df["support_1"] = 2 * df["pivot"] - df["high"]
        df["resistance_1"] = 2 * df["pivot"] - df["low"]
        
        # Fractal highs and lows
        df["fractal_high"] = self._fractal_high(df, 5)
        df["fractal_low"] = self._fractal_low(df, 5)
        
        return df

    def calculate_time_features(self, df):
        """Calculate time-based features"""
        df = df.copy()
        df["ts"] = pd.to_datetime(df["ts"])
        
        # Time components
        df["hour"] = df["ts"].dt.hour
        df["minute"] = df["ts"].dt.minute
        df["day_of_week"] = df["ts"].dt.dayofweek
        df["day_of_month"] = df["ts"].dt.day
        df["month"] = df["ts"].dt.month
        
        # Cyclical encoding
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
        df["day_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
        df["day_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
        
        return df

    def build_all_features(self, df):
        """Build comprehensive feature set"""
        print("Building features...")
        
        # Sort by timestamp
        df = df.sort_values(["instrument", "ts"]).reset_index(drop=True)
        
        # Apply feature engineering by instrument
        features_df = []
        for instrument in df["instrument"].unique():
            inst_df = df[df["instrument"] == instrument].copy()
            
            inst_df = self.calculate_basic_features(inst_df)
            inst_df = self.calculate_moving_averages(inst_df)
            inst_df = self.calculate_oscillators(inst_df)
            inst_df = self.calculate_momentum_indicators(inst_df)
            inst_df = self.calculate_volume_indicators(inst_df)
            inst_df = self.calculate_volatility_indicators(inst_df)
            inst_df = self.calculate_vwap(inst_df)
            inst_df = self.calculate_support_resistance(inst_df)
            inst_df = self.calculate_time_features(inst_df)
            
            features_df.append(inst_df)
        
        result = pd.concat(features_df, ignore_index=True)
        
        # Store feature column names for later use
        self.feature_columns = [col for col in result.columns 
                               if col not in ["ts", "instrument", "open", "high", "low", "close", "volume"]]
        
        print(f"Generated {len(self.feature_columns)} features")
        return result

    # Helper methods for technical indicators
    def _rsi(self, series, window=14):
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def _stochastic(self, df, k_period=14, k_slowing=3, d_period=3):
        lowest_low = df["low"].rolling(k_period).min()
        highest_high = df["high"].rolling(k_period).max()
        k_percent = 100 * ((df["close"] - lowest_low) / (highest_high - lowest_low))
        k_percent = k_percent.rolling(k_slowing).mean()
        d_percent = k_percent.rolling(d_period).mean()
        return k_percent, d_percent

    def _williams_r(self, df, period=14):
        highest_high = df["high"].rolling(period).max()
        lowest_low = df["low"].rolling(period).min()
        return -100 * (highest_high - df["close"]) / (highest_high - lowest_low)

    def _cci(self, df, period=20):
        typical_price = (df["high"] + df["low"] + df["close"]) / 3
        sma = typical_price.rolling(period).mean()
        mad = typical_price.rolling(period).apply(lambda x: np.mean(np.abs(x - x.mean())))
        return (typical_price - sma) / (0.015 * mad)

    def _macd(self, series, fast=12, slow=26, signal=9):
        exp1 = series.ewm(span=fast).mean()
        exp2 = series.ewm(span=slow).mean()
        macd = exp1 - exp2
        macd_signal = macd.ewm(span=signal).mean()
        macd_histogram = macd - macd_signal
        return macd, macd_signal, macd_histogram

    def _obv(self, df):
        obv = [0]
        for i in range(1, len(df)):
            if df["close"].iloc[i] > df["close"].iloc[i-1]:
                obv.append(obv[-1] + df["volume"].iloc[i])
            elif df["close"].iloc[i] < df["close"].iloc[i-1]:
                obv.append(obv[-1] - df["volume"].iloc[i])
            else:
                obv.append(obv[-1])
        return pd.Series(obv, index=df.index)

    def _vpt(self, df):
        vpt = [0]
        for i in range(1, len(df)):
            vpt.append(vpt[-1] + df["volume"].iloc[i] * 
                      (df["close"].iloc[i] - df["close"].iloc[i-1]) / df["close"].iloc[i-1])
        return pd.Series(vpt, index=df.index)

    def _mfi(self, df, period=14):
        typical_price = (df["high"] + df["low"] + df["close"]) / 3
        money_flow = typical_price * df["volume"]
        
        positive_flow = money_flow.where(typical_price > typical_price.shift(1), 0)
        negative_flow = money_flow.where(typical_price < typical_price.shift(1), 0)
        
        positive_mf = positive_flow.rolling(period).sum()
        negative_mf = negative_flow.rolling(period).sum()
        
        mfr = positive_mf / negative_mf
        return 100 - (100 / (1 + mfr))

    def _bollinger_bands(self, series, period=20, std=2):
        middle = series.rolling(period).mean()
        std_dev = series.rolling(period).std()
        upper = middle + (std_dev * std)
        lower = middle - (std_dev * std)
        return upper, middle, lower

    def _atr(self, df, period=14):
        high_low = df["high"] - df["low"]
        high_close = np.abs(df["high"] - df["close"].shift())
        low_close = np.abs(df["low"] - df["close"].shift())
        
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return true_range.rolling(period).mean()

    def _fractal_high(self, df, period=5):
        highs = df["high"]
        fractal_high = pd.Series(index=df.index, dtype=float)
        
        for i in range(period, len(df) - period):
            if highs.iloc[i] == highs.iloc[i-period:i+period+1].max():
                fractal_high.iloc[i] = highs.iloc[i]
        
        return fractal_high.fillna(method="ffill")

    def _fractal_low(self, df, period=5):
        lows = df["low"]
        fractal_low = pd.Series(index=df.index, dtype=float)
        
        for i in range(period, len(df) - period):
            if lows.iloc[i] == lows.iloc[i-period:i+period+1].min():
                fractal_low.iloc[i] = lows.iloc[i]
        
        return fractal_low.fillna(method="ffill")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/sample_5m.parquet")
    parser.add_argument("--output", default="data/features.parquet")
    args = parser.parse_args()
    
    # Load data
    df = pd.read_parquet(args.input)
    print(f"Loaded {len(df)} rows from {args.input}")
    
    # Build features
    engineer = FeatureEngineer()
    features_df = engineer.build_all_features(df)
    
    # Save features
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    features_df.to_parquet(args.output, index=False)
    print(f"Saved features to {args.output}")
    
    # Print feature summary
    print(f"\nFeature Summary:")
    print(f"Total columns: {len(features_df.columns)}")
    print(f"Feature columns: {len(engineer.feature_columns)}")
    print(f"Instruments: {features_df['instrument'].nunique()}")
    print(f"Date range: {features_df['ts'].min()} to {features_df['ts'].max()}")

if __name__ == "__main__":
    main()
