#!/usr/bin/env python3
"""
🤖 REAL AI TRAINING SYSTEM
Train the AI with actual historical data and machine learning
"""

import pandas as pd
import numpy as np
import yfinance as yf
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class RealAITrainer:
    def __init__(self):
        self.model = None
        self.feature_columns = []
        os.makedirs('models', exist_ok=True)
        os.makedirs('data', exist_ok=True)
    
    def collect_historical_data(self):
        """Collect real historical data for training"""
        print("📊 COLLECTING HISTORICAL DATA:")
        print("=" * 50)
        
        # Major stocks and crypto for training
        symbols = {
            'stocks': ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'],
            'crypto': ['BTC-USD', 'ETH-USD', 'ADA-USD', 'SOL-USD']
        }
        
        all_data = []
        
        for category, symbol_list in symbols.items():
            for symbol in symbol_list:
                try:
                    print(f"  📈 Downloading {symbol}...")
                    
                    # Get 2 years of data
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=730)
                    
                    ticker = yf.Ticker(symbol)
                    data = ticker.history(start=start_date, end=end_date)
                    
                    if len(data) > 100:  # Ensure we have enough data
                        data['symbol'] = symbol
                        data['category'] = category
                        all_data.append(data)
                        print(f"    ✅ {symbol}: {len(data)} days of data")
                    else:
                        print(f"    ❌ {symbol}: Insufficient data")
                        
                except Exception as e:
                    print(f"    ❌ {symbol}: Error - {e}")
        
        if all_data:
            combined_data = pd.concat(all_data, ignore_index=True)
            combined_data.to_csv('data/historical_data.csv', index=False)
            print(f"\n✅ Collected {len(combined_data)} total data points")
            return combined_data
        else:
            print("❌ No data collected")
            return None
    
    def create_features(self, data):
        """Create technical indicators and features"""
        print("\n🔧 CREATING AI FEATURES:")
        print("=" * 50)
        
        features_data = []
        
        for symbol in data['symbol'].unique():
            symbol_data = data[data['symbol'] == symbol].copy()
            symbol_data = symbol_data.sort_index()
            
            if len(symbol_data) < 50:
                continue
                
            # Technical indicators
            symbol_data['sma_10'] = symbol_data['Close'].rolling(10).mean()
            symbol_data['sma_20'] = symbol_data['Close'].rolling(20).mean()
            symbol_data['rsi'] = self.calculate_rsi(symbol_data['Close'])
            symbol_data['volatility'] = symbol_data['Close'].rolling(10).std()
            symbol_data['volume_ratio'] = symbol_data['Volume'] / symbol_data['Volume'].rolling(10).mean()
            
            # Price changes
            symbol_data['price_change_1d'] = symbol_data['Close'].pct_change(1)
            symbol_data['price_change_5d'] = symbol_data['Close'].pct_change(5)
            symbol_data['high_low_ratio'] = symbol_data['High'] / symbol_data['Low']
            
            # Future target (what we want to predict)
            symbol_data['future_return_3d'] = symbol_data['Close'].shift(-3) / symbol_data['Close'] - 1
            symbol_data['target'] = (symbol_data['future_return_3d'] > 0.02).astype(int)  # 2% gain target
            
            features_data.append(symbol_data)
        
        if features_data:
            final_data = pd.concat(features_data, ignore_index=True)
            
            # Select feature columns
            self.feature_columns = [
                'sma_10', 'sma_20', 'rsi', 'volatility', 'volume_ratio',
                'price_change_1d', 'price_change_5d', 'high_low_ratio'
            ]
            
            # Remove rows with NaN values
            final_data = final_data.dropna()
            
            print(f"  ✅ Created {len(self.feature_columns)} features")
            print(f"  ✅ {len(final_data)} training samples")
            
            final_data.to_csv('data/features.csv', index=False)
            return final_data
        
        return None
    
    def calculate_rsi(self, prices, period=14):
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    def train_model(self, data):
        """Train the AI model"""
        print("\n🤖 TRAINING AI MODEL:")
        print("=" * 50)
        
        # Prepare features and targets
        X = data[self.feature_columns]
        y = data['target']
        
        print(f"  📊 Training samples: {len(X)}")
        print(f"  🎯 Positive signals: {y.sum()} ({y.mean()*100:.1f}%)")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train Random Forest model
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        
        print("  🔄 Training Random Forest...")
        self.model.fit(X_train, y_train)
        
        # Evaluate model
        train_score = self.model.score(X_train, y_train)
        test_score = self.model.score(X_test, y_test)
        
        print(f"  ✅ Training accuracy: {train_score:.3f}")
        print(f"  ✅ Testing accuracy: {test_score:.3f}")
        
        # Feature importance
        importance = pd.DataFrame({
            'feature': self.feature_columns,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n📊 TOP FEATURES:")
        for _, row in importance.head(5).iterrows():
            print(f"  {row['feature']}: {row['importance']:.3f}")
        
        # Save model
        model_data = {
            'model': self.model,
            'feature_columns': self.feature_columns,
            'training_date': datetime.now().isoformat(),
            'accuracy': test_score
        }
        
        joblib.dump(model_data, 'models/trained_ai_model.pkl')
        print(f"\n💾 Model saved to models/trained_ai_model.pkl")
        
        return self.model
    
    def test_predictions(self, data):
        """Test the AI predictions"""
        print("\n🧪 TESTING AI PREDICTIONS:")
        print("=" * 50)
        
        # Get recent data for testing
        recent_data = data.tail(10)
        X_test = recent_data[self.feature_columns]
        
        predictions = self.model.predict(X_test)
        probabilities = self.model.predict_proba(X_test)
        
        print("Recent predictions:")
        for i, (_, row) in enumerate(recent_data.iterrows()):
            pred = predictions[i]
            prob = probabilities[i].max()
            symbol = row['symbol']
            price = row['Close']
            
            signal = "🟢 BUY" if pred == 1 else "🔴 SELL"
            print(f"  {symbol}: {signal} (Confidence: {prob:.1%}) - Price: ${price:.2f}")
    
    def run_full_training(self):
        """Run the complete training pipeline"""
        print("🚀 STARTING FULL AI TRAINING PIPELINE")
        print("=" * 60)
        
        # Step 1: Collect data
        data = self.collect_historical_data()
        if data is None:
            print("❌ Failed to collect data")
            return False
        
        # Step 2: Create features
        features_data = self.create_features(data)
        if features_data is None:
            print("❌ Failed to create features")
            return False
        
        # Step 3: Train model
        model = self.train_model(features_data)
        if model is None:
            print("❌ Failed to train model")
            return False
        
        # Step 4: Test predictions
        self.test_predictions(features_data)
        
        print("\n🎊 AI TRAINING COMPLETE!")
        print("✅ Model ready for live trading")
        return True

if __name__ == "__main__":
    trainer = RealAITrainer()
    success = trainer.run_full_training()
    
    if success:
        print("\n🚀 NEXT STEPS:")
        print("1. AI model is now trained and ready")
        print("2. Update trading engine to use trained model")
        print("3. Test with small amounts first")
        print("4. Monitor performance and retrain as needed")
    else:
        print("\n❌ Training failed - check errors above")
