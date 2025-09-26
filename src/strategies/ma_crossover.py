import pandas as pd
import numpy as np
from .base import BaseStrategy

class MACrossoverStrategy(BaseStrategy):
    """Moving Average Crossover Strategy"""
    
    def __init__(self):
        super().__init__("ma_crossover")
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate MA crossover signals"""
        df = df.sort_values("ts").reset_index(drop=True)
        
        # Calculate moving averages
        df = self._calculate_moving_averages(df)
        
        signals = []
        short_window = self.params.get("short_window", 9)
        long_window = self.params.get("long_window", 21)
        confirmation_periods = self.params.get("confirmation_periods", 2)
        
        short_ma_col = f"ema_{short_window}"
        long_ma_col = f"ema_{long_window}"
        
        for i in range(long_window + confirmation_periods, len(df)):
            current = df.iloc[i]
            previous = df.iloc[i-1]
            
            if pd.isna(current[short_ma_col]) or pd.isna(current[long_ma_col]):
                continue
            
            # Bullish crossover: short MA crosses above long MA
            if (previous[short_ma_col] <= previous[long_ma_col] and 
                current[short_ma_col] > current[long_ma_col]):
                
                # Confirm the crossover with additional periods
                if self._confirm_crossover(df, i, short_ma_col, long_ma_col, confirmation_periods, "bullish"):
                    entry_price = current["close"]
                    atr = self._get_atr(df, i)
                    stop_loss = self.calculate_stop_loss(entry_price, 1, atr)
                    take_profit = self.calculate_take_profit(entry_price, stop_loss, 1)
                    
                    signals.append({
                        "ts": current["ts"],
                        "instrument": current["instrument"],
                        "entry": float(entry_price),
                        "side": 1,
                        "stop_loss": float(stop_loss),
                        "take_profit": float(take_profit),
                        "strategy_type": "MA_CROSSOVER_BULL",
                        "short_ma": float(current[short_ma_col]),
                        "long_ma": float(current[long_ma_col]),
                        "crossover_strength": float(current[short_ma_col] / current[long_ma_col])
                    })
            
            # Bearish crossover: short MA crosses below long MA
            elif (previous[short_ma_col] >= previous[long_ma_col] and 
                  current[short_ma_col] < current[long_ma_col]):
                
                if self._confirm_crossover(df, i, short_ma_col, long_ma_col, confirmation_periods, "bearish"):
                    entry_price = current["close"]
                    atr = self._get_atr(df, i)
                    stop_loss = self.calculate_stop_loss(entry_price, -1, atr)
                    take_profit = self.calculate_take_profit(entry_price, stop_loss, -1)
                    
                    signals.append({
                        "ts": current["ts"],
                        "instrument": current["instrument"],
                        "entry": float(entry_price),
                        "side": -1,
                        "stop_loss": float(stop_loss),
                        "take_profit": float(take_profit),
                        "strategy_type": "MA_CROSSOVER_BEAR",
                        "short_ma": float(current[short_ma_col]),
                        "long_ma": float(current[long_ma_col]),
                        "crossover_strength": float(current[short_ma_col] / current[long_ma_col])
                    })
        
        return pd.DataFrame(signals) if signals else pd.DataFrame()
    
    def _calculate_moving_averages(self, df):
        """Calculate EMAs for the strategy"""
        df = df.copy()
        
        for period in [9, 21]:
            df[f"ema_{period}"] = df["close"].ewm(span=period).mean()
        
        return df
    
    def _confirm_crossover(self, df, idx, short_col, long_col, periods, direction):
        """Confirm crossover signal with additional periods"""
        if idx + periods >= len(df):
            return False
        
        for i in range(1, periods + 1):
            future_row = df.iloc[idx + i]
            
            if direction == "bullish":
                if future_row[short_col] <= future_row[long_col]:
                    return False
            else:  # bearish
                if future_row[short_col] >= future_row[long_col]:
                    return False
        
        return True
    
    def _get_atr(self, df, idx, period=14):
        """Get ATR value at specific index"""
        if idx < period:
            return None
        
        high_low = df["high"].iloc[idx-period:idx] - df["low"].iloc[idx-period:idx]
        high_close = np.abs(df["high"].iloc[idx-period:idx] - df["close"].shift(1).iloc[idx-period:idx])
        low_close = np.abs(df["low"].iloc[idx-period:idx] - df["close"].shift(1).iloc[idx-period:idx])
        
        true_ranges = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return true_ranges.mean()
