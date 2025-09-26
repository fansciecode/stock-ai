#!/usr/bin/env python3
"""
Advanced ML Models for Trading - LSTM, Transformer, and Ensemble Models
"""

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.ensemble import VotingClassifier
import joblib
import logging
from pathlib import Path
from typing import Tuple, Dict, List
import warnings
warnings.filterwarnings('ignore')

# Check for GPU availability
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

class TimeSeriesDataset(Dataset):
    """Custom dataset for time series data"""
    
    def __init__(self, sequences, labels, sequence_length=60):
        self.sequences = sequences
        self.labels = labels
        self.sequence_length = sequence_length
    
    def __len__(self):
        return len(self.sequences) - self.sequence_length
    
    def __getitem__(self, idx):
        sequence = self.sequences[idx:idx + self.sequence_length]
        label = self.labels[idx + self.sequence_length]
        return torch.FloatTensor(sequence), torch.FloatTensor([label])

class LSTMTradingModel(nn.Module):
    """LSTM model for trading signal prediction"""
    
    def __init__(self, input_size, hidden_size=128, num_layers=2, dropout=0.2, output_size=1):
        super(LSTMTradingModel, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM layers
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            dropout=dropout,
            batch_first=True
        )
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(
            embed_dim=hidden_size,
            num_heads=8,
            dropout=dropout,
            batch_first=True
        )
        
        # Classification layers
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 2, hidden_size // 4),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_size // 4, output_size),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        # LSTM forward pass
        lstm_out, (hidden, cell) = self.lstm(x)
        
        # Attention mechanism
        attended_out, _ = self.attention(lstm_out, lstm_out, lstm_out)
        
        # Use the last timestep output
        last_output = attended_out[:, -1, :]
        
        # Classification
        output = self.classifier(last_output)
        
        return output

class TransformerTradingModel(nn.Module):
    """Transformer model for trading signal prediction"""
    
    def __init__(self, input_size, d_model=128, nhead=8, num_layers=6, dropout=0.1, output_size=1):
        super(TransformerTradingModel, self).__init__()
        
        self.d_model = d_model
        
        # Input projection
        self.input_projection = nn.Linear(input_size, d_model)
        
        # Positional encoding
        self.pos_encoding = PositionalEncoding(d_model, dropout)
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=d_model * 4,
            dropout=dropout,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, output_size),
            nn.Sigmoid()
        )
        
    def forward(self, x):
        # Input projection
        x = self.input_projection(x) * np.sqrt(self.d_model)
        
        # Positional encoding
        x = self.pos_encoding(x)
        
        # Transformer encoding
        transformer_out = self.transformer(x)
        
        # Global average pooling
        pooled = transformer_out.mean(dim=1)
        
        # Classification
        output = self.classifier(pooled)
        
        return output

class PositionalEncoding(nn.Module):
    """Positional encoding for transformer"""
    
    def __init__(self, d_model, dropout=0.1, max_len=5000):
        super(PositionalEncoding, self).__init__()
        self.dropout = nn.Dropout(p=dropout)
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0).transpose(0, 1)
        
        self.register_buffer('pe', pe)
    
    def forward(self, x):
        x = x + self.pe[:x.size(1), :].transpose(0, 1)
        return self.dropout(x)

