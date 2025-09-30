import pandas as pd
import numpy as np
from .base import BaseStrategy
from scipy.signal import find_peaks

class RSIDivergenceStrategy(BaseStrategy):
    """RSI Divergence Strategy - Hidden and Regular Divergences"""
    
    def __init__(self):
        super().__init__("rsi_divergence")
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate RSI divergence signals"""
        df = df.sort_values("ts").reset_index(drop=True)
        
        # Calculate RSI and find peaks/troughs
        df = self._calculate_indicators(df)
        
        signals = []
        min_periods = self.params.get("min_periods_between_peaks", 10)
        max_periods = self.params.get("max_periods_between_peaks", 50)
        
        # Find price and RSI peaks/troughs
        price_peaks, price_troughs = self._find_price_extremes(df)
        rsi_peaks, rsi_troughs = self._find_rsi_extremes(df)
        
        # Look for divergences
        signals.extend(self._find_bullish_divergences(df, price_troughs, rsi_troughs, min_periods, max_periods))
        signals.extend(self._find_bearish_divergences(df, price_peaks, rsi_peaks, min_periods, max_periods))
        
        return pd.DataFrame(signals) if signals else pd.DataFrame()
    
    def _calculate_indicators(self, df):
        """Calculate RSI and supporting indicators"""
        df = df.copy()
        
        # RSI calculation
        df["rsi"] = self._calculate_rsi(df["close"])
        
        # Smoothed RSI for better divergence detection
        df["rsi_smooth"] = df["rsi"].rolling(window=3).mean()
        
        # Price momentum
        df["momentum"] = df["close"].pct_change(5)
        
        # Volume confirmation
        df["volume_sma"] = df["volume"].rolling(window=20).mean()
        df["volume_ratio"] = df["volume"] / df["volume_sma"]
        
        return df
    
    def _calculate_rsi(self, prices, period=14):
        """Calculate RSI"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / (loss + 1e-10)
        return 100 - (100 / (1 + rs))
    
    def _find_price_extremes(self, df):
        """Find price peaks and troughs"""
        prices = df["close"].values
        
        # Find peaks (local maxima)
        peaks, _ = find_peaks(prices, distance=5, prominence=prices.std() * 0.5)
        
        # Find troughs (local minima) by inverting prices
        troughs, _ = find_peaks(-prices, distance=5, prominence=prices.std() * 0.5)
        
        return peaks, troughs
    
    def _find_rsi_extremes(self, df):
        """Find RSI peaks and troughs"""
        rsi_values = df["rsi"].values
        
        # Find RSI peaks
        peaks, _ = find_peaks(rsi_values, distance=5, prominence=5)
        
        # Find RSI troughs
        troughs, _ = find_peaks(-rsi_values, distance=5, prominence=5)
        
        return peaks, troughs
    
    def _find_bullish_divergences(self, df, price_troughs, rsi_troughs, min_periods, max_periods):
        """Find bullish divergences (price makes lower low, RSI makes higher low)"""
        signals = []
        
        for i in range(len(price_troughs) - 1):
            for j in range(i + 1, len(price_troughs)):
                p1_idx, p2_idx = price_troughs[i], price_troughs[j]
                
                # Check if within acceptable time range
                if p2_idx - p1_idx < min_periods or p2_idx - p1_idx > max_periods:
                    continue
                
                p1_price = df.iloc[p1_idx]["close"]
                p2_price = df.iloc[p2_idx]["close"]
                
                # Price makes lower low
                if p2_price >= p1_price:
                    continue
                
                # Find corresponding RSI troughs
                rsi1_candidates = [idx for idx in rsi_troughs if abs(idx - p1_idx) <= 3]
                rsi2_candidates = [idx for idx in rsi_troughs if abs(idx - p2_idx) <= 3]
                
                if not rsi1_candidates or not rsi2_candidates:
                    continue
                
                rsi1_idx = min(rsi1_candidates, key=lambda x: abs(x - p1_idx))
                rsi2_idx = min(rsi2_candidates, key=lambda x: abs(x - p2_idx))
                
                rsi1_value = df.iloc[rsi1_idx]["rsi"]
                rsi2_value = df.iloc[rsi2_idx]["rsi"]
                
                # RSI makes higher low (divergence)
                if rsi2_value > rsi1_value:
                    confidence = self._calculate_divergence_confidence(
                        df, p1_idx, p2_idx, rsi1_idx, rsi2_idx, "bullish"
                    )
                    
                    if confidence > 0.6:
                        current = df.iloc[p2_idx]
                        entry_price = current["close"]
                        
                        # Conservative stop below the divergence low
                        stop_loss = entry_price * (1 - self.params.get("stop_loss_pct", 0.02))
                        
                        # Target based on divergence strength
                        risk = entry_price - stop_loss
                        take_profit = entry_price + (risk * self.params.get("risk_reward", 2.5))
                        
                        signals.append({
                            "ts": current["ts"],
                            "instrument": current["instrument"],
                            "entry": float(entry_price),
                            "side": 1,
                            "stop_loss": float(stop_loss),
                            "take_profit": float(take_profit),
                            "strategy_type": "RSI_DIV_BULL",
                            "rsi_value": float(rsi2_value),
                            "price_low1": float(p1_price),
                            "price_low2": float(p2_price),
                            "rsi_low1": float(rsi1_value),
                            "rsi_low2": float(rsi2_value),
                            "divergence_strength": float((rsi2_value - rsi1_value) / (p1_price - p2_price)),
                            "confidence": float(confidence)
                        })
        
        return signals
    
    def _find_bearish_divergences(self, df, price_peaks, rsi_peaks, min_periods, max_periods):
        """Find bearish divergences (price makes higher high, RSI makes lower high)"""
        signals = []
        
        for i in range(len(price_peaks) - 1):
            for j in range(i + 1, len(price_peaks)):
                p1_idx, p2_idx = price_peaks[i], price_peaks[j]
                
                # Check if within acceptable time range
                if p2_idx - p1_idx < min_periods or p2_idx - p1_idx > max_periods:
                    continue
                
                p1_price = df.iloc[p1_idx]["close"]
                p2_price = df.iloc[p2_idx]["close"]
                
                # Price makes higher high
                if p2_price <= p1_price:
                    continue
                
                # Find corresponding RSI peaks
                rsi1_candidates = [idx for idx in rsi_peaks if abs(idx - p1_idx) <= 3]
                rsi2_candidates = [idx for idx in rsi_peaks if abs(idx - p2_idx) <= 3]
                
                if not rsi1_candidates or not rsi2_candidates:
                    continue
                
                rsi1_idx = min(rsi1_candidates, key=lambda x: abs(x - p1_idx))
                rsi2_idx = min(rsi2_candidates, key=lambda x: abs(x - p2_idx))
                
                rsi1_value = df.iloc[rsi1_idx]["rsi"]
                rsi2_value = df.iloc[rsi2_idx]["rsi"]
                
                # RSI makes lower high (divergence)
                if rsi2_value < rsi1_value:
                    confidence = self._calculate_divergence_confidence(
                        df, p1_idx, p2_idx, rsi1_idx, rsi2_idx, "bearish"
                    )
                    
                    if confidence > 0.6:
                        current = df.iloc[p2_idx]
                        entry_price = current["close"]
                        
                        # Conservative stop above the divergence high
                        stop_loss = entry_price * (1 + self.params.get("stop_loss_pct", 0.02))
                        
                        # Target based on divergence strength
                        risk = stop_loss - entry_price
                        take_profit = entry_price - (risk * self.params.get("risk_reward", 2.5))
                        
                        signals.append({
                            "ts": current["ts"],
                            "instrument": current["instrument"],
                            "entry": float(entry_price),
                            "side": -1,
                            "stop_loss": float(stop_loss),
                            "take_profit": float(take_profit),
                            "strategy_type": "RSI_DIV_BEAR",
                            "rsi_value": float(rsi2_value),
                            "price_high1": float(p1_price),
                            "price_high2": float(p2_price),
                            "rsi_high1": float(rsi1_value),
                            "rsi_high2": float(rsi2_value),
                            "divergence_strength": float((rsi1_value - rsi2_value) / (p2_price - p1_price)),
                            "confidence": float(confidence)
                        })
        
        return signals
    
    def _calculate_divergence_confidence(self, df, p1_idx, p2_idx, rsi1_idx, rsi2_idx, direction):
        """Calculate divergence signal confidence"""
        base_confidence = 0.6
        
        # Time factor (divergences over longer periods are more reliable)
        time_span = p2_idx - p1_idx
        time_factor = min((time_span - 10) / 40 * 0.15, 0.15)
        
        # RSI level factor (divergences at extremes are more reliable)
        rsi2_value = df.iloc[rsi2_idx]["rsi"]
        if direction == "bullish":
            rsi_factor = max(0, (35 - rsi2_value) / 35 * 0.1)
        else:
            rsi_factor = max(0, (rsi2_value - 65) / 35 * 0.1)
        
        # Volume confirmation
        volume1 = df.iloc[p1_idx]["volume"]
        volume2 = df.iloc[p2_idx]["volume"]
        avg_volume = df.iloc[max(0, p2_idx-20):p2_idx]["volume"].mean()
        
        volume_factor = 0.05 if volume2 > avg_volume else 0.0
        
        # Divergence clarity (how clear the divergence is)
        price_change = abs(df.iloc[p2_idx]["close"] - df.iloc[p1_idx]["close"])
        rsi_change = abs(df.iloc[rsi2_idx]["rsi"] - df.iloc[rsi1_idx]["rsi"])
        clarity_factor = min(rsi_change / 10 * 0.1, 0.1)
        
        total_confidence = (base_confidence + time_factor + rsi_factor + 
                          volume_factor + clarity_factor)
        
        return min(0.95, total_confidence)
