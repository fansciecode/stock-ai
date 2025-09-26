#!/usr/bin/env python3
"""
Live Data Training Pipeline - Train AI models on real market data for order execution
Trains models to make buy/sell/hold decisions based on live market conditions
"""

import pandas as pd
import numpy as np
import sys
import os
from datetime import datetime, timedelta
import asyncio
import logging
from typing import Dict, List, Tuple
import joblib
import json

# Add project path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from features.build_features import FeatureEngineer
from strategies.base import StrategyManager
from models.advanced_models import LSTMTradingModel, TransformerTradingModel, AdvancedTradingModelTrainer

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except (ImportError, OSError):
    from sklearn.ensemble import RandomForestClassifier
    LIGHTGBM_AVAILABLE = False

from sklearn.model_selection import train_test_split, TimeSeriesSplit
from sklearn.metrics import classification_report, confusion_matrix
import torch
import torch.nn as nn

class LiveDataTrainer:
    """Advanced training pipeline using live market data for order execution"""
    
    def __init__(self):
        self.feature_engineer = FeatureEngineer()
        self.strategy_manager = StrategyManager()
        self.logger = self._setup_logging()
        
        # Training parameters
        self.lookback_window = 50  # Number of periods to look back
        self.prediction_horizon = 5  # Periods ahead to predict
        self.min_data_points = 1000  # Minimum data for training
        
        # Model storage
        self.models = {}
        self.model_performance = {}
        
        # Training data storage
        self.training_data = {}
        self.validation_data = {}
        
    def _setup_logging(self):
        """Setup logging for training pipeline"""
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        return logging.getLogger(__name__)
    
    async def collect_training_data(self) -> Dict[str, pd.DataFrame]:
        """Collect and prepare training data from live sources"""
        
        self.logger.info("🔄 Collecting training data from live sources...")
        
        training_datasets = {}
        
        # Load live market data if available
        live_data_files = [
            "data/global_market_data.parquet",
            "data/live_market_data.parquet"
        ]
        
        for file_path in live_data_files:
            if os.path.exists(file_path):
                try:
                    df = pd.read_parquet(file_path)
                    
                    if not df.empty:
                        # Group by instrument for individual training
                        for instrument in df['instrument'].unique():
                            instrument_data = df[df['instrument'] == instrument].copy()
                            
                            if len(instrument_data) >= self.min_data_points:
                                training_datasets[instrument] = instrument_data
                                self.logger.info(f"  ✅ {instrument}: {len(instrument_data)} records")
                            else:
                                self.logger.warning(f"  ⚠️ {instrument}: Only {len(instrument_data)} records (minimum {self.min_data_points})")
                
                except Exception as e:
                    self.logger.error(f"Error loading {file_path}: {e}")
        
        # Load individual instrument files
        individual_files = [
            f for f in os.listdir("data/") 
            if f.startswith("live_data_") and f.endswith(".parquet")
        ]
        
        for file_name in individual_files:
            try:
                instrument = file_name.replace("live_data_", "").replace(".parquet", "")
                file_path = os.path.join("data", file_name)
                
                df = pd.read_parquet(file_path)
                if not df.empty and len(df) >= 100:  # Lower threshold for individual files
                    df['instrument'] = instrument
                    training_datasets[instrument] = df
                    self.logger.info(f"  ✅ {instrument}: {len(df)} records (individual file)")
            
            except Exception as e:
                self.logger.error(f"Error loading {file_name}: {e}")
        
        self.logger.info(f"📊 Collected data for {len(training_datasets)} instruments")
        return training_datasets
    
    def create_training_labels(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create training labels for buy/sell/hold decisions"""
        
        self.logger.info(f"🏷️ Creating training labels for {data['instrument'].iloc[0]}")
        
        # Sort by timestamp
        data = data.sort_values('ts').reset_index(drop=True)
        
        # Calculate future returns for labeling
        data['future_return_1'] = data['close'].shift(-1) / data['close'] - 1
        data['future_return_3'] = data['close'].shift(-3) / data['close'] - 1
        data['future_return_5'] = data['close'].shift(-5) / data['close'] - 1
        
        # Create labels based on future returns
        conditions = [
            data['future_return_3'] > 0.01,   # Buy if 1%+ gain in 3 periods
            data['future_return_3'] < -0.01,  # Sell if 1%+ loss in 3 periods
        ]
        choices = [1, -1]  # 1 = Buy, -1 = Sell, 0 = Hold (default)
        
        data['target'] = np.select(conditions, choices, default=0)
        
        # Alternative labeling using strategy signals
        try:
            # Generate features first
            features_data = self.feature_engineer.build_all_features(data)
            
            if not features_data.empty:
                # Generate strategy signals
                signals = self.strategy_manager.generate_all_signals(features_data)
                
                if not signals.empty:
                    # Merge strategy signals as additional labels
                    signal_labels = signals.groupby('ts')['side'].first().reset_index()
                    signal_labels['strategy_target'] = signal_labels['side']
                    
                    data = data.merge(signal_labels[['ts', 'strategy_target']], on='ts', how='left')
                    data['strategy_target'] = data['strategy_target'].fillna(0)
                    
                    # Combine with future returns for final target
                    data['combined_target'] = data[['target', 'strategy_target']].mean(axis=1)
                    data['final_target'] = np.where(
                        data['combined_target'] > 0.3, 1,  # Buy
                        np.where(data['combined_target'] < -0.3, -1, 0)  # Sell, Hold
                    )
                else:
                    data['final_target'] = data['target']
            else:
                data['final_target'] = data['target']
        
        except Exception as e:
            self.logger.warning(f"Strategy labeling failed: {e}, using return-based labels")
            data['final_target'] = data['target']
        
        # Convert to classification labels
        data['action'] = data['final_target'].map({1: 2, 0: 1, -1: 0})  # Buy=2, Hold=1, Sell=0
        
        label_counts = data['action'].value_counts().sort_index()
        self.logger.info(f"  📊 Label distribution: Sell={label_counts.get(0, 0)}, Hold={label_counts.get(1, 0)}, Buy={label_counts.get(2, 0)}")
        
        return data
    
    def prepare_features_and_targets(self, data: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features and targets for training"""
        
        # Generate all features
        features_data = self.feature_engineer.build_all_features(data)
        
        if features_data.empty:
            raise ValueError("Feature engineering failed")
        
        # Merge features with labels
        labeled_data = data.merge(features_data, on=['ts', 'instrument'], how='inner')
        
        # Select feature columns (excluding metadata and targets)
        feature_columns = [col for col in features_data.columns 
                          if col not in ['ts', 'instrument', 'open', 'high', 'low', 'close', 'volume']]
        
        # Ensure we have features
        if not feature_columns:
            raise ValueError("No feature columns found")
        
        # Prepare feature matrix
        X = labeled_data[feature_columns].fillna(0).values
        y = labeled_data['action'].fillna(1).astype(int).values  # Default to Hold
        
        # Remove rows with invalid targets
        valid_mask = ~np.isnan(y)
        X = X[valid_mask]
        y = y[valid_mask]
        
        self.logger.info(f"  📊 Training data shape: {X.shape}, Target distribution: {np.bincount(y)}")
        
        return X, y, feature_columns
    
    def train_ensemble_models(self, X: np.ndarray, y: np.ndarray, instrument: str) -> Dict:
        """Train ensemble of models for robust predictions"""
        
        self.logger.info(f"🤖 Training ensemble models for {instrument}")
        
        models = {}
        
        # Split data with time series awareness
        tscv = TimeSeriesSplit(n_splits=3)
        
        for fold, (train_idx, val_idx) in enumerate(tscv.split(X)):
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            
            fold_models = {}
            
            # Model 1: LightGBM or RandomForest
            if LIGHTGBM_AVAILABLE:
                try:
                    lgb_model = lgb.LGBMClassifier(
                        objective='multiclass',
                        num_class=3,
                        n_estimators=100,
                        learning_rate=0.1,
                        random_state=42
                    )
                    lgb_model.fit(X_train, y_train)
                    
                    val_score = lgb_model.score(X_val, y_val)
                    fold_models['lightgbm'] = {
                        'model': lgb_model,
                        'score': val_score,
                        'type': 'lightgbm'
                    }
                    self.logger.info(f"    LightGBM Fold {fold}: {val_score:.4f}")
                
                except Exception as e:
                    self.logger.warning(f"LightGBM training failed: {e}")
            
            # Fallback: RandomForest
            try:
                rf_model = RandomForestClassifier(
                    n_estimators=100,
                    max_depth=10,
                    random_state=42,
                    n_jobs=-1
                )
                rf_model.fit(X_train, y_train)
                
                val_score = rf_model.score(X_val, y_val)
                fold_models['random_forest'] = {
                    'model': rf_model,
                    'score': val_score,
                    'type': 'random_forest'
                }
                self.logger.info(f"    RandomForest Fold {fold}: {val_score:.4f}")
            
            except Exception as e:
                self.logger.error(f"RandomForest training failed: {e}")
            
            # Model 3: Neural Network (if enough data)
            if len(X_train) > 1000:
                try:
                    # Simple feedforward network
                    from sklearn.neural_network import MLPClassifier
                    
                    nn_model = MLPClassifier(
                        hidden_layer_sizes=(100, 50),
                        max_iter=200,
                        random_state=42,
                        early_stopping=True
                    )
                    nn_model.fit(X_train, y_train)
                    
                    val_score = nn_model.score(X_val, y_val)
                    fold_models['neural_network'] = {
                        'model': nn_model,
                        'score': val_score,
                        'type': 'neural_network'
                    }
                    self.logger.info(f"    NeuralNet Fold {fold}: {val_score:.4f}")
                
                except Exception as e:
                    self.logger.warning(f"Neural network training failed: {e}")
            
            models[f'fold_{fold}'] = fold_models
        
        # Select best models from each fold
        best_models = {}
        for model_type in ['lightgbm', 'random_forest', 'neural_network']:
            best_score = 0
            best_model = None
            
            for fold_name, fold_models in models.items():
                if model_type in fold_models:
                    if fold_models[model_type]['score'] > best_score:
                        best_score = fold_models[model_type]['score']
                        best_model = fold_models[model_type]
            
            if best_model:
                best_models[model_type] = best_model
                self.logger.info(f"  ✅ Best {model_type}: {best_score:.4f}")
        
        return best_models
    
    def save_trained_models(self, models: Dict, instrument: str, feature_columns: List[str]):
        """Save trained models and metadata"""
        
        model_dir = "models/live_trained"
        os.makedirs(model_dir, exist_ok=True)
        
        # Save each model
        for model_name, model_info in models.items():
            model_path = os.path.join(model_dir, f"{instrument}_{model_name}.joblib")
            joblib.dump(model_info['model'], model_path)
            
            self.logger.info(f"  💾 Saved {model_name} for {instrument}")
        
        # Save metadata
        metadata = {
            'instrument': instrument,
            'feature_columns': feature_columns,
            'models': {name: {'score': info['score'], 'type': info['type']} 
                      for name, info in models.items()},
            'training_date': datetime.now().isoformat(),
            'feature_count': len(feature_columns)
        }
        
        metadata_path = os.path.join(model_dir, f"{instrument}_metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        self.logger.info(f"  📋 Saved metadata for {instrument}")
    
    async def train_on_live_data(self, continuous: bool = False):
        """Main training pipeline using live data"""
        
        self.logger.info("🚀 STARTING LIVE DATA TRAINING PIPELINE")
        self.logger.info("=" * 60)
        
        while True:
            try:
                # Collect training data
                training_datasets = await self.collect_training_data()
                
                if not training_datasets:
                    self.logger.warning("No training data available")
                    if continuous:
                        await asyncio.sleep(300)  # Wait 5 minutes
                        continue
                    else:
                        break
                
                # Train models for each instrument
                for instrument, data in training_datasets.items():
                    try:
                        self.logger.info(f"🎯 Training models for {instrument}")
                        
                        # Create labels
                        labeled_data = self.create_training_labels(data)
                        
                        # Prepare features and targets
                        X, y, feature_columns = self.prepare_features_and_targets(labeled_data)
                        
                        if len(X) < 100:
                            self.logger.warning(f"  ⚠️ Insufficient data for {instrument}: {len(X)} samples")
                            continue
                        
                        # Train ensemble models
                        models = self.train_ensemble_models(X, y, instrument)
                        
                        if models:
                            # Save models
                            self.save_trained_models(models, instrument, feature_columns)
                            
                            # Store in memory for immediate use
                            self.models[instrument] = models
                            
                            self.logger.info(f"  ✅ Successfully trained {len(models)} models for {instrument}")
                        else:
                            self.logger.warning(f"  ❌ No models trained for {instrument}")
                    
                    except Exception as e:
                        self.logger.error(f"Training failed for {instrument}: {e}")
                        continue
                
                # Training summary
                total_instruments = len(training_datasets)
                successful_training = len(self.models)
                
                self.logger.info("📊 TRAINING SUMMARY:")
                self.logger.info(f"  Total Instruments: {total_instruments}")
                self.logger.info(f"  Successfully Trained: {successful_training}")
                self.logger.info(f"  Success Rate: {successful_training/total_instruments*100:.1f}%")
                
                # Save training summary
                summary = {
                    'training_date': datetime.now().isoformat(),
                    'total_instruments': total_instruments,
                    'successful_training': successful_training,
                    'success_rate': successful_training/total_instruments*100 if total_instruments > 0 else 0,
                    'trained_instruments': list(self.models.keys())
                }
                
                with open('models/live_trained/training_summary.json', 'w') as f:
                    json.dump(summary, f, indent=2)
                
                if not continuous:
                    break
                
                # Wait before next training cycle
                self.logger.info("😴 Waiting 1 hour before next training cycle...")
                await asyncio.sleep(3600)  # Wait 1 hour
            
            except Exception as e:
                self.logger.error(f"Training pipeline error: {e}")
                if continuous:
                    await asyncio.sleep(300)  # Wait 5 minutes on error
                else:
                    break
    
    def predict_action(self, instrument: str, current_data: pd.DataFrame) -> Dict:
        """Make trading decision using trained models"""
        
        if instrument not in self.models:
            return {'action': 'hold', 'confidence': 0.0, 'reason': 'No trained model'}
        
        try:
            # Generate features
            features_data = self.feature_engineer.build_all_features(current_data)
            
            if features_data.empty:
                return {'action': 'hold', 'confidence': 0.0, 'reason': 'Feature generation failed'}
            
            # Get latest features
            latest_features = features_data.iloc[-1]
            
            # Load metadata to get feature columns
            metadata_path = f"models/live_trained/{instrument}_metadata.json"
            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                feature_columns = metadata['feature_columns']
            else:
                # Fallback: use all numeric columns except metadata
                feature_columns = [col for col in features_data.columns 
                                 if col not in ['ts', 'instrument', 'open', 'high', 'low', 'close', 'volume']]
            
            # Prepare feature vector
            X = latest_features[feature_columns].fillna(0).values.reshape(1, -1)
            
            # Get predictions from all models
            predictions = []
            confidences = []
            
            for model_name, model_info in self.models[instrument].items():
                model = model_info['model']
                
                try:
                    pred = model.predict(X)[0]
                    if hasattr(model, 'predict_proba'):
                        confidence = np.max(model.predict_proba(X)[0])
                    else:
                        confidence = 0.7  # Default confidence
                    
                    predictions.append(pred)
                    confidences.append(confidence)
                
                except Exception as e:
                    self.logger.warning(f"Prediction failed for {model_name}: {e}")
            
            if not predictions:
                return {'action': 'hold', 'confidence': 0.0, 'reason': 'All model predictions failed'}
            
            # Ensemble prediction (majority vote with confidence weighting)
            weighted_prediction = np.average(predictions, weights=confidences)
            final_confidence = np.mean(confidences)
            
            # Convert to action
            if weighted_prediction > 1.6:  # Closer to 2 (buy)
                action = 'buy'
            elif weighted_prediction < 0.4:  # Closer to 0 (sell)
                action = 'sell'
            else:
                action = 'hold'
            
            return {
                'action': action,
                'confidence': final_confidence,
                'raw_prediction': weighted_prediction,
                'individual_predictions': predictions,
                'model_count': len(predictions)
            }
        
        except Exception as e:
            self.logger.error(f"Prediction error for {instrument}: {e}")
            return {'action': 'hold', 'confidence': 0.0, 'reason': f'Error: {e}'}

async def main():
    """Main function to run live data training"""
    
    import argparse
    
    parser = argparse.ArgumentParser(description='Live Data Training Pipeline')
    parser.add_argument('--continuous', action='store_true', help='Run continuous training')
    parser.add_argument('--instrument', type=str, help='Train specific instrument only')
    
    args = parser.parse_args()
    
    trainer = LiveDataTrainer()
    
    if args.continuous:
        print("🔄 Starting continuous training mode...")
        await trainer.train_on_live_data(continuous=True)
    else:
        print("🎯 Starting single training cycle...")
        await trainer.train_on_live_data(continuous=False)

if __name__ == "__main__":
    asyncio.run(main())