class AdvancedTradingModelTrainer:
    """Advanced model trainer with LSTM, Transformer, and Ensemble methods"""
    
    def __init__(self, model_type='lstm', sequence_length=60):
        self.model_type = model_type
        self.sequence_length = sequence_length
        self.scaler = StandardScaler()
        self.model = None
        self.feature_names = None
        self.training_history = []
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
    
    def prepare_sequences(self, features_df: pd.DataFrame, labels_df: pd.DataFrame):
        """Prepare sequential data for time series models"""
        
        self.logger.info("Preparing sequential data...")
        
        # Merge features with labels
        merged_data = []
        
        for instrument in features_df['instrument'].unique():
            inst_features = features_df[features_df['instrument'] == instrument].sort_values('ts')
            inst_labels = labels_df[labels_df['instrument'] == instrument].sort_values('ts')
            
            # Create binary labels for each timestamp
            inst_features['has_signal'] = 0
            for _, label_row in inst_labels.iterrows():
                mask = inst_features['ts'] == label_row['ts']
                if mask.any():
                    inst_features.loc[mask, 'has_signal'] = 1
            
            merged_data.append(inst_features)
        
        combined_data = pd.concat(merged_data, ignore_index=True)
        
        # Get feature columns
        feature_cols = [col for col in combined_data.columns 
                       if col not in ['ts', 'instrument', 'open', 'high', 'low', 'close', 'volume', 'has_signal']]
        
        self.feature_names = feature_cols
        
        # Prepare sequences by instrument
        all_sequences = []
        all_labels = []
        
        for instrument in combined_data['instrument'].unique():
            inst_data = combined_data[combined_data['instrument'] == instrument].sort_values('ts')
            
            if len(inst_data) < self.sequence_length + 10:  # Need minimum data
                continue
            
            # Scale features
            features = inst_data[feature_cols].fillna(0)
            scaled_features = self.scaler.fit_transform(features)
            
            labels = inst_data['has_signal'].values
            
            # Create sequences
            for i in range(len(scaled_features) - self.sequence_length):
                seq = scaled_features[i:i + self.sequence_length]
                label = labels[i + self.sequence_length]
                
                all_sequences.append(seq)
                all_labels.append(label)
        
        X = np.array(all_sequences)
        y = np.array(all_labels)
        
        self.logger.info(f"Created {len(X)} sequences of length {self.sequence_length}")
        self.logger.info(f"Positive samples: {y.sum()}, Negative samples: {len(y) - y.sum()}")
        
        return X, y
    
    def create_model(self, input_size: int):
        """Create the specified model type"""
        
        if self.model_type == 'lstm':
            model = LSTMTradingModel(
                input_size=input_size,
                hidden_size=128,
                num_layers=2,
                dropout=0.2
            )
        elif self.model_type == 'transformer':
            model = TransformerTradingModel(
                input_size=input_size,
                d_model=128,
                nhead=8,
                num_layers=4,
                dropout=0.1
            )
        else:
            raise ValueError(f"Unknown model type: {self.model_type}")
        
        return model.to(device)
    
    def train_model(self, X: np.ndarray, y: np.ndarray, epochs=100, batch_size=32, learning_rate=0.001):
        """Train the deep learning model"""
        
        self.logger.info(f"Training {self.model_type.upper()} model...")
        
        # Create dataset
        dataset = TimeSeriesDataset(X, y, sequence_length=0)  # Already sequenced
        
        # Split data
        train_size = int(0.8 * len(dataset))
        val_size = len(dataset) - train_size
        
        train_dataset = torch.utils.data.Subset(dataset, range(train_size))
        val_dataset = torch.utils.data.Subset(dataset, range(train_size, len(dataset)))
        
        # Create data loaders
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
        
        # Create model
        input_size = X.shape[2]  # Number of features
        self.model = self.create_model(input_size)
        
        # Loss and optimizer
        criterion = nn.BCELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=learning_rate, weight_decay=1e-5)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
        
        # Training loop
        best_val_loss = float('inf')
        patience_counter = 0
        max_patience = 20
        
        for epoch in range(epochs):
            # Training phase
            self.model.train()
            train_loss = 0
            train_correct = 0
            train_total = 0
            
            for batch_x, batch_y in train_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                
                optimizer.zero_grad()
                outputs = self.model(batch_x)
                loss = criterion(outputs, batch_y)
                loss.backward()
                
                # Gradient clipping
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                
                optimizer.step()
                
                train_loss += loss.item()
                predicted = (outputs > 0.5).float()
                train_total += batch_y.size(0)
                train_correct += (predicted == batch_y).sum().item()
            
            # Validation phase
            self.model.eval()
            val_loss = 0
            val_correct = 0
            val_total = 0
            
            with torch.no_grad():
                for batch_x, batch_y in val_loader:
                    batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                    outputs = self.model(batch_x)
                    loss = criterion(outputs, batch_y)
                    
                    val_loss += loss.item()
                    predicted = (outputs > 0.5).float()
                    val_total += batch_y.size(0)
                    val_correct += (predicted == batch_y).sum().item()
            
            # Calculate metrics
            avg_train_loss = train_loss / len(train_loader)
            avg_val_loss = val_loss / len(val_loader)
            train_acc = train_correct / train_total
            val_acc = val_correct / val_total
            
            # Learning rate scheduling
            scheduler.step(avg_val_loss)
            
            # Early stopping
            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                patience_counter = 0
                # Save best model
                torch.save(self.model.state_dict(), f'models/best_{self.model_type}_model.pth')
            else:
                patience_counter += 1
            
            # Log progress
            if epoch % 10 == 0:
                self.logger.info(f'Epoch {epoch}: Train Loss: {avg_train_loss:.4f}, Val Loss: {avg_val_loss:.4f}, '
                               f'Train Acc: {train_acc:.4f}, Val Acc: {val_acc:.4f}')
            
            # Store history
            self.training_history.append({
                'epoch': epoch,
                'train_loss': avg_train_loss,
                'val_loss': avg_val_loss,
                'train_acc': train_acc,
                'val_acc': val_acc
            })
            
            # Early stopping
            if patience_counter >= max_patience:
                self.logger.info(f"Early stopping at epoch {epoch}")
                break
        
        # Load best model
        self.model.load_state_dict(torch.load(f'models/best_{self.model_type}_model.pth'))
        
        return self.model
    
    def predict(self, X: np.ndarray):
        """Make predictions with the trained model"""
        
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        self.model.eval()
        predictions = []
        
        with torch.no_grad():
            # Process in batches
            batch_size = 64
            for i in range(0, len(X), batch_size):
                batch = X[i:i + batch_size]
                batch_tensor = torch.FloatTensor(batch).to(device)
                
                outputs = self.model(batch_tensor)
                batch_predictions = outputs.cpu().numpy().flatten()
                predictions.extend(batch_predictions)
        
        return np.array(predictions)
    
    def save_model(self, model_path: str):
        """Save the complete model"""
        
        model_dir = Path(model_path).parent
        model_dir.mkdir(parents=True, exist_ok=True)
        
        # Save model state
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'model_type': self.model_type,
            'sequence_length': self.sequence_length,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'training_history': self.training_history
        }, model_path)
        
        self.logger.info(f"Advanced model saved to {model_path}")
    
    def load_model(self, model_path: str):
        """Load a saved model"""
        
        checkpoint = torch.load(model_path, map_location=device)
        
        self.model_type = checkpoint['model_type']
        self.sequence_length = checkpoint['sequence_length']
        self.scaler = checkpoint['scaler']
        self.feature_names = checkpoint['feature_names']
        self.training_history = checkpoint['training_history']
        
        # Create and load model
        input_size = len(self.feature_names)
        self.model = self.create_model(input_size)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        
        self.logger.info(f"Advanced model loaded from {model_path}")

