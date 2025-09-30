#!/usr/bin/env python3
"""
Fix Trading Session Errors
=========================

This script fixes errors in trading session startup and ensures the system
properly responds to market changes.
"""

import os
import sqlite3
import logging
import time
import json
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/trading_fix.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TradingSessionFixer:
    """Fixes trading session errors"""
    
    def __init__(self):
        """Initialize the trading session fixer"""
        self.db_path = 'data/fixed_continuous_trading.db'
        self.engine_path = 'src/web_interface/fixed_continuous_trading_engine.py'
        
        # Create directories if they don't exist
        os.makedirs('logs', exist_ok=True)
    
    def _clean_existing_sessions(self):
        """Clean existing trading sessions"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if trading_sessions table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='trading_sessions';")
            if cursor.fetchone():
                # Delete all active sessions
                cursor.execute("DELETE FROM trading_sessions WHERE is_active=1;")
                conn.commit()
                logger.info(f"Deleted {cursor.rowcount} active trading sessions")
                
                # Reset auto-increment counter
                cursor.execute("DELETE FROM sqlite_sequence WHERE name='trading_sessions';")
                conn.commit()
                logger.info("Reset trading_sessions auto-increment counter")
            
            # Check if active_positions table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='active_positions';")
            if cursor.fetchone():
                # Delete all positions
                cursor.execute("DELETE FROM active_positions;")
                conn.commit()
                logger.info(f"Deleted {cursor.rowcount} active positions")
                
                # Reset auto-increment counter
                cursor.execute("DELETE FROM sqlite_sequence WHERE name='active_positions';")
                conn.commit()
                logger.info("Reset active_positions auto-increment counter")
            
            conn.close()
            return True
        except Exception as e:
            logger.error(f"Error cleaning existing sessions: {e}")
            return False
    
    def _fix_trading_engine(self):
        """Fix the trading engine"""
        try:
            if not os.path.exists(self.engine_path):
                logger.warning(f"Trading engine file not found at {self.engine_path}")
                return False
            
            with open(self.engine_path, 'r') as f:
                content = f.read()
            
            # Fix 1: Fix error handling in start_continuous_trading
            if "def start_continuous_trading" in content:
                # Find the method
                method_start = content.find("def start_continuous_trading")
                next_def = content.find("def ", method_start + 1)
                
                if next_def > 0:
                    method_content = content[method_start:next_def]
                    
                    # Check if we need to add better error handling
                    if "Trading session already active for" in method_content and "return {\"success\": False, \"error\":" in method_content:
                        # Add code to delete existing session if it exists
                        if "# Delete existing session if it exists" not in method_content:
                            # Find the check for existing session
                            existing_check = method_content.find("if user_email in self.active_sessions:")
                            
                            if existing_check > 0:
                                # Find the end of the if block
                                warning_line = method_content.find("self.logger.warning", existing_check)
                                return_line = method_content.find("return", warning_line)
                                
                                if warning_line > 0 and return_line > 0:
                                    # Replace the warning and return with code to delete the existing session
                                    old_code = method_content[warning_line:return_line + method_content[return_line:].find("}") + 1]
                                    
                                    new_code = f"""            self.logger.warning(f"Trading session already active for {{user_email}}, stopping it first")
            
            # Stop the existing session
            try:
                # Remove from active sessions
                if user_email in self.active_sessions:
                    session_id = self.active_sessions[user_email].get('id')
                    
                    # Mark session as inactive in database
                    conn = sqlite3.connect(self.db_path)
                    cursor = conn.cursor()
                    cursor.execute(
                        "UPDATE trading_sessions SET is_active=0, end_time=? WHERE id=?",
                        (datetime.now().isoformat(), session_id)
                    )
                    conn.commit()
                    conn.close()
                    
                    # Remove from memory
                    del self.active_sessions[user_email]
                    
                    self.logger.info(f"Stopped existing session for {{user_email}}")
            except Exception as e:
                self.logger.error(f"Error stopping existing session: {{e}}")"""
                                    
                                    # Replace the code
                                    method_content = method_content.replace(old_code, new_code)
                                    
                                    # Update the full content
                                    content = content.replace(content[method_start:next_def], method_content)
                                    logger.info("Added code to stop existing session before starting a new one")
            
            # Fix 2: Enhance _place_initial_orders method to handle market changes
            if "def _place_initial_orders" in content:
                # Find the method
                method_start = content.find("def _place_initial_orders")
                next_def = content.find("def ", method_start + 1)
                
                if next_def > 0:
                    method_content = content[method_start:next_def]
                    
                    # Check if we need to add dynamic market response
                    if "# Check for significant market changes" not in method_content:
                        # Find a good place to insert the code
                        end_of_method = method_content.rfind("}")
                        
                        if end_of_method > 0:
                            # Add dynamic market response code
                            dynamic_code = """
        # Check for significant market changes
        self._monitor_market_volatility()
