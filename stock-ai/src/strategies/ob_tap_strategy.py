import pandas as pd
import numpy as np
from .base import BaseStrategy

class OrderBlockTapStrategy(BaseStrategy):
    """Order Block (OB) Tap Strategy - Smart Money Concepts"""
    
    def __init__(self):
        super().__init__("ob_tap")
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate Order Block tap signals"""
        df = df.sort_values("ts").reset_index(drop=True)
        
        signals = []
        lookback = self.params.get("lookback", 20)
        strength = self.params.get("strength", 3)
        thresh_pct = self.params.get("thresh_pct", 0.015)  # 1.5%
        buffer_pct = self.params.get("buffer_pct", 0.002)
        
        for i in range(lookback, len(df) - strength - 1):
            current = df.iloc[i]
            future_candles = df.iloc[i+1:i+strength+1]
            
            if len(future_candles) < strength:
                continue
                
            future_return = (future_candles["close"].iloc[-1] - current["close"]) / current["close"]
            
            # Bullish Order Block Detection (Demand Zone)
            if (current["close"] < current["open"] and  # Bearish candle
                future_return > thresh_pct):  # Followed by strong move up
                
                ob_low = current["low"]
                ob_high = current["high"]
                
                # Find first tap (price returns to OB zone)
                tap_signal = self._find_ob_tap(df, i, ob_low, ob_high, "bullish")
                if tap_signal:
                    signals.append(tap_signal)
            
            # Bearish Order Block Detection (Supply Zone)
            elif (current["close"] > current["open"] and  # Bullish candle
                  future_return < -thresh_pct):  # Followed by strong move down
                
                ob_low = current["low"]
                ob_high = current["high"]
                
                # Find first tap
                tap_signal = self._find_ob_tap(df, i, ob_low, ob_high, "bearish")
                if tap_signal:
                    signals.append(tap_signal)
        
        return pd.DataFrame(signals) if signals else pd.DataFrame()
    
    def _find_ob_tap(self, df, ob_index, ob_low, ob_high, direction):
        """Find the first tap of an order block"""
        max_search = self.params.get("max_search_periods", 50)
        
        for j in range(ob_index + 1, min(len(df), ob_index + max_search)):
            candle = df.iloc[j]
            
            # Check if candle taps the OB zone
            if candle["low"] <= ob_high and candle["high"] >= ob_low:
                entry_price = candle["close"]
                
                if direction == "bullish":
                    stop_loss = ob_low - (self.params.get("buffer_pct", 0.002) * entry_price)
                    risk = entry_price - stop_loss
                    take_profit = entry_price + (risk * self.params.get("risk_reward", 2.0))
                    side = 1
                    strategy_type = "OB_TAP_BULL"
                else:  # bearish
                    stop_loss = ob_high + (self.params.get("buffer_pct", 0.002) * entry_price)
                    risk = stop_loss - entry_price
                    take_profit = entry_price - (risk * self.params.get("risk_reward", 2.0))
                    side = -1
                    strategy_type = "OB_TAP_BEAR"
                
                return {
                    "ts": candle["ts"],
                    "instrument": candle["instrument"],
                    "entry": float(entry_price),
                    "side": side,
                    "stop_loss": float(stop_loss),
                    "take_profit": float(take_profit),
                    "strategy_type": strategy_type,
                    "ob_low": float(ob_low),
                    "ob_high": float(ob_high),
                    "tap_distance": abs(entry_price - ((ob_low + ob_high) / 2)) / entry_price,
                    "confidence": self._calculate_ob_confidence(df, ob_index, j, direction)
                }
        
        return None
    
    def _calculate_ob_confidence(self, df, ob_index, tap_index, direction):
        """Calculate confidence of OB tap signal"""
        base_confidence = 0.7
        
        # Volume confirmation
        ob_volume = df.iloc[ob_index]["volume"]
        avg_volume = df.iloc[max(0, ob_index-10):ob_index]["volume"].mean()
        volume_factor = min(ob_volume / avg_volume, 2.0) * 0.1
        
        # Time factor (fresher OBs are more reliable)
        time_factor = max(0, 0.2 - (tap_index - ob_index) * 0.01)
        
        # Market structure (simplified)
        structure_factor = 0.05 if self._is_trending_market(df, tap_index) else 0.0
        
        return min(0.95, base_confidence + volume_factor + time_factor + structure_factor)
    
    def _is_trending_market(self, df, index):
        """Simple trend detection"""
        if index < 20:
            return False
            
        recent_data = df.iloc[index-20:index]
        return recent_data["close"].iloc[-1] > recent_data["close"].iloc[0]