class EnsembleTrader:
    """Ensemble trading model combining multiple approaches"""
    
    def __init__(self):
        self.models = {}
        self.weights = {}
        self.logger = logging.getLogger(__name__)
    
    def add_model(self, name: str, model, weight: float = 1.0):
        """Add a model to the ensemble"""
        self.models[name] = model
        self.weights[name] = weight
        self.logger.info(f"Added {name} to ensemble with weight {weight}")
    
    def predict(self, X: np.ndarray):
        """Make ensemble predictions"""
        
        if not self.models:
            raise ValueError("No models in ensemble")
        
        predictions = []
        total_weight = sum(self.weights.values())
        
        for name, model in self.models.items():
            try:
                if hasattr(model, 'predict'):
                    pred = model.predict(X)
                else:
                    pred = model(torch.FloatTensor(X).to(device)).detach().cpu().numpy()
                
                weight = self.weights[name] / total_weight
                predictions.append(pred * weight)
                
            except Exception as e:
                self.logger.warning(f"Model {name} prediction failed: {e}")
        
        if not predictions:
            raise ValueError("All models failed to predict")
        
        # Weighted average
        ensemble_pred = np.sum(predictions, axis=0)
        return ensemble_pred

def main():
    """Test the advanced models"""
    
    # Load data
    features_df = pd.read_parquet("data/features.parquet")
    labels_df = pd.read_parquet("data/labels.parquet")
    
    print("Testing LSTM model...")
    lstm_trainer = AdvancedTradingModelTrainer(model_type='lstm', sequence_length=30)
    X, y = lstm_trainer.prepare_sequences(features_df, labels_df)
    
    if len(X) > 100:  # Ensure we have enough data
        lstm_model = lstm_trainer.train_model(X, y, epochs=50, batch_size=16)
        lstm_trainer.save_model("models/lstm_trading_model.pth")
        print("✅ LSTM model trained and saved")
    else:
        print("❌ Not enough sequential data for LSTM training")
    
    print("Testing Transformer model...")
    transformer_trainer = AdvancedTradingModelTrainer(model_type='transformer', sequence_length=30)
    X, y = transformer_trainer.prepare_sequences(features_df, labels_df)
    
    if len(X) > 100:
        transformer_model = transformer_trainer.train_model(X, y, epochs=50, batch_size=16)
        transformer_trainer.save_model("models/transformer_trading_model.pth")
        print("✅ Transformer model trained and saved")
    else:
        print("❌ Not enough sequential data for Transformer training")

if __name__ == "__main__":
    main()
