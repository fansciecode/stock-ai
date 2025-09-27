#!/usr/bin/env python3
"""
🤖 REAL AI MODEL TRAINER
Trains AI models with real historical market data for production trading
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.neural_network import MLPClassifier
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data.real_market_data import real_market_data

class RealAITrainer:
    """Real AI model trainer using historical market data"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.models = {}
        self.scalers = {}
        self.feature_columns = []
        self.target_accuracy_threshold = 0.65  # 65% minimum accuracy
        
        # Model configurations
        self.model_configs = {
            'random_forest': {
                'model': RandomForestClassifier(
                    n_estimators=200,
                    max_depth=10,
                    min_samples_split=5,
                    min_samples_leaf=2,
                    random_state=42,
                    n_jobs=-1
                ),
                'name': 'Random Forest'
            },
            'gradient_boosting': {
                'model': GradientBoostingClassifier(
                    n_estimators=100,
                    learning_rate=0.1,
                    max_depth=6,
                    random_state=42
                ),
                'name': 'Gradient Boosting'
            },
            'logistic_regression': {
                'model': LogisticRegression(
                    random_state=42,
                    max_iter=1000
                ),
                'name': 'Logistic Regression'
            },
            'neural_network': {
                'model': MLPClassifier(
                    hidden_layer_sizes=(100, 50),
                    max_iter=500,
                    random_state=42,
                    early_stopping=True
                ),
                'name': 'Neural Network'
            }
        }
    
    def collect_training_data(self, symbols: List[str], period: str = "2y") -> pd.DataFrame:
        """Collect historical data for training"""
        self.logger.info(f"🔍 Collecting training data for {len(symbols)} symbols...")
        
        all_data = []
        
        for symbol in symbols:
            try:
                self.logger.info(f"📊 Fetching data for {symbol}...")
                
                # Get historical data
                hist_data = real_market_data.get_historical_data(symbol, period=period)
                
                if hist_data is None or hist_data.empty:
                    self.logger.warning(f"⚠️ No data available for {symbol}")
                    continue
                
                # Add symbol column
                hist_data['Symbol'] = symbol
                
                # Add features
                processed_data = self._engineer_features(hist_data, symbol)
                
                if processed_data is not None and not processed_data.empty:
                    all_data.append(processed_data)
                    self.logger.info(f"✅ Collected {len(processed_data)} records for {symbol}")
                
            except Exception as e:
                self.logger.error(f"❌ Error collecting data for {symbol}: {e}")
                continue
        
        if not all_data:
            raise ValueError("No training data collected for any symbols")
        
        # Combine all data
        combined_data = pd.concat(all_data, ignore_index=True)
        self.logger.info(f"📈 Total training records: {len(combined_data)}")
        
        return combined_data
    
    def _engineer_features(self, data: pd.DataFrame, symbol: str) -> Optional[pd.DataFrame]:
        """Engineer features for ML training"""
        try:
            df = data.copy()
            
            # Price-based features
            df['Price_Change_1d'] = df['Close'].pct_change()
            df['Price_Change_3d'] = df['Close'].pct_change(periods=3)
            df['Price_Change_7d'] = df['Close'].pct_change(periods=7)
            
            # Moving averages
            df['SMA_5'] = df['Close'].rolling(window=5).mean()
            df['SMA_10'] = df['Close'].rolling(window=10).mean()
            df['SMA_20'] = df['Close'].rolling(window=20).mean()
            
            # Price relative to moving averages
            df['Price_vs_SMA_5'] = (df['Close'] - df['SMA_5']) / df['SMA_5']
            df['Price_vs_SMA_20'] = (df['Close'] - df['SMA_20']) / df['SMA_20']
            
            # Volume features
            df['Volume_MA'] = df['Volume'].rolling(window=20).mean()
            df['Volume_Ratio'] = df['Volume'] / df['Volume_MA']
            
            # Volatility features
            df['High_Low_Pct'] = (df['High'] - df['Low']) / df['Close']
            df['Open_Close_Pct'] = (df['Close'] - df['Open']) / df['Open']
            
            # Technical indicators (if available)
            if 'RSI' in df.columns:
                df['RSI_Signal'] = np.where(df['RSI'] < 30, 1, np.where(df['RSI'] > 70, -1, 0))
            
            if 'MACD' in df.columns and 'MACD_Signal' in df.columns:
                df['MACD_Signal_Cross'] = np.where(df['MACD'] > df['MACD_Signal'], 1, -1)
            
            # Market session features
            df['Hour'] = df.index.hour if hasattr(df.index, 'hour') else 12
            df['DayOfWeek'] = df.index.dayofweek if hasattr(df.index, 'dayofweek') else 1
            
            # Asset category (based on symbol)
            if symbol.endswith('-USD'):
                df['Asset_Category'] = 'crypto'
            elif symbol.endswith('.NS'):
                df['Asset_Category'] = 'indian_stock'
            else:
                df['Asset_Category'] = 'us_stock'
            
            # Create target variable (future price movement)
            # 1 = BUY (price will go up), 0 = SELL (price will go down)
            df['Future_Return'] = df['Close'].shift(-1) / df['Close'] - 1
            df['Target'] = np.where(df['Future_Return'] > 0.01, 1, 0)  # 1% threshold
            
            # Remove rows with NaN values
            df = df.dropna()
            
            if len(df) < 100:  # Need minimum data
                self.logger.warning(f"⚠️ Insufficient data for {symbol}: {len(df)} records")
                return None
            
            return df
            
        except Exception as e:
            self.logger.error(f"❌ Feature engineering error for {symbol}: {e}")
            return None
    
    def prepare_features_and_target(self, data: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare features and target for training"""
        
        # Define feature columns
        feature_columns = [
            'Price_Change_1d', 'Price_Change_3d', 'Price_Change_7d',
            'Price_vs_SMA_5', 'Price_vs_SMA_20',
            'Volume_Ratio', 'High_Low_Pct', 'Open_Close_Pct',
            'Hour', 'DayOfWeek'
        ]
        
        # Add technical indicators if available
        if 'RSI_Signal' in data.columns:
            feature_columns.append('RSI_Signal')
        if 'MACD_Signal_Cross' in data.columns:
            feature_columns.append('MACD_Signal_Cross')
        
        # Add asset category (one-hot encoded)
        if 'Asset_Category' in data.columns:
            asset_dummies = pd.get_dummies(data['Asset_Category'], prefix='Asset')
            data = pd.concat([data, asset_dummies], axis=1)
            feature_columns.extend(asset_dummies.columns.tolist())
        
        # Select features that exist in the data
        available_features = [col for col in feature_columns if col in data.columns]
        
        if not available_features:
            raise ValueError("No valid features found in data")
        
        self.feature_columns = available_features
        
        X = data[available_features]
        y = data['Target']
        
        self.logger.info(f"📊 Features: {len(available_features)}")
        self.logger.info(f"📊 Samples: {len(X)}")
        self.logger.info(f"📊 Target distribution: {y.value_counts().to_dict()}")
        
        return X, y
    
    def train_models(self, X: pd.DataFrame, y: pd.Series) -> Dict:
        """Train multiple models and select the best one"""
        self.logger.info("🤖 Training AI models...")
        
        results = {}
        
        # Time series split for validation
        tscv = TimeSeriesSplit(n_splits=5)
        
        for model_name, config in self.model_configs.items():
            try:
                self.logger.info(f"🔧 Training {config['name']}...")
                
                model = config['model']
                
                # Cross-validation scores
                cv_scores = cross_val_score(model, X, y, cv=tscv, scoring='accuracy')
                
                # Train on full dataset
                model.fit(X, y)
                
                # Make predictions for final accuracy
                y_pred = model.predict(X)
                
                # Calculate metrics
                accuracy = accuracy_score(y, y_pred)
                precision = precision_score(y, y_pred, average='weighted', zero_division=0)
                recall = recall_score(y, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(y, y_pred, average='weighted', zero_division=0)
                
                results[model_name] = {
                    'model': model,
                    'accuracy': accuracy,
                    'cv_mean': cv_scores.mean(),
                    'cv_std': cv_scores.std(),
                    'precision': precision,
                    'recall': recall,
                    'f1_score': f1,
                    'name': config['name']
                }
                
                self.logger.info(f"✅ {config['name']}: Accuracy={accuracy:.3f}, CV={cv_scores.mean():.3f}±{cv_scores.std():.3f}")
                
            except Exception as e:
                self.logger.error(f"❌ Error training {config['name']}: {e}")
                continue
        
        if not results:
            raise ValueError("No models were successfully trained")
        
        # Select best model based on cross-validation score
        best_model_name = max(results.keys(), key=lambda k: results[k]['cv_mean'])
        best_result = results[best_model_name]
        
        self.logger.info(f"🏆 Best model: {best_result['name']} (CV: {best_result['cv_mean']:.3f})")
        
        return results, best_model_name
    
    def save_model(self, model, model_name: str, accuracy: float, feature_columns: List[str]) -> str:
        """Save trained model to disk"""
        try:
            # Create models directory
            models_dir = "models"
            os.makedirs(models_dir, exist_ok=True)
            
            # Model metadata
            model_data = {
                'model': model,
                'accuracy': accuracy,
                'feature_columns': feature_columns,
                'training_date': datetime.now().isoformat(),
                'model_type': model_name,
                'min_accuracy_threshold': self.target_accuracy_threshold
            }
            
            # Save model
            model_path = os.path.join(models_dir, f"real_trading_model_{model_name}.joblib")
            joblib.dump(model_data, model_path)
            
            self.logger.info(f"💾 Model saved: {model_path}")
            
            return model_path
            
        except Exception as e:
            self.logger.error(f"❌ Error saving model: {e}")
            raise
    
    def train_production_model(self, symbols: List[str] = None) -> Dict:
        """Train production-ready model"""
        
        if symbols is None:
            # Default symbols for training
            symbols = [
                'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA',
                'BTC-USD', 'ETH-USD', 'BNB-USD',
                'RELIANCE.NS', 'TCS.NS', 'INFY.NS'
            ]
        
        try:
            self.logger.info("🚀 Starting production model training...")
            
            # Step 1: Collect training data
            training_data = self.collect_training_data(symbols, period="2y")
            
            # Step 2: Prepare features and target
            X, y = self.prepare_features_and_target(training_data)
            
            # Step 3: Scale features
            scaler = StandardScaler()
            X_scaled = pd.DataFrame(
                scaler.fit_transform(X),
                columns=X.columns,
                index=X.index
            )
            
            # Step 4: Train models
            results, best_model_name = self.train_models(X_scaled, y)
            best_result = results[best_model_name]
            
            # Step 5: Check if model meets accuracy threshold
            if best_result['cv_mean'] < self.target_accuracy_threshold:
                self.logger.warning(f"⚠️ Model accuracy {best_result['cv_mean']:.3f} below threshold {self.target_accuracy_threshold}")
                self.logger.warning("🔄 Consider collecting more data or adjusting features")
            
            # Step 6: Save model and scaler
            model_path = self.save_model(
                best_result['model'],
                best_model_name,
                best_result['accuracy'],
                self.feature_columns
            )
            
            # Save scaler
            scaler_path = model_path.replace('.joblib', '_scaler.joblib')
            joblib.dump(scaler, scaler_path)
            
            # Step 7: Create summary
            summary = {
                'success': True,
                'model_path': model_path,
                'scaler_path': scaler_path,
                'best_model': best_result['name'],
                'accuracy': best_result['accuracy'],
                'cv_accuracy': best_result['cv_mean'],
                'cv_std': best_result['cv_std'],
                'precision': best_result['precision'],
                'recall': best_result['recall'],
                'f1_score': best_result['f1_score'],
                'feature_count': len(self.feature_columns),
                'training_samples': len(X),
                'symbols_trained': len(symbols),
                'training_date': datetime.now().isoformat(),
                'production_ready': best_result['cv_mean'] >= self.target_accuracy_threshold
            }
            
            self.logger.info("🎉 Model training completed!")
            self.logger.info(f"📊 Final accuracy: {best_result['accuracy']:.3f}")
            self.logger.info(f"📊 Cross-validation: {best_result['cv_mean']:.3f} ± {best_result['cv_std']:.3f}")
            self.logger.info(f"🎯 Production ready: {summary['production_ready']}")
            
            return summary
            
        except Exception as e:
            self.logger.error(f"❌ Model training failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'production_ready': False
            }

# Global instance
real_ai_trainer = RealAITrainer()

def train_production_ai_model(symbols: List[str] = None) -> Dict:
    """Train production AI model with real data"""
    return real_ai_trainer.train_production_model(symbols)
