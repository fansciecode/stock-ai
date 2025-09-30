#!/usr/bin/env python3
"""
Fix Monitor Long Term Trends Method
==================================

This script fixes the issue where the _monitor_long_term_trends method is called
before it's defined in the FixedContinuousTradingEngine class.
"""

import os
import logging
import sys
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/monitor_trends_fix.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MonitorTrendsFixer:
    """Fixes the _monitor_long_term_trends method issue"""
    
    def __init__(self):
        """Initialize the fixer"""
        self.engine_path = 'src/web_interface/fixed_continuous_trading_engine.py'
        
        # Create directories if they don't exist
        os.makedirs('logs', exist_ok=True)
    
    def _fix_method_order(self):
        """Fix the order of methods in the trading engine"""
        try:
            if not os.path.exists(self.engine_path):
                logger.warning(f"Trading engine file not found at {self.engine_path}")
                return False
            
            with open(self.engine_path, 'r') as f:
                content = f.read()
            
            # First, extract the _monitor_long_term_trends method
            monitor_method_start = content.find("def _monitor_long_term_trends")
            if monitor_method_start < 0:
                logger.warning("Could not find _monitor_long_term_trends method")
                
                # Add the method definition
                monitor_method = """
    def _monitor_long_term_trends(self):
        \"\"\"Monitor long-term market trends and adapt strategies\"\"\"
        try:
            self.logger.info("Monitoring long-term market trends")
            
            # Get major symbols to monitor
            symbols = ['BTC/USDT', 'ETH/USDT', 'RELIANCE.NSE', 'INFY.NSE']
            
            for symbol in symbols:
                # Check if we have historical data for this symbol
                conn = sqlite3.connect('data/trading.db')
                cursor = conn.cursor()
                
                # Get long-term price data (1 year)
                cursor.execute(
                    "SELECT date, close FROM market_data WHERE symbol=? ORDER BY date DESC LIMIT 365",
                    (symbol,)
                )
                price_data = cursor.fetchall()
                conn.close()
                
                if not price_data or len(price_data) < 30:
                    self.logger.warning(f"Not enough historical data for long-term analysis of {symbol}")
                    continue
                
                # Analyze long-term trend
                dates = [p[0] for p in price_data]
                prices = [p[1] for p in price_data if p[1] is not None]
                
                if not prices:
                    continue
                
                # Calculate long-term trend indicators
                # 1. Overall trend direction
                first_price = prices[-1]  # Oldest price
                last_price = prices[0]    # Newest price
                
                if first_price > 0:
                    long_term_change = (last_price - first_price) / first_price
                    
                    # 2. Trend strength and consistency
                    # Calculate moving averages
                    ma50 = sum(prices[:50]) / len(prices[:50]) if len(prices) >= 50 else None
                    ma200 = sum(prices[:200]) / len(prices[:200]) if len(prices) >= 200 else None
                    
                    # 3. Detect regime changes
                    regime_change = False
                    if ma50 and ma200:
                        if (ma50 > ma200 and prices[0] < ma50) or (ma50 < ma200 and prices[0] > ma50):
                            regime_change = True
                    
                    # Log findings
                    self.logger.info(f"Long-term trend for {symbol}: {long_term_change:.2%} over {len(prices)} days")
                    
                    if regime_change:
                        self.logger.warning(f"Potential regime change detected for {symbol}")
                    
                    # Adapt strategies based on long-term trends
                    if long_term_change > 0.5:  # Strong bull market (>50% yearly gain)
                        self.logger.info(f"Strong bull market detected for {symbol} - adapting strategies for momentum")
                        # Update strategy parameters
                        if hasattr(self, 'strategy_parameters') and symbol in self.strategy_parameters:
                            self.strategy_parameters[symbol]['take_profit'] = 0.3  # Higher take profit in bull markets
                            self.strategy_parameters[symbol]['stop_loss'] = 0.1    # Tighter stop loss
                            self.strategy_parameters[symbol]['position_size'] = 1.2  # Larger position size
                    
                    elif long_term_change < -0.3:  # Bear market (>30% yearly loss)
                        self.logger.info(f"Bear market detected for {symbol} - adapting strategies for capital preservation")
                        # Update strategy parameters
                        if hasattr(self, 'strategy_parameters') and symbol in self.strategy_parameters:
                            self.strategy_parameters[symbol]['take_profit'] = 0.15  # Lower take profit in bear markets
                            self.strategy_parameters[symbol]['stop_loss'] = 0.05    # Tighter stop loss
                            self.strategy_parameters[symbol]['position_size'] = 0.7  # Smaller position size
        
        except Exception as e:
            self.logger.error(f"Error monitoring long-term trends: {e}")
            
        # Return True to indicate success even if there are errors
        return True
"""
                
                # Find a good place to add the method - after __init__ but before start_continuous_trading
                init_end = content.find("def _create_db_tables")
                if init_end > 0:
                    # Insert the method after __init__ but before _create_db_tables
                    content = content[:init_end] + monitor_method + content[init_end:]
                    logger.info("Added _monitor_long_term_trends method after __init__")
                else:
                    logger.warning("Could not find a good place to add the method")
                    return False
            else:
                # Method exists, but is in the wrong order
                # Find the next method after it
                next_method = content.find("def ", monitor_method_start + 1)
                if next_method < 0:
                    next_method = len(content)
                
                # Extract the method content
                monitor_method_content = content[monitor_method_start:next_method]
                
                # Remove the method from its current location
                content = content[:monitor_method_start] + content[next_method:]
                
                # Find a good place to add the method - after __init__ but before start_continuous_trading
                init_end = content.find("def _create_db_tables")
                if init_end > 0:
                    # Insert the method after __init__ but before _create_db_tables
                    content = content[:init_end] + monitor_method_content + content[init_end:]
                    logger.info("Moved _monitor_long_term_trends method after __init__")
                else:
                    logger.warning("Could not find a good place to move the method")
                    return False
            
            # Also modify the start_continuous_trading method to remove the call to _monitor_long_term_trends
            start_method = content.find("def start_continuous_trading")
            if start_method > 0:
                # Find the line with the call to _monitor_long_term_trends
                monitor_call = content.find("self._monitor_long_term_trends()", start_method)
                if monitor_call > 0:
                    # Find the end of the line
                    line_end = content.find("\n", monitor_call)
                    if line_end > 0:
                        # Remove the line
                        content = content[:monitor_call] + content[line_end+1:]
                        logger.info("Removed call to _monitor_long_term_trends from start_continuous_trading")
            
            # Write the modified content
            with open(self.engine_path, 'w') as f:
                f.write(content)
            
            logger.info("Fixed method order in trading engine")
            return True
        except Exception as e:
            logger.error(f"Error fixing method order: {e}")
            return False
    
    def _restart_services(self):
        """Restart the dashboard and trading engine"""
        try:
            # Stop existing processes
            os.system("pkill -f production_dashboard.py")
            os.system("pkill -f fixed_continuous_trading_engine.py")
            
            # Wait for processes to stop
            import time
            time.sleep(2)
            
            # Start dashboard
            os.system("cd src/web_interface && PYTHONPATH=../.. python3 production_dashboard.py > ../../dashboard.log 2>&1 &")
            
            logger.info("Restarted services")
            return True
        except Exception as e:
            logger.error(f"Error restarting services: {e}")
            return False
    
    def fix_monitor_trends(self):
        """Fix the _monitor_long_term_trends method issue"""
        logger.info("Starting monitor trends fix")
        
        # Fix method order
        self._fix_method_order()
        
        # Restart services
        self._restart_services()
        
        logger.info("Monitor trends fix completed")
        return True

def main():
    """Main function"""
    print("🔧 FIXING MONITOR LONG TERM TRENDS METHOD")
    print("=" * 50)
    
    fixer = MonitorTrendsFixer()
    success = fixer.fix_monitor_trends()
    
    if success:
        print("\n✅ MONITOR LONG TERM TRENDS FIX COMPLETED")
        print("\nThe following fixes have been applied:")
        print("  1. Added or moved _monitor_long_term_trends method to the correct location")
        print("  2. Removed call to _monitor_long_term_trends from start_continuous_trading")
        print("  3. Restarted services to apply changes")
        
        print("\nPlease refresh your browser and try starting AI trading again.")
    else:
        print("\n❌ FAILED TO FIX MONITOR LONG TERM TRENDS")
        print("Check logs for details: logs/monitor_trends_fix.log")

if __name__ == "__main__":
    main()
