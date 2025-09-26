import argparse
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split, TimeSeriesSplit, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score, precision_recall_curve
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except (ImportError, OSError) as e:
    print(f"LightGBM not available ({e}), falling back to sklearn RandomForest")
    LIGHTGBM_AVAILABLE = False
    from sklearn.ensemble import RandomForestClassifier

class TradingModelTrainer:
    """Advanced ML model trainer for trading signals"""
    
    def __init__(self, model_type="lightgbm"):
        self.model_type = model_type
        self.model = None
        self.scaler = StandardScaler()
        self.feature_importance = None
        self.feature_names = None
        
    def prepare_dataset(self, features_path, labels_path, target_strategy=None):
        """Prepare training dataset from features and labels"""
        print("Loading data...")
        features_df = pd.read_parquet(features_path)
        labels_df = pd.read_parquet(labels_path)
        
        print(f"Loaded {len(features_df)} feature rows and {len(labels_df)} labels")
        
        # Filter by strategy if specified
        if target_strategy:
            labels_df = labels_df[labels_df["strategy"] == target_strategy]
            print(f"Filtered to {len(labels_df)} labels for strategy: {target_strategy}")
        
        # Create training dataset
        X, y, sample_weights = self._create_training_data(features_df, labels_df)
        
        print(f"Training dataset: {X.shape[0]} samples, {X.shape[1]} features")
        print(f"Positive samples: {y.sum()}, Negative samples: {len(y) - y.sum()}")
        
        return X, y, sample_weights
    
    def _create_training_data(self, features_df, labels_df):
        """Create training data with positive and negative samples"""
        
        # Positive samples: timestamps with signals
        positive_samples = labels_df.merge(
            features_df, 
            on=["instrument", "ts"], 
            how="inner"
        )
        
        # Negative samples: random timestamps without signals
        negative_samples = self._generate_negative_samples(features_df, labels_df)
        
        # Combine samples
        all_samples = pd.concat([positive_samples, negative_samples], ignore_index=True)
        
        # Prepare features and targets
        feature_cols = self._get_feature_columns(features_df)
        X = all_samples[feature_cols].fillna(0)
        
        # Create binary target (1 for buy signals, 0 for no signal)
        y = pd.Series(0, index=all_samples.index)
        y.loc[positive_samples.index] = (positive_samples["side"] == 1).astype(int)
        
        # Create sample weights (higher weight for positive samples)
        sample_weights = pd.Series(1.0, index=all_samples.index)
        sample_weights.loc[positive_samples.index] = positive_samples.get("confidence", 1.0) * 2
        
        self.feature_names = feature_cols
        
        return X, y, sample_weights
    
    def _generate_negative_samples(self, features_df, labels_df, ratio=3):
        """Generate negative samples (no signal timestamps)"""
        # Get all timestamps
        all_timestamps = set(zip(features_df["instrument"], features_df["ts"]))
        signal_timestamps = set(zip(labels_df["instrument"], labels_df["ts"]))
        
        # Get timestamps without signals
        no_signal_timestamps = list(all_timestamps - signal_timestamps)
        
        # Sample negative examples
        n_negative = min(len(no_signal_timestamps), len(labels_df) * ratio)
        sampled_negative = np.random.choice(len(no_signal_timestamps), n_negative, replace=False)
        
        negative_keys = [no_signal_timestamps[i] for i in sampled_negative]
        
        # Create negative samples dataframe
        negative_data = []
        for instrument, ts in negative_keys:
            row = features_df[(features_df["instrument"] == instrument) & 
                            (features_df["ts"] == ts)].iloc[0].to_dict()
            row["side"] = 0  # No signal
            negative_data.append(row)
        
        return pd.DataFrame(negative_data)
    
    def _get_feature_columns(self, features_df):
        """Get feature columns (exclude metadata columns)"""
        exclude_cols = {"ts", "instrument", "open", "high", "low", "close", "volume"}
        return [col for col in features_df.columns if col not in exclude_cols]
    
    def train_lightgbm(self, X_train, y_train, sample_weights_train, X_val, y_val):
        """Train LightGBM model"""
        print("Training LightGBM model...")
        
        # Prepare datasets
        train_data = lgb.Dataset(
            X_train, 
            label=y_train, 
            weight=sample_weights_train,
            feature_name=self.feature_names
        )
        val_data = lgb.Dataset(
            X_val, 
            label=y_val, 
            reference=train_data,
            feature_name=self.feature_names
        )
        
        # Model parameters
        params = {
            'objective': 'binary',
            'metric': ['binary_logloss', 'auc'],
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.9,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'random_state': 42
        }
        
        # Train model
        self.model = lgb.train(
            params,
            train_data,
            valid_sets=[train_data, val_data],
            valid_names=['train', 'eval'],
            num_boost_round=1000,
            callbacks=[lgb.early_stopping(100), lgb.log_evaluation(100)]
        )
        
        # Store feature importance
        self.feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importance(importance_type='gain')
        }).sort_values('importance', ascending=False)
        
        return self.model
    
    def train_random_forest(self, X_train, y_train, sample_weights_train):
        """Train Random Forest model as fallback"""
        print("Training Random Forest model...")
        
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        
        self.model.fit(X_train, y_train, sample_weight=sample_weights_train)
        
        # Store feature importance
        self.feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return self.model
    
    def train(self, X, y, sample_weights, test_size=0.2, random_state=42):
        """Train the model with train/validation split"""
        
        # Split data (time-aware split)
        split_idx = int(len(X) * (1 - test_size))
        X_train, X_val = X.iloc[:split_idx], X.iloc[split_idx:]
        y_train, y_val = y.iloc[:split_idx], y.iloc[split_idx:]
        sample_weights_train = sample_weights.iloc[:split_idx]
        
        # Scale features
        X_train_scaled = pd.DataFrame(
            self.scaler.fit_transform(X_train),
            columns=X_train.columns,
            index=X_train.index
        )
        X_val_scaled = pd.DataFrame(
            self.scaler.transform(X_val),
            columns=X_val.columns,
            index=X_val.index
        )
        
        # Train model
        if LIGHTGBM_AVAILABLE and self.model_type == "lightgbm":
            model = self.train_lightgbm(
                X_train_scaled, y_train, sample_weights_train, 
                X_val_scaled, y_val
            )
        else:
            model = self.train_random_forest(X_train_scaled, y_train, sample_weights_train)
        
        # Evaluate model
        self.evaluate_model(X_val_scaled, y_val)
        
        return model
    
    def evaluate_model(self, X_val, y_val):
        """Evaluate model performance"""
        print("\n=== MODEL EVALUATION ===")
        
        # Get predictions
        if hasattr(self.model, 'predict'):
            y_pred = self.model.predict(X_val)
            if hasattr(self.model, 'predict_proba'):
                y_prob = self.model.predict_proba(X_val)[:, 1]
            else:
                y_prob = y_pred
        else:  # LightGBM
            y_prob = self.model.predict(X_val)
            y_pred = (y_prob > 0.5).astype(int)
        
        # Calculate metrics
        accuracy = accuracy_score(y_val, y_pred)
        auc = roc_auc_score(y_val, y_prob) if len(np.unique(y_val)) > 1 else 0.5
        
        print(f"Accuracy: {accuracy:.4f}")
        print(f"AUC: {auc:.4f}")
        
        # Classification report
        if len(np.unique(y_val)) > 1:
            print("\nClassification Report:")
            print(classification_report(y_val, y_pred))
        
        # Feature importance
        if self.feature_importance is not None:
            print("\nTop 10 Most Important Features:")
            print(self.feature_importance.head(10).to_string(index=False))
        
        return {"accuracy": accuracy, "auc": auc}
    
    def save_model(self, model_path):
        """Save trained model and scaler"""
        model_dir = Path(model_path).parent
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'feature_importance': self.feature_importance,
            'model_type': self.model_type
        }, model_path)
        
        print(f"Model saved to {model_path}")
    
    def cross_validate(self, X, y, cv=5):
        """Perform cross-validation"""
        print("Performing cross-validation...")
        
        # Scale features
        X_scaled = pd.DataFrame(
            self.scaler.fit_transform(X),
            columns=X.columns
        )
        
        if hasattr(self.model, 'fit'):  # Sklearn model
            scores = cross_val_score(self.model, X_scaled, y, cv=cv, scoring='roc_auc')
            print(f"Cross-validation AUC: {scores.mean():.4f} (+/- {scores.std() * 2:.4f})")
        else:
            print("Cross-validation not available for LightGBM")

def main():
    parser = argparse.ArgumentParser(description="Train trading ML model")
    parser.add_argument("--features", default="data/features.parquet",
                       help="Path to features file")
    parser.add_argument("--labels", default="data/labels.parquet",
                       help="Path to labels file")
    parser.add_argument("--out", default="models/trading_model.joblib",
                       help="Output path for trained model")
    parser.add_argument("--model-type", default="lightgbm", 
                       choices=["lightgbm", "random_forest"],
                       help="Type of model to train")
    parser.add_argument("--strategy", default=None,
                       help="Train model for specific strategy only")
    
    args = parser.parse_args()
    
    # Initialize trainer
    trainer = TradingModelTrainer(model_type=args.model_type)
    
    # Prepare dataset
    X, y, sample_weights = trainer.prepare_dataset(
        args.features, 
        args.labels, 
        target_strategy=args.strategy
    )
    
    # Train model
    model = trainer.train(X, y, sample_weights)
    
    # Save model
    trainer.save_model(args.out)
    
    print(f"\nTraining completed successfully!")
    print(f"Model saved to: {args.out}")

if __name__ == "__main__":
    main()
