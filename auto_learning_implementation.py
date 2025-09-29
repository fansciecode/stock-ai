#!/usr/bin/env python3
"""
Auto-Learning Implementation
===========================

This script implements the first phase of the auto-learning pipeline for the AI trading system.
It sets up data collection, performance tracking, and automated model retraining.
"""

import os
import sqlite3
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import json

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/auto_learning.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AutoLearningPipeline:
    """Implements the auto-learning pipeline for the AI trading system"""
    
    def __init__(self):
        """Initialize the auto-learning pipeline"""
        self.db_path = 'data/trading.db'
        self.model_path = 'models/auto_learning_model.joblib'
        self.performance_path = 'data/model_performance.json'
        self.feature_columns = [
            'open', 'high', 'low', 'close', 'volume',
            'ma_5', 'ma_10', 'ma_20', 'ma_50', 'ma_200',
            'rsi_14', 'macd', 'macd_signal', 'macd_hist',
            'bb_upper', 'bb_middle', 'bb_lower',
            'atr_14', 'adx_14', 'cci_14',
            'stoch_k', 'stoch_d', 'williams_r',
            'obv', 'mfi_14', 'roc_10'
        ]
        
        # Create directories if they don't exist
        os.makedirs('models', exist_ok=True)
        os.makedirs('data', exist_ok=True)
        os.makedirs('logs', exist_ok=True)
        
        # Create performance tracking table if it doesn't exist
        self._create_performance_table()
    
    def _create_performance_table(self):
        """Create the model performance tracking table"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS model_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_version TEXT,
                accuracy REAL,
                precision REAL,
                recall REAL,
                f1_score REAL,
                training_date TEXT,
                data_points INTEGER,
                features INTEGER,
                notes TEXT
            )
            ''')
            
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS trade_outcomes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT,
                timestamp TEXT,
                prediction TEXT,
                confidence REAL,
                actual_outcome TEXT,
                profit_loss REAL,
                features TEXT,
                market_conditions TEXT
            )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Created performance tracking tables")
        except Exception as e:
            logger.error(f"Error creating performance tables: {e}")
    
    def collect_historical_data(self, days=30):
        """Collect historical data for training"""
        try:
            logger.info(f"Collecting historical data for the past {days} days")
            
            # Connect to the database
            conn = sqlite3.connect(self.db_path)
            
            # Get market data from the past X days
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)
            
            query = f"""
            SELECT * FROM market_data 
            WHERE timestamp BETWEEN '{start_date.strftime('%Y-%m-%d')}' AND '{end_date.strftime('%Y-%m-%d')}'
            """
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            if df.empty:
                logger.warning("No historical data found")
                return None
            
            logger.info(f"Collected {len(df)} data points for training")
            return df
        except Exception as e:
            logger.error(f"Error collecting historical data: {e}")
            return None
    
    def collect_trade_outcomes(self):
        """Collect trade outcomes for training"""
        try:
            logger.info("Collecting trade outcomes")
            
            # Connect to the database
            conn = sqlite3.connect(self.db_path)
            
            query = """
            SELECT * FROM trade_outcomes
            """
            
            df = pd.read_sql_query(query, conn)
            conn.close()
            
            if df.empty:
                logger.warning("No trade outcomes found")
                return None
            
            logger.info(f"Collected {len(df)} trade outcomes for training")
            return df
        except Exception as e:
            logger.error(f"Error collecting trade outcomes: {e}")
            return None
    
    def prepare_training_data(self, market_data, trade_outcomes=None):
        """Prepare data for training"""
        try:
            if market_data is None:
                logger.warning("No market data available for training")
                return None, None
            
            # Process market data
            X = market_data[self.feature_columns].copy()
            
            # Create target variable (for now, using a simple rule)
            # In the future, this would use actual trade outcomes
            market_data['next_day_return'] = market_data['close'].pct_change(1).shift(-1)
            market_data['target'] = np.where(market_data['next_day_return'] > 0.01, 1, 0)  # 1% threshold for buy signal
            
            y = market_data['target'].copy()
            
            # Drop rows with NaN values
            valid_indices = ~(X.isna().any(axis=1) | y.isna())
            X = X[valid_indices]
            y = y[valid_indices]
            
            if len(X) == 0:
                logger.warning("No valid data points after preprocessing")
                return None, None
            
            logger.info(f"Prepared {len(X)} data points for training")
            return X, y
        except Exception as e:
            logger.error(f"Error preparing training data: {e}")
            return None, None
    
    def train_model(self, X, y):
        """Train the AI model"""
        try:
            if X is None or y is None:
                logger.warning("No data available for training")
                return None
            
            # Split the data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            logger.info(f"Training model with {len(X_train)} samples")
            
            # Create an ensemble model
            rf = RandomForestClassifier(n_estimators=100, random_state=42)
            gb = GradientBoostingClassifier(n_estimators=100, random_state=42)
            
            # Train the models
            rf.fit(X_train, y_train)
            gb.fit(X_train, y_train)
            
            # Make predictions
            rf_preds = rf.predict(X_test)
            gb_preds = gb.predict(X_test)
            
            # Combine predictions (simple average)
            ensemble_preds = np.round((rf_preds + gb_preds) / 2)
            
            # Evaluate the model
            accuracy = accuracy_score(y_test, ensemble_preds)
            precision = precision_score(y_test, ensemble_preds, zero_division=0)
            recall = recall_score(y_test, ensemble_preds, zero_division=0)
            f1 = f1_score(y_test, ensemble_preds, zero_division=0)
            
            logger.info(f"Model trained with accuracy: {accuracy:.4f}, precision: {precision:.4f}, recall: {recall:.4f}, f1: {f1:.4f}")
            
            # Create the ensemble model (simple dictionary of models)
            ensemble_model = {
                'random_forest': rf,
                'gradient_boosting': gb,
                'feature_columns': self.feature_columns,
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'training_date': datetime.now().isoformat(),
                'version': f"auto_learning_v{datetime.now().strftime('%Y%m%d%H%M')}"
            }
            
            # Save the model
            joblib.dump(ensemble_model, self.model_path)
            logger.info(f"Model saved to {self.model_path}")
            
            # Save performance metrics
            self._save_performance_metrics(ensemble_model, len(X))
            
            return ensemble_model
        except Exception as e:
            logger.error(f"Error training model: {e}")
            return None
    
    def _save_performance_metrics(self, model, data_points):
        """Save model performance metrics to the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
            INSERT INTO model_performance (
                model_version, accuracy, precision, recall, f1_score, 
                training_date, data_points, features, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                model['version'],
                model['accuracy'],
                model['precision'],
                model['recall'],
                model['f1_score'],
                model['training_date'],
                data_points,
                len(self.feature_columns),
                "Auto-trained model"
            ))
            
            conn.commit()
            conn.close()
            logger.info("Saved performance metrics to database")
        except Exception as e:
            logger.error(f"Error saving performance metrics: {e}")
    
    def setup_scheduled_retraining(self):
        """Set up scheduled retraining (creates a cron job file)"""
        try:
            cron_file = 'auto_learning_cron.txt'
            with open(cron_file, 'w') as f:
                f.write("# Add this to your crontab to schedule weekly retraining\n")
                f.write("# Run every Sunday at 2:00 AM\n")
                f.write("0 2 * * 0 cd /Users/unitednewdigitalmedia/Desktop/kiran/IBCM-stack/stock-ai && python3 auto_learning_implementation.py --retrain\n")
            
            logger.info(f"Created cron job file: {cron_file}")
            print(f"\nTo schedule automatic retraining, add the contents of {cron_file} to your crontab:")
            print("Run 'crontab -e' and paste the contents of the file.")
        except Exception as e:
            logger.error(f"Error setting up scheduled retraining: {e}")
    
    def run_pipeline(self):
        """Run the complete auto-learning pipeline"""
        logger.info("Starting auto-learning pipeline")
        
        # Step 1: Collect historical data
        market_data = self.collect_historical_data(days=30)
        
        # Step 2: Collect trade outcomes
        trade_outcomes = self.collect_trade_outcomes()
        
        # Step 3: Prepare training data
        X, y = self.prepare_training_data(market_data, trade_outcomes)
        
        # Step 4: Train the model
        model = self.train_model(X, y)
        
        # Step 5: Set up scheduled retraining
        self.setup_scheduled_retraining()
        
        logger.info("Auto-learning pipeline completed")
        
        return model is not None

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Auto-Learning Pipeline')
    parser.add_argument('--retrain', action='store_true', help='Retrain the model')
    args = parser.parse_args()
    
    pipeline = AutoLearningPipeline()
    
    if args.retrain:
        print("Retraining the model...")
        success = pipeline.run_pipeline()
        if success:
            print("Model successfully retrained")
        else:
            print("Model retraining failed")
    else:
        print("Setting up the auto-learning pipeline...")
        pipeline.run_pipeline()
        print("\nAuto-learning pipeline has been set up.")
        print("The system will now collect trade outcomes and retrain the model automatically.")
        print("You can manually retrain the model by running: python3 auto_learning_implementation.py --retrain")
