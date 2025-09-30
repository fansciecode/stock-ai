import pandas as pd
import numpy as np
from .base import BaseStrategy

class VWAPRevertStrategy(BaseStrategy):
    """VWAP Mean Reversion Strategy"""
    
    def __init__(self):
        super().__init__("vwap_revert")
    
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate VWAP mean reversion signals"""
        df = df.sort_values("ts").reset_index(drop=True)
        
        # Calculate VWAP and supporting indicators
        df = self._calculate_indicators(df)
        
        signals = []
        vwap_window = self.params.get("vwap_window", 60)
        band_pct = self.params.get("band_pct", 0.01)  # 1%
        rsi_threshold = self.params.get("rsi_threshold", 35)
        min_volume_ratio = self.params.get("min_volume_ratio", 1.2)
        
        for i in range(vwap_window, len(df)):
            current = df.iloc[i]
            
            if pd.isna(current["vwap"]) or pd.isna(current["rsi"]):
                continue
            
            close_price = current["close"]
            vwap_value = current["vwap"]
            rsi_value = current["rsi"]
            volume_ratio = current["volume_ratio"]
            
            # Long signal: Price below VWAP band + oversold RSI + volume confirmation
            if (close_price < vwap_value * (1 - band_pct) and
                rsi_value < rsi_threshold and
                volume_ratio > min_volume_ratio):
                
                confidence = self._calculate_revert_confidence(df, i, "bullish")
                if confidence > 0.6:  # Minimum confidence threshold
                    
                    entry_price = close_price
                    # Wider stop for mean reversion
                    stop_loss = entry_price * (1 - self.params.get("stop_loss_pct", 0.015))
                    # Target back to VWAP or above
                    take_profit = vwap_value * (1 + self.params.get("target_pct", 0.008))
                    
                    signals.append({
                        "ts": current["ts"],
                        "instrument": current["instrument"],
                        "entry": float(entry_price),
                        "side": 1,
                        "stop_loss": float(stop_loss),
                        "take_profit": float(take_profit),
                        "strategy_type": "VWAP_REVERT_BULL",
                        "vwap_value": float(vwap_value),
                        "rsi_value": float(rsi_value),
                        "deviation_pct": float((vwap_value - close_price) / close_price * 100),
                        "confidence": float(confidence)
                    })
            
            # Short signal: Price above VWAP band + overbought RSI + volume confirmation
            elif (close_price > vwap_value * (1 + band_pct) and
                  rsi_value > (100 - rsi_threshold) and
                  volume_ratio > min_volume_ratio):
                
                confidence = self._calculate_revert_confidence(df, i, "bearish")
                if confidence > 0.6:
                    
                    entry_price = close_price
                    stop_loss = entry_price * (1 + self.params.get("stop_loss_pct", 0.015))
                    take_profit = vwap_value * (1 - self.params.get("target_pct", 0.008))
                    
                    signals.append({
                        "ts": current["ts"],
                        "instrument": current["instrument"],
                        "entry": float(entry_price),
                        "side": -1,
                        "stop_loss": float(stop_loss),
                        "take_profit": float(take_profit),
                        "strategy_type": "VWAP_REVERT_BEAR",
                        "vwap_value": float(vwap_value),
                        "rsi_value": float(rsi_value),
                        "deviation_pct": float((close_price - vwap_value) / close_price * 100),
                        "confidence": float(confidence)
                    })
        
        return pd.DataFrame(signals) if signals else pd.DataFrame()
    
    def _calculate_indicators(self, df):
        """Calculate VWAP and supporting indicators"""
        df = df.copy()
        
        # VWAP calculation
        vwap_window = self.params.get("vwap_window", 60)
        typical_price = (df["high"] + df["low"] + df["close"]) / 3
        
        df["vwap"] = (
            (typical_price * df["volume"]).rolling(window=vwap_window).sum() / 
            df["volume"].rolling(window=vwap_window).sum()
        )
        
        # RSI calculation
        df["rsi"] = self._calculate_rsi(df["close"])
        
        # Volume ratio (current vs average)
        df["volume_ratio"] = df["volume"] / df["volume"].rolling(window=20).mean()
        
        # Price momentum
        df["momentum"] = df["close"].pct_change(5)
        
        # Bollinger Bands around VWAP
        vwap_std = df["close"].rolling(window=vwap_window).std()
        df["vwap_upper"] = df["vwap"] + (2 * vwap_std)
        df["vwap_lower"] = df["vwap"] - (2 * vwap_std)
        
        return df
    
    def _calculate_rsi(self, prices, period=14):
        """Calculate RSI"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / (loss + 1e-10)
        return 100 - (100 / (1 + rs))
    
    def _calculate_revert_confidence(self, df, index, direction):
        """Calculate mean reversion confidence"""
        current = df.iloc[index]
        
        base_confidence = 0.6
        
        # Deviation factor (more extreme = higher confidence)
        vwap_dev = abs(current["close"] - current["vwap"]) / current["vwap"]
        dev_factor = min(vwap_dev * 20, 0.2)  # Cap at 0.2
        
        # RSI extremity factor
        rsi = current["rsi"]
        if direction == "bullish":
            rsi_factor = max(0, (30 - rsi) / 30 * 0.15)
        else:
            rsi_factor = max(0, (rsi - 70) / 30 * 0.15)
        
        # Volume confirmation factor
        volume_factor = min((current["volume_ratio"] - 1) * 0.1, 0.1)
        
        # Momentum divergence (price moving away from VWAP while momentum slowing)
        momentum_factor = 0.05 if abs(current["momentum"]) < 0.01 else 0.0
        
        # Market session factor (VWAP works better in active sessions)
        session_factor = 0.05  # Simplified
        
        total_confidence = (base_confidence + dev_factor + rsi_factor + 
                          volume_factor + momentum_factor + session_factor)
        
        return min(0.95, total_confidence)
