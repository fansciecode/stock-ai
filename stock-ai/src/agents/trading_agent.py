import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Optional, Tuple
from pathlib import Path

class TradingAgent:
    """AI Trading Agent that makes trading decisions"""
    
    def __init__(self, agent_id: str, model_path: str, config: Dict = None):
        self.agent_id = agent_id
        self.model_path = model_path
        self.config = config or {}
        self.model_data = None
        self.active_positions = {}
        self.trade_history = []
        self.performance_metrics = {}
        
        # Risk management parameters
        self.max_positions = self.config.get("max_positions", 5)
        self.max_risk_per_trade = self.config.get("max_risk_per_trade", 0.02)
        self.max_total_risk = self.config.get("max_total_risk", 0.1)
        self.confidence_threshold = self.config.get("confidence_threshold", 0.6)
        
        # Setup logging first
        self._setup_logging()
        
        # Load model
        self._load_model()
    
    def _load_model(self):
        """Load the trained ML model"""
        try:
            self.model_data = joblib.load(self.model_path)
            self.model = self.model_data['model']
            self.scaler = self.model_data['scaler']
            self.feature_names = self.model_data['feature_names']
            self.logger.info(f"Model loaded successfully from {self.model_path}")
        except Exception as e:
            self.logger.error(f"Failed to load model: {e}")
            raise
    
    def _setup_logging(self):
        """Setup logging for the agent"""
        log_dir = Path("logs/agents")
        log_dir.mkdir(parents=True, exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / f"{self.agent_id}.log"),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(f"TradingAgent_{self.agent_id}")
    
    def analyze_market(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Analyze market conditions and generate trading signals"""
        
        self.logger.info(f"Analyzing market with {len(features_df)} data points")
        
        # Prepare features for prediction
        X = self._prepare_features(features_df)
        
        if X.empty:
            self.logger.warning("No valid features for prediction")
            return pd.DataFrame()
        
        # Get model predictions
        predictions = self._predict(X)
        
        # Convert predictions to trading signals
        signals = self._generate_signals(features_df, predictions)
        
        # Apply risk filters
        filtered_signals = self._apply_risk_filters(signals)
        
        self.logger.info(f"Generated {len(filtered_signals)} trading signals")
        
        return filtered_signals
    
    def _prepare_features(self, features_df: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for model prediction"""
        
        # Get latest data point for each instrument
        latest_data = features_df.groupby("instrument").tail(1).reset_index(drop=True)
        
        # Select feature columns
        feature_cols = [col for col in self.feature_names if col in latest_data.columns]
        missing_features = [col for col in self.feature_names if col not in latest_data.columns]
        
        if missing_features:
            self.logger.warning(f"Missing features: {missing_features}")
        
        X = latest_data[feature_cols].fillna(0)
        
        # Scale features
        if hasattr(self.scaler, 'transform'):
            X_scaled = pd.DataFrame(
                self.scaler.transform(X),
                columns=X.columns,
                index=X.index
            )
        else:
            X_scaled = X
        
        # Add metadata for later use
        X_scaled['instrument'] = latest_data['instrument']
        X_scaled['ts'] = latest_data['ts']
        X_scaled['close'] = latest_data['close']
        
        return X_scaled
    
    def _predict(self, X: pd.DataFrame) -> np.ndarray:
        """Get model predictions"""
        
        # Prepare features (exclude metadata columns)
        feature_cols = [col for col in X.columns if col in self.feature_names]
        X_features = X[feature_cols]
        
        try:
            if hasattr(self.model, 'predict_proba'):
                # Sklearn models
                probabilities = self.model.predict_proba(X_features)
                return probabilities[:, 1]  # Probability of positive class
            else:
                # LightGBM models
                return self.model.predict(X_features)
        except Exception as e:
            self.logger.error(f"Prediction failed: {e}")
            return np.zeros(len(X))
    
    def _generate_signals(self, features_df: pd.DataFrame, predictions: np.ndarray) -> pd.DataFrame:
        """Convert model predictions to trading signals"""
        
        signals = []
        latest_data = features_df.groupby("instrument").tail(1).reset_index(drop=True)
        
        for i, (_, row) in enumerate(latest_data.iterrows()):
            if i >= len(predictions):
                break
            
            confidence = predictions[i]
            
            if confidence > self.confidence_threshold:
                # Calculate position sizing and risk management
                entry_price = row["close"]
                atr = self._calculate_atr(features_df, row["instrument"])
                
                # Dynamic stop loss based on ATR
                if atr:
                    stop_loss = entry_price - (atr * 2)  # 2 ATR stop loss
                else:
                    stop_loss = entry_price * 0.98  # 2% stop loss fallback
                
                # Risk-reward based take profit
                risk_amount = abs(entry_price - stop_loss)
                take_profit = entry_price + (risk_amount * 2)  # 2:1 R/R
                
                # Position size based on risk
                position_size = self._calculate_position_size(entry_price, stop_loss)
                
                signal = {
                    "timestamp": datetime.now(),
                    "instrument": row["instrument"],
                    "signal_type": "BUY",
                    "side": 1,
                    "entry_price": float(entry_price),
                    "stop_loss": float(stop_loss),
                    "take_profit": float(take_profit),
                    "confidence": float(confidence),
                    "position_size": float(position_size),
                    "risk_amount": float(risk_amount),
                    "expected_return": float(take_profit - entry_price),
                    "risk_reward_ratio": float((take_profit - entry_price) / risk_amount),
                    "agent_id": self.agent_id,
                    "model_features": {
                        "atr": float(atr) if atr else None,
                        "current_price": float(entry_price)
                    }
                }
                signals.append(signal)
        
        return pd.DataFrame(signals)
    
    def _calculate_atr(self, features_df: pd.DataFrame, instrument: str, period: int = 14) -> Optional[float]:
        """Calculate Average True Range for an instrument"""
        
        inst_data = features_df[features_df["instrument"] == instrument].tail(period)
        
        if len(inst_data) < period:
            return None
        
        # Calculate True Range
        high_low = inst_data["high"] - inst_data["low"]
        high_close = np.abs(inst_data["high"] - inst_data["close"].shift(1))
        low_close = np.abs(inst_data["low"] - inst_data["close"].shift(1))
        
        true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        return true_range.mean()
    
    def _calculate_position_size(self, entry_price: float, stop_loss: float) -> float:
        """Calculate position size based on risk management"""
        
        # Risk per trade in dollars
        account_balance = 100000  # This should come from portfolio manager
        max_risk_dollars = account_balance * self.max_risk_per_trade
        
        # Risk per share
        risk_per_share = abs(entry_price - stop_loss)
        
        # Position size
        if risk_per_share > 0:
            position_size = max_risk_dollars / risk_per_share
            # Ensure we don't exceed maximum position limits
            max_position_value = account_balance * 0.2  # Max 20% in one position
            max_shares = max_position_value / entry_price
            position_size = min(position_size, max_shares)
        else:
            position_size = 0
        
        return max(0, position_size)
    
    def _apply_risk_filters(self, signals: pd.DataFrame) -> pd.DataFrame:
        """Apply risk management filters to signals"""
        
        if signals.empty:
            return signals
        
        filtered_signals = signals.copy()
        
        # Filter by confidence threshold
        filtered_signals = filtered_signals[
            filtered_signals["confidence"] >= self.confidence_threshold
        ]
        
        # Limit number of positions
        if len(self.active_positions) >= self.max_positions:
            self.logger.info(f"Maximum positions ({self.max_positions}) reached, filtering signals")
            return pd.DataFrame()
        
        # Sort by confidence and take top signals
        remaining_slots = self.max_positions - len(self.active_positions)
        filtered_signals = filtered_signals.nlargest(remaining_slots, "confidence")
        
        # Check total risk exposure
        total_risk = self._calculate_total_risk(filtered_signals)
        current_risk = self._get_current_risk_exposure()
        
        if current_risk + total_risk > self.max_total_risk:
            self.logger.warning(f"Total risk exposure would exceed limit: {current_risk + total_risk:.2%}")
            # Reduce position sizes proportionally
            risk_factor = (self.max_total_risk - current_risk) / total_risk
            filtered_signals["position_size"] *= max(0, risk_factor)
        
        return filtered_signals
    
    def _calculate_total_risk(self, signals: pd.DataFrame) -> float:
        """Calculate total risk from proposed signals"""
        if signals.empty:
            return 0.0
        
        total_risk_amount = signals["risk_amount"].sum()
        account_balance = 100000  # This should come from portfolio manager
        return total_risk_amount / account_balance
    
    def _get_current_risk_exposure(self) -> float:
        """Get current risk exposure from active positions"""
        if not self.active_positions:
            return 0.0
        
        total_risk = sum(pos.get("risk_amount", 0) for pos in self.active_positions.values())
        account_balance = 100000  # This should come from portfolio manager
        return total_risk / account_balance
    
    def execute_signal(self, signal: Dict) -> Dict:
        """Execute a trading signal (mock execution)"""
        
        execution_result = {
            "signal_id": f"{signal['instrument']}_{datetime.now().timestamp()}",
            "agent_id": self.agent_id,
            "execution_time": datetime.now(),
            "status": "EXECUTED",
            "execution_price": signal["entry_price"] * (1 + np.random.normal(0, 0.001)),  # Add some slippage
            "executed_size": signal["position_size"],
            "commission": signal["position_size"] * signal["entry_price"] * 0.001,  # 0.1% commission
            "original_signal": signal
        }
        
        # Add to active positions
        self.active_positions[execution_result["signal_id"]] = {
            "signal": signal,
            "execution": execution_result,
            "status": "ACTIVE"
        }
        
        # Log execution
        self.logger.info(f"Executed signal for {signal['instrument']}: "
                        f"Size={signal['position_size']:.2f}, "
                        f"Price={execution_result['execution_price']:.4f}")
        
        return execution_result
    
    def update_positions(self, market_data: pd.DataFrame):
        """Update active positions with current market data"""
        
        for position_id, position in list(self.active_positions.items()):
            instrument = position["signal"]["instrument"]
            
            # Get current price
            current_data = market_data[market_data["instrument"] == instrument]
            if current_data.empty:
                continue
            
            current_price = current_data["close"].iloc[-1]
            signal = position["signal"]
            
            # Check exit conditions
            should_exit, exit_reason = self._check_exit_conditions(signal, current_price)
            
            if should_exit:
                self._close_position(position_id, current_price, exit_reason)
    
    def _check_exit_conditions(self, signal: Dict, current_price: float) -> Tuple[bool, str]:
        """Check if position should be closed"""
        
        stop_loss = signal["stop_loss"]
        take_profit = signal["take_profit"]
        
        if signal["side"] == 1:  # Long position
            if current_price <= stop_loss:
                return True, "STOP_LOSS"
            elif current_price >= take_profit:
                return True, "TAKE_PROFIT"
        else:  # Short position
            if current_price >= stop_loss:
                return True, "STOP_LOSS"
            elif current_price <= take_profit:
                return True, "TAKE_PROFIT"
        
        return False, ""
    
    def _close_position(self, position_id: str, exit_price: float, exit_reason: str):
        """Close an active position"""
        
        position = self.active_positions[position_id]
        signal = position["signal"]
        execution = position["execution"]
        
        # Calculate PnL
        entry_price = execution["execution_price"]
        position_size = execution["executed_size"]
        
        if signal["side"] == 1:  # Long
            pnl = (exit_price - entry_price) * position_size
        else:  # Short
            pnl = (entry_price - exit_price) * position_size
        
        # Account for commission
        exit_commission = position_size * exit_price * 0.001
        net_pnl = pnl - execution["commission"] - exit_commission
        
        # Create trade record
        trade_record = {
            "position_id": position_id,
            "agent_id": self.agent_id,
            "instrument": signal["instrument"],
            "entry_time": execution["execution_time"],
            "exit_time": datetime.now(),
            "entry_price": entry_price,
            "exit_price": exit_price,
            "position_size": position_size,
            "side": signal["side"],
            "exit_reason": exit_reason,
            "gross_pnl": pnl,
            "net_pnl": net_pnl,
            "return_pct": (net_pnl / (entry_price * position_size)) * 100,
            "confidence": signal["confidence"]
        }
        
        # Add to trade history
        self.trade_history.append(trade_record)
        
        # Remove from active positions
        del self.active_positions[position_id]
        
        # Log trade closure
        self.logger.info(f"Closed position {position_id}: {exit_reason}, "
                        f"PnL=${net_pnl:.2f}, Return={trade_record['return_pct']:.2f}%")
    
    def get_performance_summary(self) -> Dict:
        """Get agent performance summary"""
        
        if not self.trade_history:
            return {"message": "No completed trades"}
        
        df = pd.DataFrame(self.trade_history)
        
        total_trades = len(df)
        winning_trades = len(df[df["net_pnl"] > 0])
        win_rate = winning_trades / total_trades
        
        total_pnl = df["net_pnl"].sum()
        avg_pnl = df["net_pnl"].mean()
        avg_return = df["return_pct"].mean()
        
        return {
            "agent_id": self.agent_id,
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "win_rate": win_rate,
            "total_pnl": total_pnl,
            "avg_pnl_per_trade": avg_pnl,
            "avg_return_pct": avg_return,
            "active_positions": len(self.active_positions),
            "last_updated": datetime.now().isoformat()
        }
    
    def save_state(self, file_path: str):
        """Save agent state to file"""
        
        state = {
            "agent_id": self.agent_id,
            "config": self.config,
            "active_positions": self.active_positions,
            "trade_history": self.trade_history,
            "performance_metrics": self.get_performance_summary()
        }
        
        with open(file_path, 'w') as f:
            json.dump(state, f, indent=2, default=str)
        
        self.logger.info(f"Agent state saved to {file_path}")
    
    def load_state(self, file_path: str):
        """Load agent state from file"""
        
        try:
            with open(file_path, 'r') as f:
                state = json.load(f)
            
            self.active_positions = state.get("active_positions", {})
            self.trade_history = state.get("trade_history", [])
            
            self.logger.info(f"Agent state loaded from {file_path}")
        except FileNotFoundError:
            self.logger.info(f"No previous state found at {file_path}")
