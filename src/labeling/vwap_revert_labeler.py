import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from strategies.base import BaseStrategy

class VWAPReversionStrategy(BaseStrategy):
    """VWAP Mean Reversion Strategy"""
    
    def __init__(self):
        super().__init__("vwap_revert")
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate VWAP mean reversion signals"""
        df = df.sort_values("ts").reset_index(drop=True)
        
        # Calculate VWAP
        df = self._calculate_vwap(df)
        df = self._calculate_rsi(df)
        
        signals = []
        
        vwap_window = self.params.get("vwap_window", 60)
        band_pct = self.params.get("band_pct", 0.01)
        rsi_threshold = self.params.get("rsi_threshold", 35)
        
        vwap_col = f"vwap_{vwap_window}"
        
        for i in range(len(df)):
            row = df.iloc[i]
            
            if pd.isna(row.get(vwap_col)) or pd.isna(row.get("rsi_14")):
                continue
            
            vwap = row[vwap_col]
            close = row["close"]
            rsi = row["rsi_14"]
            
            # Long signal: price below VWAP band and RSI oversold
            if (close < vwap * (1 - band_pct)) and (rsi < rsi_threshold):
                entry_price = close
                atr = self._get_atr(df, i)
                stop_loss = self.calculate_stop_loss(entry_price, 1, atr)
                take_profit = self.calculate_take_profit(entry_price, stop_loss, 1)
                
                signals.append({
                    "ts": row["ts"],
                    "instrument": row["instrument"],
                    "entry": float(entry_price),
                    "side": 1,
                    "stop_loss": float(stop_loss),
                    "take_profit": float(take_profit),
                    "strategy_type": "VWAP_REVERT_LONG",
                    "vwap": float(vwap),
                    "rsi": float(rsi),
                    "deviation": float((close - vwap) / vwap)
                })
            
            # Short signal: price above VWAP band and RSI overbought
            elif (close > vwap * (1 + band_pct)) and (rsi > (100 - rsi_threshold)):
                entry_price = close
                atr = self._get_atr(df, i)
                stop_loss = self.calculate_stop_loss(entry_price, -1, atr)
                take_profit = self.calculate_take_profit(entry_price, stop_loss, -1)
                
                signals.append({
                    "ts": row["ts"],
                    "instrument": row["instrument"],
                    "entry": float(entry_price),
                    "side": -1,
                    "stop_loss": float(stop_loss),
                    "take_profit": float(take_profit),
                    "strategy_type": "VWAP_REVERT_SHORT",
                    "vwap": float(vwap),
                    "rsi": float(rsi),
                    "deviation": float((close - vwap) / vwap)
                })
        
        return pd.DataFrame(signals) if signals else pd.DataFrame()
    
    def _calculate_vwap(self, df):
        """Calculate VWAP for different periods"""
        df = df.copy()
        typical_price = (df["high"] + df["low"] + df["close"]) / 3
        
        for period in [20, 60, 100]:
            pv = typical_price * df["volume"]
            df[f"vwap_{period}"] = pv.rolling(period).sum() / df["volume"].rolling(period).sum()
        
        return df
    
    def _calculate_rsi(self, df, period=14):
        """Calculate RSI"""
        df = df.copy()
        delta = df["close"].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        df["rsi_14"] = 100 - (100 / (1 + rs))
        return df
    
    def _get_atr(self, df, idx, period=14):
        """Get ATR value at specific index"""
        if idx < period:
            return None
        
        high_low = df["high"].iloc[idx-period:idx] - df["low"].iloc[idx-period:idx]
        high_close = np.abs(df["high"].iloc[idx-period:idx] - df["close"].shift(1).iloc[idx-period:idx])
        low_close = np.abs(df["low"].iloc[idx-period:idx] - df["close"].shift(1).iloc[idx-period:idx])
        
        true_ranges = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return true_ranges.mean()

def vwap_revert_labels(df, vwap_col="vwap_60", rsi_col="rsi14", band_pct=0.01, 
                      rsi_threshold=35, buffer_pct=0.002, rr=1.5):
    """Legacy function for backward compatibility"""
    strategy = VWAPReversionStrategy()
    strategy.params.update({
        "vwap_window": 60,
        "band_pct": band_pct,
        "rsi_threshold": rsi_threshold,
        "buffer_pct": buffer_pct,
        "risk_reward": rr
    })
    
    signals = strategy.generate_signals(df)
    
    # Convert to legacy format
    labels = []
    for _, signal in signals.iterrows():
        labels.append({
            "instrument": signal["instrument"],
            "strategy_id": "VWAP_REVERT",
            "ts": signal["ts"],
            "entry": signal["entry"],
            "side": signal["side"],
            "sl": signal["stop_loss"],
            "tp": signal["take_profit"],
            "horizon_minutes": 30,
            "confidence": 0.6
        })
    
    return pd.DataFrame(labels)
