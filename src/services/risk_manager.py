#!/usr/bin/env python3
"""
🛡️ RISK MANAGER - Actual Implementation of Risk Settings
Manages user risk preferences and applies them to trading decisions
"""

import sqlite3
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import logging

class RiskManager:
    """Manages user risk settings and applies them to trading"""
    
    def __init__(self):
        self.db_path = "data/risk_settings.db"
        self.setup_database()
        self.logger = self.setup_logging()
        
    def setup_logging(self):
        """Setup logging"""
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger('RiskManager')
        
    def setup_database(self):
        """Create risk settings database"""
        os.makedirs("data", exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS user_risk_settings (
                    user_id TEXT PRIMARY KEY,
                    max_position_size REAL DEFAULT 0.20,
                    max_daily_loss REAL DEFAULT 0.05,
                    stop_loss_pct REAL DEFAULT 0.02,
                    take_profit_pct REAL DEFAULT 0.04,
                    min_signal_strength REAL DEFAULT 0.70,
                    trading_mode TEXT DEFAULT 'moderate',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS daily_trading_stats (
                    user_id TEXT,
                    date TEXT,
                    trades_count INTEGER DEFAULT 0,
                    total_pnl REAL DEFAULT 0.0,
                    portfolio_start REAL DEFAULT 0.0,
                    portfolio_current REAL DEFAULT 0.0,
                    is_trading_halted BOOLEAN DEFAULT 0,
                    PRIMARY KEY (user_id, date)
                )
            """)
            
    def save_risk_settings(self, user_email: str, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Save user risk settings"""
        try:
            # Get user ID from email
            user_id = self.get_user_id_from_email(user_email)
            if not user_id:
                return {'success': False, 'error': 'User not found'}
                
            with sqlite3.connect(self.db_path) as conn:
                now = datetime.now().isoformat()
                
                conn.execute("""
                    INSERT OR REPLACE INTO user_risk_settings 
                    (user_id, max_position_size, max_daily_loss, stop_loss_pct, 
                     take_profit_pct, min_signal_strength, trading_mode, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 
                            COALESCE((SELECT created_at FROM user_risk_settings WHERE user_id = ?), ?), ?)
                """, (
                    user_id,
                    float(settings.get('max_position_size', 20)) / 100,  # Convert % to decimal
                    float(settings.get('max_daily_loss', 5)) / 100,
                    float(settings.get('stop_loss', 2)) / 100,
                    float(settings.get('take_profit', 4)) / 100,
                    float(settings.get('signal_strength', 70)) / 100,
                    settings.get('trading_mode', 'moderate'),
                    user_id, now, now
                ))
                
            self.logger.info(f"Risk settings saved for user {user_email}")
            return {'success': True, 'message': 'Risk settings saved successfully'}
            
        except Exception as e:
            self.logger.error(f"Error saving risk settings: {e}")
            return {'success': False, 'error': str(e)}
            
    def get_risk_settings(self, user_email: str) -> Dict[str, Any]:
        """Get user risk settings"""
        try:
            user_id = self.get_user_id_from_email(user_email)
            if not user_id:
                return self.get_default_settings()
                
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT max_position_size, max_daily_loss, stop_loss_pct,
                           take_profit_pct, min_signal_strength, trading_mode
                    FROM user_risk_settings WHERE user_id = ?
                """, (user_id,))
                
                result = cursor.fetchone()
                if result:
                    return {
                        'max_position_size': result[0],
                        'max_daily_loss': result[1],
                        'stop_loss_pct': result[2],
                        'take_profit_pct': result[3],
                        'min_signal_strength': result[4],
                        'trading_mode': result[5]
                    }
                else:
                    return self.get_default_settings()
                    
        except Exception as e:
            self.logger.error(f"Error getting risk settings: {e}")
            return self.get_default_settings()
            
    def get_default_settings(self) -> Dict[str, Any]:
        """Get default risk settings"""
        return {
            'max_position_size': 0.20,  # 20%
            'max_daily_loss': 0.05,     # 5%
            'stop_loss_pct': 0.02,      # 2%
            'take_profit_pct': 0.04,    # 4%
            'min_signal_strength': 0.70, # 70%
            'trading_mode': 'moderate'
        }
        
    def get_user_id_from_email(self, email: str) -> Optional[str]:
        """Get user ID from email"""
        try:
            with sqlite3.connect("data/users.db") as conn:
                cursor = conn.execute("SELECT user_id FROM users WHERE email = ?", (email,))
                result = cursor.fetchone()
                return result[0] if result else None
        except Exception:
            return None
            
    def check_daily_loss_limit(self, user_email: str, current_pnl: float) -> Dict[str, Any]:
        """Check if daily loss limit is exceeded"""
        try:
            settings = self.get_risk_settings(user_email)
            max_daily_loss = settings['max_daily_loss']
            
            # Get today's stats
            today = datetime.now().strftime('%Y-%m-%d')
            stats = self.get_daily_stats(user_email, today)
            
            portfolio_start = stats.get('portfolio_start', 10000)  # Default $10k
            max_loss_dollars = portfolio_start * max_daily_loss
            
            if current_pnl <= -max_loss_dollars:
                return {
                    'halt_trading': True,
                    'reason': f'Daily loss limit exceeded: ${abs(current_pnl):.2f} > ${max_loss_dollars:.2f}',
                    'max_loss_dollars': max_loss_dollars,
                    'current_loss': abs(current_pnl)
                }
            else:
                return {
                    'halt_trading': False,
                    'remaining_loss_allowance': max_loss_dollars + current_pnl,
                    'max_loss_dollars': max_loss_dollars
                }
                
        except Exception as e:
            self.logger.error(f"Error checking daily loss limit: {e}")
            return {'halt_trading': False, 'error': str(e)}
            
    def calculate_position_size(self, user_email: str, current_price: float, 
                              portfolio_value: float = 10000) -> Dict[str, Any]:
        """Calculate position size based on user risk settings"""
        try:
            settings = self.get_risk_settings(user_email)
            max_position_pct = settings['max_position_size']
            
            max_position_value = portfolio_value * max_position_pct
            quantity = max_position_value / current_price
            
            return {
                'success': True,
                'quantity': quantity,
                'max_position_value': max_position_value,
                'position_percentage': max_position_pct * 100,
                'settings_applied': True
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating position size: {e}")
            return {'success': False, 'error': str(e)}
            
    def calculate_stop_loss_take_profit(self, user_email: str, entry_price: float, 
                                      signal_type: str) -> Dict[str, Any]:
        """Calculate stop loss and take profit based on user settings"""
        try:
            settings = self.get_risk_settings(user_email)
            stop_loss_pct = settings['stop_loss_pct']
            take_profit_pct = settings['take_profit_pct']
            
            if signal_type.upper() == 'BUY':
                stop_loss = entry_price * (1 - stop_loss_pct)
                take_profit = entry_price * (1 + take_profit_pct)
            elif signal_type.upper() == 'SELL':
                stop_loss = entry_price * (1 + stop_loss_pct)
                take_profit = entry_price * (1 - take_profit_pct)
            else:
                return {'success': False, 'error': 'Invalid signal type'}
                
            return {
                'success': True,
                'stop_loss': stop_loss,
                'take_profit': take_profit,
                'stop_loss_pct': stop_loss_pct * 100,
                'take_profit_pct': take_profit_pct * 100,
                'settings_applied': True
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating stop loss/take profit: {e}")
            return {'success': False, 'error': str(e)}
            
    def filter_signals_by_strength(self, user_email: str, signals: list) -> list:
        """Filter signals by minimum strength requirement"""
        try:
            settings = self.get_risk_settings(user_email)
            min_strength = settings['min_signal_strength']
            
            filtered_signals = [
                signal for signal in signals 
                if signal.get('strength', 0) / 100 >= min_strength
            ]
            
            self.logger.info(f"Filtered {len(signals)} signals to {len(filtered_signals)} "
                           f"using min strength {min_strength*100}%")
            
            return filtered_signals
            
        except Exception as e:
            self.logger.error(f"Error filtering signals: {e}")
            return signals
            
    def update_daily_stats(self, user_email: str, trade_pnl: float, 
                          portfolio_value: float) -> None:
        """Update daily trading statistics"""
        try:
            user_id = self.get_user_id_from_email(user_email)
            if not user_id:
                return
                
            today = datetime.now().strftime('%Y-%m-%d')
            
            with sqlite3.connect(self.db_path) as conn:
                # Get existing stats
                cursor = conn.execute("""
                    SELECT trades_count, total_pnl, portfolio_start 
                    FROM daily_trading_stats 
                    WHERE user_id = ? AND date = ?
                """, (user_id, today))
                
                result = cursor.fetchone()
                
                if result:
                    # Update existing
                    new_trades = result[0] + 1
                    new_pnl = result[1] + trade_pnl
                    portfolio_start = result[2]
                else:
                    # Create new
                    new_trades = 1
                    new_pnl = trade_pnl
                    portfolio_start = portfolio_value
                    
                conn.execute("""
                    INSERT OR REPLACE INTO daily_trading_stats
                    (user_id, date, trades_count, total_pnl, portfolio_start, 
                     portfolio_current, is_trading_halted)
                    VALUES (?, ?, ?, ?, ?, ?, 0)
                """, (user_id, today, new_trades, new_pnl, portfolio_start, portfolio_value))
                
        except Exception as e:
            self.logger.error(f"Error updating daily stats: {e}")
            
    def get_daily_stats(self, user_email: str, date: str = None) -> Dict[str, Any]:
        """Get daily trading statistics"""
        try:
            user_id = self.get_user_id_from_email(user_email)
            if not user_id:
                return {}
                
            if not date:
                date = datetime.now().strftime('%Y-%m-%d')
                
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.execute("""
                    SELECT trades_count, total_pnl, portfolio_start, 
                           portfolio_current, is_trading_halted
                    FROM daily_trading_stats 
                    WHERE user_id = ? AND date = ?
                """, (user_id, date))
                
                result = cursor.fetchone()
                
                if result:
                    return {
                        'trades_count': result[0],
                        'total_pnl': result[1],
                        'portfolio_start': result[2],
                        'portfolio_current': result[3],
                        'is_trading_halted': bool(result[4]),
                        'date': date
                    }
                else:
                    return {
                        'trades_count': 0,
                        'total_pnl': 0.0,
                        'portfolio_start': 10000.0,
                        'portfolio_current': 10000.0,
                        'is_trading_halted': False,
                        'date': date
                    }
                    
        except Exception as e:
            self.logger.error(f"Error getting daily stats: {e}")
            return {}

# Global instance
risk_manager = RiskManager()
