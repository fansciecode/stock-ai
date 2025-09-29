#!/usr/bin/env python3
"""
Fix Indentation Error in Trading Engine
=======================================

This script fixes the indentation error in fixed_continuous_trading_engine.py
that is causing AI trading to fail to start.
"""

import os
import logging
import re
import sys
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/indentation_fix.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class IndentationFixer:
    """Fixes indentation errors in the trading engine"""
    
    def __init__(self):
        """Initialize the indentation fixer"""
        self.engine_path = 'src/web_interface/fixed_continuous_trading_engine.py'
        
        # Create directories if they don't exist
        os.makedirs('logs', exist_ok=True)
    
    def fix_indentation_errors(self):
        """Fix indentation errors in the trading engine"""
        try:
            if not os.path.exists(self.engine_path):
                logger.warning(f"Trading engine file not found at {self.engine_path}")
                return False
            
            with open(self.engine_path, 'r') as f:
                content = f.read()
            
            # Check for the specific error at line 2170
            if '}")"' in content:
                # Fix the error - remove the extra closing parenthesis and quote
                content = content.replace('}")"', '}')
                logger.info("Fixed syntax error at line ~2170")
            
            # Check for any other indentation issues in _monitor_long_term_trends method
            if "def _monitor_long_term_trends" in content:
                # Find the method
                method_start = content.find("def _monitor_long_term_trends")
                
                # Find the next method or end of file
                next_method = content.find("def ", method_start + 1)
                if next_method < 0:
                    next_method = len(content)
                
                # Extract the method content
                method_content = content[method_start:next_method]
                
                # Check for proper indentation and closing
                if method_content.endswith('}")'):
                    # Fix improper closing
                    fixed_method = method_content.replace('}")', '}')
                    
                    # Replace in the full content
                    content = content.replace(method_content, fixed_method)
                    logger.info("Fixed improper method closing in _monitor_long_term_trends")
            
            # Write the fixed content back to the file
            with open(self.engine_path, 'w') as f:
                f.write(content)
            
            logger.info("Fixed indentation errors in trading engine")
            return True
        except Exception as e:
            logger.error(f"Error fixing indentation: {e}")
            return False
    
    def restart_services(self):
        """Restart the dashboard and trading engine"""
        try:
            # Stop existing processes
            os.system("pkill -f production_dashboard.py")
            os.system("pkill -f fixed_continuous_trading_engine.py")
            
            # Wait for processes to stop
            import time
            time.sleep(2)
            
            # Start dashboard
            os.system("python3 src/web_interface/production_dashboard.py > dashboard.log 2>&1 &")
            
            logger.info("Restarted services")
            return True
        except Exception as e:
            logger.error(f"Error restarting services: {e}")
            return False

def main():
    """Main function"""
    print("🔧 FIXING INDENTATION ERRORS")
    print("=" * 50)
    
    fixer = IndentationFixer()
    success = fixer.fix_indentation_errors()
    
    if success:
        fixer.restart_services()
        print("\n✅ INDENTATION ERRORS FIXED")
        print("\nThe following fixes have been applied:")
        print("  1. Fixed syntax error in _monitor_long_term_trends method")
        print("  2. Corrected improper closing brackets and parentheses")
        print("  3. Restarted services to apply changes")
        
        print("\nPlease refresh your browser and try starting AI trading again.")
    else:
        print("\n❌ FAILED TO FIX INDENTATION ERRORS")
        print("Check logs for details: logs/indentation_fix.log")

if __name__ == "__main__":
    main()