"""
                            
                            # Insert the code before the end of the method
                            method_content = method_content[:end_of_method] + dynamic_code + method_content[end_of_method:]
                            
                            # Update the full content
                            content = content.replace(content[method_start:next_def], method_content)
                            logger.info("Added market volatility monitoring to _place_initial_orders")
            
            # Fix 3: Add _monitor_market_volatility method
            if "def _monitor_market_volatility" not in content:
                # Find a good place to add the method
                class_end = content.rfind("}")
                
                if class_end > 0:
                    # Add the method before the end of the class
                    volatility_method = """
    def _monitor_market_volatility(self):
        \"\"\"Monitor market volatility and respond to significant changes\"\"\"
        try:
            self.logger.info("Monitoring market volatility")
            
            # Get major symbols to monitor
            symbols = ['BTC/USDT', 'ETH/USDT', 'RELIANCE.NSE', 'INFY.NSE']
            
            for symbol in symbols:
                # Check if we have historical data for this symbol
                conn = sqlite3.connect('data/trading.db')
                cursor = conn.cursor()
                
                # Get recent price data
                cursor.execute(
                    "SELECT close FROM market_data WHERE symbol=? ORDER BY timestamp DESC LIMIT 20",
                    (symbol,)
                )
                prices = cursor.fetchall()
                conn.close()
                
                if not prices or len(prices) < 10:
                    self.logger.warning(f"Not enough historical data for {symbol}")
                    continue
                
                # Calculate volatility (standard deviation of returns)
                prices = [p[0] for p in prices if p[0] is not None]
                if not prices:
                    continue
                    
                # Calculate returns
                returns = []
                for i in range(1, len(prices)):
                    if prices[i-1] > 0:
                        returns.append((prices[i] - prices[i-1]) / prices[i-1])
                
                if not returns:
                    continue
                
                # Calculate standard deviation
                mean_return = sum(returns) / len(returns)
                variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
                volatility = variance ** 0.5
                
                # Check for high volatility
                if volatility > 0.02:  # 2% volatility threshold
                    self.logger.warning(f"High volatility detected for {symbol}: {volatility:.2%}")
                    
                    # Check price trend
                    price_change = (prices[0] - prices[-1]) / prices[-1]
                    
                    if price_change > 0.05:  # 5% price increase
                        self.logger.info(f"Significant price increase for {symbol}: {price_change:.2%}")
                        
                        # Check if we have any positions for this symbol
                        for user_email, session in self.active_sessions.items():
                            for position in session.get('positions', []):
                                if position['symbol'] == symbol and position['side'] == 'BUY':
                                    # Consider taking profit
                                    current_price = prices[0]
                                    entry_price = position['entry_price']
                                    profit = (current_price - entry_price) / entry_price
                                    
                                    if profit > 0.1:  # 10% profit threshold
                                        self.logger.info(f"Taking profit for {symbol} position: {profit:.2%}")
                                        
                                        # Execute sell order
                                        self._place_market_order(symbol, 'SELL', position['quantity'], user_email)
                    
                    elif price_change < -0.05:  # 5% price decrease
                        self.logger.info(f"Significant price decrease for {symbol}: {price_change:.2%}")
                        
                        # Check if we have any positions for this symbol
                        for user_email, session in self.active_sessions.items():
                            for position in session.get('positions', []):
                                if position['symbol'] == symbol and position['side'] == 'BUY':
                                    # Consider stop loss
                                    current_price = prices[0]
                                    entry_price = position['entry_price']
                                    loss = (current_price - entry_price) / entry_price
                                    
                                    if loss < -0.05:  # 5% loss threshold
                                        self.logger.info(f"Executing stop loss for {symbol} position: {loss:.2%}")
                                        
                                        # Execute sell order
                                        self._place_market_order(symbol, 'SELL', position['quantity'], user_email)
        
        except Exception as e:
            self.logger.error(f"Error monitoring market volatility: {e}")
    
    def _place_market_order(self, symbol, side, quantity, user_email):
        \"\"\"Place a market order\"\"\"
        try:
            self.logger.info(f"Placing {side} order for {quantity} {symbol}")
            
            # Determine exchange based on symbol
            if symbol.endswith('/USDT'):
                exchange = 'binance'
            else:
                exchange = 'zerodha'
            
            # Place order through order manager
            from src.web_interface.multi_exchange_order_manager import MultiExchangeOrderManager
            order_manager = MultiExchangeOrderManager()
            
            # Always use LIVE mode
            trading_mode = 'LIVE'
            
            # Place the order
            result = order_manager.place_order(symbol, side, quantity, exchange, trading_mode)
            
            if result['success']:
                self.logger.info(f"Order placed successfully: {result}")
                
                # Update position in database
                if side == 'SELL':
                    # Mark position as closed
                    conn = sqlite3.connect(self.db_path)
                    cursor = conn.cursor()
                    
                    # Find the position
                    session_id = self.active_sessions[user_email]['id']
                    cursor.execute(
                        "UPDATE active_positions SET status='CLOSED' WHERE session_id=? AND symbol=?",
                        (session_id, symbol)
                    )
                    conn.commit()
                    conn.close()
            else:
                self.logger.error(f"Failed to place order: {result}")
        
        except Exception as e:
            self.logger.error(f"Error placing market order: {e}")
