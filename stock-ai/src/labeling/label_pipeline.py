import argparse
import pandas as pd
import sys
import os
from pathlib import Path

# Add the parent directory to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from strategies.base import StrategyManager
from labeling.ob_tap_labeler import OrderBlockTapStrategy
from labeling.vwap_revert_labeler import VWAPReversionStrategy
from strategies.ma_crossover import MACrossoverStrategy

class LabelingPipeline:
    """Unified labeling pipeline for all strategies"""
    
    def __init__(self):
        self.strategy_manager = StrategyManager()
        self._register_strategies()
    
    def _register_strategies(self):
        """Register all available strategies"""
        strategies = [
            OrderBlockTapStrategy(),
            VWAPReversionStrategy(),
            MACrossoverStrategy()
        ]
        
        for strategy in strategies:
            self.strategy_manager.add_strategy(strategy)
    
    def run_labeling(self, features_path="data/features.parquet", 
                    out_path="data/labels.parquet", save=True):
        """Run the complete labeling pipeline"""
        
        # Create output directory
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Load features
        print(f"Loading features from {features_path}...")
        df = pd.read_parquet(features_path)
        print(f"Loaded {len(df)} rows with {len(df.columns)} columns")
        
        # Generate signals from all strategies
        print("Generating signals from all strategies...")
        signals = self.strategy_manager.generate_all_signals(df)
        
        if signals.empty:
            print("No signals generated!")
            return pd.DataFrame()
        
        print(f"Generated {len(signals)} total signals")
        
        # Convert to training labels format
        labels = self._convert_to_labels(signals)
        
        # Save labels
        if save:
            labels.to_parquet(out_path, index=False)
            print(f"Saved {len(labels)} labels to {out_path}")
        
        # Print summary
        self._print_summary(labels)
        
        return labels
    
    def _convert_to_labels(self, signals):
        """Convert strategy signals to ML training labels"""
        labels = []
        
        for _, signal in signals.iterrows():
            label = {
                "instrument": signal["instrument"],
                "strategy": signal.get("strategy", "UNKNOWN"),
                "strategy_type": signal.get("strategy_type", "UNKNOWN"),
                "ts": signal["ts"],
                "entry": float(signal["entry"]),
                "side": int(signal["side"]),
                "stop_loss": float(signal["stop_loss"]),
                "take_profit": float(signal["take_profit"]),
                "confidence": float(signal.get("confidence", 0.5)),
                "risk_reward": float(signal.get("risk_reward", 2.0)),
                "horizon_minutes": 30,  # Default horizon
                
                # Additional metadata
                "expected_return": self._calculate_expected_return(signal),
                "risk_amount": self._calculate_risk_amount(signal),
                "reward_amount": self._calculate_reward_amount(signal)
            }
            
            # Add strategy-specific features
            for col in signal.index:
                if col not in label and col not in ["ts", "instrument", "entry", "side", "stop_loss", "take_profit"]:
                    if pd.notna(signal[col]):
                        label[f"feature_{col}"] = float(signal[col])
            
            labels.append(label)
        
        return pd.DataFrame(labels)
    
    def _calculate_expected_return(self, signal):
        """Calculate expected return percentage"""
        entry = signal["entry"]
        take_profit = signal["take_profit"]
        
        if signal["side"] == 1:  # Long
            return (take_profit - entry) / entry
        else:  # Short
            return (entry - take_profit) / entry
    
    def _calculate_risk_amount(self, signal):
        """Calculate risk amount percentage"""
        entry = signal["entry"]
        stop_loss = signal["stop_loss"]
        
        return abs(entry - stop_loss) / entry
    
    def _calculate_reward_amount(self, signal):
        """Calculate reward amount percentage"""
        entry = signal["entry"]
        take_profit = signal["take_profit"]
        
        return abs(take_profit - entry) / entry
    
    def _print_summary(self, labels):
        """Print labeling summary"""
        print("\n=== LABELING SUMMARY ===")
        print(f"Total labels: {len(labels)}")
        
        if not labels.empty:
            # By strategy
            strategy_counts = labels.groupby("strategy").size()
            print(f"\nLabels by strategy:")
            for strategy, count in strategy_counts.items():
                print(f"  {strategy}: {count}")
            
            # By side
            side_counts = labels.groupby("side").size()
            print(f"\nLabels by side:")
            for side, count in side_counts.items():
                side_name = "Long" if side == 1 else "Short"
                print(f"  {side_name}: {count}")
            
            # By instrument
            instrument_counts = labels.groupby("instrument").size()
            print(f"\nLabels by instrument:")
            for instrument, count in instrument_counts.items():
                print(f"  {instrument}: {count}")
            
            # Risk/Reward statistics
            print(f"\nRisk/Reward Statistics:")
            print(f"  Average Expected Return: {labels['expected_return'].mean():.4f}")
            print(f"  Average Risk Amount: {labels['risk_amount'].mean():.4f}")
            print(f"  Average Risk/Reward Ratio: {labels['risk_reward'].mean():.2f}")
            print(f"  Average Confidence: {labels['confidence'].mean():.3f}")
    
    def get_feature_importance_data(self, labels, features_df):
        """Prepare data for feature importance analysis"""
        # Merge labels with features
        merged = labels.merge(
            features_df, 
            on=["instrument", "ts"], 
            how="left", 
            suffixes=("_label", "_feature")
        )
        
        # Create binary target (1 for signals, 0 for no signals)
        feature_cols = [col for col in features_df.columns 
                       if col not in ["ts", "instrument", "open", "high", "low", "close", "volume"]]
        
        X = merged[feature_cols].fillna(0)
        y = pd.Series([1] * len(merged), index=merged.index)  # All are positive examples
        
        return X, y, feature_cols

def main():
    parser = argparse.ArgumentParser(description="Run labeling pipeline")
    parser.add_argument("--features", default="data/features.parquet", 
                       help="Path to features file")
    parser.add_argument("--out", default="data/labels.parquet", 
                       help="Output path for labels")
    parser.add_argument("--no-save", action="store_true", 
                       help="Don't save labels to file")
    
    args = parser.parse_args()
    
    # Run labeling pipeline
    pipeline = LabelingPipeline()
    labels = pipeline.run_labeling(
        features_path=args.features,
        out_path=args.out,
        save=not args.no_save
    )

if __name__ == "__main__":
    main()
