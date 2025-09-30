import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import yaml

class BaseStrategy(ABC):
    """Base class for all trading strategies"""
    
    def __init__(self, name: str, config_path: str = "configs/strategies.yaml"):
        self.name = name
        self.config = self._load_config(config_path)
        self.params = self.config.get(name.lower().replace(" ", "_"), {}).get("params", {})
        self.enabled = self.config.get(name.lower().replace(" ", "_"), {}).get("enabled", True)
        
    def _load_config(self, config_path: str) -> Dict:
        """Load strategy configuration"""
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"Config file not found: {config_path}")
            return {}
    
    @abstractmethod
    def generate_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals - must be implemented by child classes"""
        pass
    
    def validate_data(self, df: pd.DataFrame) -> bool:
        """Validate input data"""
        required_cols = ["ts", "open", "high", "low", "close", "volume", "instrument"]
        return all(col in df.columns for col in required_cols)
    
    def add_signal_metadata(self, df: pd.DataFrame, signals: pd.DataFrame) -> pd.DataFrame:
        """Add metadata to signals"""
        signals["strategy"] = self.name
        signals["confidence"] = self.params.get("confidence_threshold", 0.5)
        signals["risk_reward"] = self.params.get("risk_reward", 2.0)
        return signals
    
    def calculate_stop_loss(self, entry_price: float, side: int, atr: float = None) -> float:
        """Calculate stop loss based on ATR or percentage"""
        buffer_pct = self.params.get("buffer_pct", 0.002)
        
        if atr is not None:
            # ATR-based stop loss
            atr_multiplier = self.params.get("atr_multiplier", 1.5)
            if side == 1:  # Long
                return entry_price - (atr * atr_multiplier)
            else:  # Short
                return entry_price + (atr * atr_multiplier)
        else:
            # Percentage-based stop loss
            if side == 1:  # Long
                return entry_price * (1 - buffer_pct)
            else:  # Short
                return entry_price * (1 + buffer_pct)
    
    def calculate_take_profit(self, entry_price: float, stop_loss: float, side: int) -> float:
        """Calculate take profit based on risk-reward ratio"""
        risk_reward = self.params.get("risk_reward", 2.0)
        risk = abs(entry_price - stop_loss)
        
        if side == 1:  # Long
            return entry_price + (risk * risk_reward)
        else:  # Short
            return entry_price - (risk * risk_reward)

class SignalValidator:
    """Validates trading signals for consistency and quality"""
    
    @staticmethod
    def validate_signals(signals: pd.DataFrame) -> tuple[bool, str]:
        """Validate signal dataframe"""
        required_cols = ["ts", "instrument", "side", "entry", "stop_loss", "take_profit"]
        
        # Check required columns
        missing_cols = [col for col in required_cols if col not in signals.columns]
        if missing_cols:
            return False, f"Missing columns: {missing_cols}"
        
        # Check for null values
        null_counts = signals[required_cols].isnull().sum()
        if null_counts.any():
            return False, f"Null values in signals: {null_counts[null_counts > 0].to_dict()}"
        
        # Check side values
        valid_sides = signals["side"].isin([-1, 1]).all()
        if not valid_sides:
            return False, "Side must be -1 (short) or 1 (long)"
        
        # Check price relationships
        for _, signal in signals.iterrows():
            if signal["side"] == 1:  # Long position
                if signal["stop_loss"] >= signal["entry"]:
                    return False, f"Long stop loss must be below entry: {signal}"
                if signal["take_profit"] <= signal["entry"]:
                    return False, f"Long take profit must be above entry: {signal}"
            else:  # Short position
                if signal["stop_loss"] <= signal["entry"]:
                    return False, f"Short stop loss must be above entry: {signal}"
                if signal["take_profit"] >= signal["entry"]:
                    return False, f"Short take profit must be below entry: {signal}"
        
        return True, "All signals valid"
    
    @staticmethod
    def filter_signals_by_quality(signals: pd.DataFrame, min_confidence: float = 0.5) -> pd.DataFrame:
        """Filter signals by quality metrics"""
        if "confidence" in signals.columns:
            signals = signals[signals["confidence"] >= min_confidence]
        
        # Remove signals with very tight or very wide risk-reward
        signals["calculated_rr"] = abs(signals["take_profit"] - signals["entry"]) / abs(signals["entry"] - signals["stop_loss"])
        signals = signals[(signals["calculated_rr"] >= 1.0) & (signals["calculated_rr"] <= 5.0)]
        
        return signals.drop("calculated_rr", axis=1)

class StrategyManager:
    """Manages multiple strategies and combines their signals"""
    
    def __init__(self):
        self.strategies: List[BaseStrategy] = []
        self.validator = SignalValidator()
    
    def add_strategy(self, strategy: BaseStrategy):
        """Add a strategy to the manager"""
        if strategy.enabled:
            self.strategies.append(strategy)
            print(f"Added strategy: {strategy.name}")
        else:
            print(f"Strategy {strategy.name} is disabled")
    
    def generate_signals(self, df: pd.DataFrame, strategy_name: str = None) -> pd.DataFrame:
        """Generate signals from a specific strategy or all strategies"""
        
        if strategy_name:
            # Find specific strategy
            target_strategy = None
            for strategy in self.strategies:
                if strategy.name.lower() == strategy_name.lower():
                    target_strategy = strategy
                    break
            
            if not target_strategy:
                print(f"Strategy not found: {strategy_name}")
                return pd.DataFrame()
            
            try:
                if not target_strategy.validate_data(df):
                    print(f"Data validation failed for strategy: {target_strategy.name}")
                    return pd.DataFrame()
                
                signals = target_strategy.generate_signals(df)
                if signals is not None and not signals.empty:
                    signals = target_strategy.add_signal_metadata(df, signals)
                    
                    # Validate signals
                    is_valid, message = self.validator.validate_signals(signals)
                    if is_valid:
                        return self.validator.filter_signals_by_quality(signals)
                    else:
                        print(f"Invalid signals from {target_strategy.name}: {message}")
                
            except Exception as e:
                print(f"Error generating signals for {target_strategy.name}: {e}")
            
            return pd.DataFrame()
        else:
            return self.generate_all_signals(df)
    
    def generate_all_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate signals from all registered strategies"""
        all_signals = []
        
        for strategy in self.strategies:
            try:
                if not strategy.validate_data(df):
                    print(f"Data validation failed for strategy: {strategy.name}")
                    continue
                
                signals = strategy.generate_signals(df)
                if signals is not None and not signals.empty:
                    signals = strategy.add_signal_metadata(df, signals)
                    
                    # Validate signals
                    is_valid, message = self.validator.validate_signals(signals)
                    if is_valid:
                        all_signals.append(signals)
                        print(f"Generated {len(signals)} signals from {strategy.name}")
                    else:
                        print(f"Invalid signals from {strategy.name}: {message}")
                
            except Exception as e:
                print(f"Error generating signals for {strategy.name}: {e}")
        
        if all_signals:
            combined = pd.concat(all_signals, ignore_index=True)
            combined = self.validator.filter_signals_by_quality(combined)
            return combined.sort_values("ts").reset_index(drop=True)
        else:
            return pd.DataFrame()
    
    def get_strategy_performance(self) -> Dict:
        """Get performance summary of all strategies"""
        return {
            "total_strategies": len(self.strategies),
            "enabled_strategies": [s.name for s in self.strategies if s.enabled],
            "strategy_configs": {s.name: s.params for s in self.strategies}
        }
