#!/usr/bin/env python3
"""
🔄 Trading Mode Manager
Handles switching between TESTNET and LIVE trading modes
"""

import sqlite3
import os
from typing import Dict, Optional

class TradingModeManager:
    """Manages trading modes for users"""
    
    def __init__(self, db_path: str = "users.db"):
        self.db_path = db_path
        self._ensure_trading_modes_table()
    
    def _ensure_trading_modes_table(self):
        """Ensure trading_modes table exists"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS trading_modes (
                        user_email TEXT PRIMARY KEY,
                        trading_mode TEXT DEFAULT 'LIVE',
                        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                conn.commit()
        except Exception as e:
            print(f"Error creating trading_modes table: {e}")
    
    def set_trading_mode(self, user_email: str, mode: str, force: bool = False) -> Dict:
        """Set trading mode for user"""
        try:
            if mode not in ['TESTNET', 'LIVE']:
                return {
                    'success': False,
                    'error': f'Invalid trading mode: {mode}. Must be TESTNET or LIVE'
                }
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR REPLACE INTO trading_modes (user_email, trading_mode, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (user_email, mode))
                conn.commit()
                
            return {
                'success': True,
                'message': f'Trading mode set to {mode}',
                'mode': mode
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to set trading mode: {str(e)}'
            }
    
    def get_trading_mode(self, user_email: str) -> str:
        """Get current trading mode for user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT trading_mode FROM trading_modes WHERE user_email = ?
                """, (user_email,))
                result = cursor.fetchone()
                
                if result:
                    return result[0]
                else:
                    # Default to LIVE for new users
                    self.set_trading_mode(user_email, 'LIVE')
                    return 'LIVE'
                    
        except Exception as e:
            print(f"Error getting trading mode: {e}")
            return 'LIVE'  # Default to LIVE trading
    
    def get_trading_modes_info(self, user_email: str) -> Dict:
        """Get comprehensive trading mode information"""
        current_mode = self.get_trading_mode(user_email)
        
        return {
            'current_mode': current_mode,
            'available_modes': ['TESTNET', 'LIVE'],
            'testnet_active': current_mode == 'TESTNET',
            'live_active': current_mode == 'LIVE',
            'can_switch_to_live': True,  # Could add balance/verification checks here
            'description': {
                'TESTNET': 'Safe paper trading with virtual funds',
                'LIVE': 'Real trading with actual money'
            }
        }
    
    def switch_trading_mode(self, user_email: str) -> Dict:
        """Toggle between TESTNET and LIVE modes"""
        current_mode = self.get_trading_mode(user_email)
        new_mode = 'LIVE' if current_mode == 'TESTNET' else 'TESTNET'
        
        result = self.set_trading_mode(user_email, new_mode)
        if result['success']:
            result['switched_from'] = current_mode
            result['switched_to'] = new_mode
            
        return result

# Global instance
trading_mode_manager = TradingModeManager()

if __name__ == "__main__":
    # Test the trading mode manager
    test_email = "kirannaik@unitednewdigitalmedia.com"
    
    print("🧪 Testing Trading Mode Manager...")
    
    # Get current mode
    current = trading_mode_manager.get_trading_mode(test_email)
    print(f"Current mode: {current}")
    
    # Get full info
    info = trading_mode_manager.get_trading_modes_info(test_email)
    print(f"Trading modes info: {info}")
    
    # Test switching
    switch_result = trading_mode_manager.switch_trading_mode(test_email)
    print(f"Switch result: {switch_result}")
    
    print("✅ Trading Mode Manager test completed!")