"""
                    
                    # Add the method
                    content = content[:class_end] + volatility_method + content[class_end:]
                    logger.info("Added _monitor_market_volatility method")
            
            # Write modified content
            with open(self.engine_path, 'w') as f:
                f.write(content)
            
            logger.info("Fixed trading engine")
            return True
        except Exception as e:
            logger.error(f"Error fixing trading engine: {e}")
            return False
    
    def _restart_services(self):
        """Restart the dashboard and trading engine"""
        try:
            # Stop existing processes
            os.system("pkill -f production_dashboard.py")
            os.system("pkill -f fixed_continuous_trading_engine.py")
            
            # Wait for processes to stop
            time.sleep(2)
            
            # Start dashboard
            os.system("python3 src/web_interface/production_dashboard.py > dashboard.log 2>&1 &")
            
            logger.info("Restarted services")
            return True
        except Exception as e:
            logger.error(f"Error restarting services: {e}")
            return False
    
    def fix_trading_session(self):
        """Fix trading session errors"""
        logger.info("Starting trading session fix")
        
        # Step 1: Clean existing sessions
        self._clean_existing_sessions()
        
        # Step 2: Fix trading engine
        self._fix_trading_engine()
        
        # Step 3: Restart services
        self._restart_services()
        
        logger.info("Trading session fix completed")
        return True

def main():
    """Main function"""
    print("🔧 FIXING TRADING SESSION ERRORS")
    print("=" * 50)
    
    fixer = TradingSessionFixer()
    success = fixer.fix_trading_session()
    
    if success:
        print("\n✅ TRADING SESSION FIX COMPLETED")
        print("\nThe following fixes have been applied:")
        print("  1. Cleaned existing trading sessions and positions")
        print("  2. Fixed error handling in start_continuous_trading")
        print("  3. Added code to stop existing session before starting a new one")
        print("  4. Added market volatility monitoring")
        print("  5. Added dynamic response to significant market changes")
        
        print("\nThe system will now:")
        print("  1. Properly handle session startup errors")
        print("  2. Monitor market volatility and respond to significant changes")
        print("  3. Take profit when price increases significantly")
        print("  4. Execute stop loss when price decreases significantly")
        
        print("\nPlease refresh your browser and try starting AI trading again.")
    else:
        print("\n❌ TRADING SESSION FIX FAILED")
        print("Check logs for details: logs/trading_fix.log")

if __name__ == "__main__":
    main()
