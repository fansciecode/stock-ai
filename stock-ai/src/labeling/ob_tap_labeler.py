import pandas as pd
import numpy as np
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from strategies.base import BaseStrategy

class OrderBlockTapStrategy(BaseStrategy):
    """Order Block Tap Strategy - Identifies supply/demand zones and entries"""
    
    def __init__(self):
        super().__init__("ob_tap")
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate Order Block Tap signals"""
        df = df.sort_values("ts").reset_index(drop=True)
        signals = []
        
        lookback = self.params.get("lookback", 20)
        strength = self.params.get("strength", 3)
        thresh_pct = self.params.get("thresh_pct", 0.015)
        
        n = len(df)
        
        for i in range(lookback, n - strength - 1):
            current_candle = df.iloc[i]
            future_candles = df.iloc[i+1:i+strength+1]
            
            # Calculate future move
            future_return = (future_candles["close"].iloc[-1] - current_candle["close"]) / current_candle["close"]
            
            # Bullish Order Block (Demand Zone)
            if self._is_bearish_candle(current_candle) and future_return > thresh_pct:
                ob_zone = {
                    "high": current_candle["high"],
                    "low": current_candle["low"],
                    "type": "demand"
                }
                
                # Look for tap (price re-entering the zone)
                tap_signal = self._find_zone_tap(df, i+1, ob_zone, n)
                if tap_signal:
                    tap_signal.update({
                        "side": 1,  # Long
                        "strategy_type": "OB_DEMAND"
                    })
                    signals.append(tap_signal)
            
            # Bearish Order Block (Supply Zone)
            elif self._is_bullish_candle(current_candle) and future_return < -thresh_pct:
                ob_zone = {
                    "high": current_candle["high"],
                    "low": current_candle["low"],
                    "type": "supply"
                }
                
                # Look for tap
                tap_signal = self._find_zone_tap(df, i+1, ob_zone, n)
                if tap_signal:
                    tap_signal.update({
                        "side": -1,  # Short
                        "strategy_type": "OB_SUPPLY"
                    })
                    signals.append(tap_signal)
        
        return pd.DataFrame(signals) if signals else pd.DataFrame()
    
    def _is_bearish_candle(self, candle):
        """Check if candle is bearish"""
        return candle["close"] < candle["open"]
    
    def _is_bullish_candle(self, candle):
        """Check if candle is bullish"""
        return candle["close"] > candle["open"]
    
    def _find_zone_tap(self, df, start_idx, zone, end_idx):
        """Find when price taps into the order block zone"""
        for j in range(start_idx, min(end_idx, len(df))):
            candle = df.iloc[j]
            
            # Check if candle overlaps with zone
            if self._candle_overlaps_zone(candle, zone):
                entry_price = candle["open"]
                atr = self._calculate_atr(df, j)
                
                if zone["type"] == "demand":
                    stop_loss = self.calculate_stop_loss(entry_price, 1, atr)
                    take_profit = self.calculate_take_profit(entry_price, stop_loss, 1)
                else:  # supply
                    stop_loss = self.calculate_stop_loss(entry_price, -1, atr)
                    take_profit = self.calculate_take_profit(entry_price, stop_loss, -1)
                
                return {
                    "ts": candle["ts"],
                    "instrument": candle["instrument"],
                    "entry": float(entry_price),
                    "stop_loss": float(stop_loss),
                    "take_profit": float(take_profit),
                    "zone_high": float(zone["high"]),
                    "zone_low": float(zone["low"]),
                    "atr": float(atr) if atr is not None else None
                }
        
        return None
    
    def _candle_overlaps_zone(self, candle, zone):
        """Check if candle overlaps with order block zone"""
        return (candle["low"] <= zone["high"]) and (candle["high"] >= zone["low"])
    
    def _calculate_atr(self, df, idx, period=14):
        """Calculate Average True Range"""
        if idx < period:
            return None
        
        high_low = df["high"].iloc[idx-period:idx] - df["low"].iloc[idx-period:idx]
        high_close = np.abs(df["high"].iloc[idx-period:idx] - df["close"].shift(1).iloc[idx-period:idx])
        low_close = np.abs(df["low"].iloc[idx-period:idx] - df["close"].shift(1).iloc[idx-period:idx])
        
        true_ranges = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return true_ranges.mean()

def find_ob_taps(df, lookback=20, strength=3, thresh_pct=0.015, buffer_pct=0.002, rr=2.0):
    """Legacy function for backward compatibility"""
    strategy = OrderBlockTapStrategy()
    strategy.params.update({
        "lookback": lookback,
        "strength": strength,
        "thresh_pct": thresh_pct,
        "buffer_pct": buffer_pct,
        "risk_reward": rr
    })
    
    signals = strategy.generate_signals(df)
    
    # Convert to legacy format
    labels = []
    for _, signal in signals.iterrows():
        labels.append({
            "instrument": signal["instrument"],
            "strategy_id": "OB_TAP",
            "ts": signal["ts"],
            "entry": signal["entry"],
            "side": signal["side"],
            "sl": signal["stop_loss"],
            "tp": signal["take_profit"],
            "horizon_minutes": 30,
            "confidence": 0.8
        })
    
    return pd.DataFrame(labels)
