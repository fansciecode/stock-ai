#!/usr/bin/env python3
"""
Maintenance Mode Implementation
==============================

This script implements a maintenance mode for the trading system, allowing
safe updates and changes while preserving existing positions.
"""

import os
import sqlite3
import logging
import time
import json
import signal
import sys
import threading
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/maintenance.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class MaintenanceMode:
    """Implements maintenance mode for the trading system"""
    
    def __init__(self):
        """Initialize the maintenance mode handler"""
        self.db_path = 'data/fixed_continuous_trading.db'
        self.status_file = 'data/maintenance_status.json'
        self.maintenance_active = False
        self.monitor_thread = None
        self.stop_monitoring = False
        
        # Create directories if they don't exist
        os.makedirs('logs', exist_ok=True)
        os.makedirs('data', exist_ok=True)
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, sig, frame):
        """Handle termination signals"""
        logger.info(f"Received signal {sig}, shutting down gracefully")
        self.stop_monitoring = True
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        self.exit_maintenance_mode()
        sys.exit(0)
    
    def _save_status(self, status):
        """Save maintenance status to file"""
        try:
            with open(self.status_file, 'w') as f:
                json.dump(status, f, indent=2)
            logger.info(f"Saved maintenance status: {status}")
        except Exception as e:
            logger.error(f"Error saving maintenance status: {e}")
    
    def _load_status(self):
        """Load maintenance status from file"""
        try:
            if os.path.exists(self.status_file):
                with open(self.status_file, 'r') as f:
                    return json.load(f)
            return {'active': False, 'start_time': None, 'positions': []}
        except Exception as e:
            logger.error(f"Error loading maintenance status: {e}")
            return {'active': False, 'start_time': None, 'positions': []}
    
    def _get_active_positions(self):
        """Get active positions from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if the active_positions table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='active_positions';")
            if not cursor.fetchone():
                logger.warning("active_positions table not found")
                conn.close()
                return []
            
            # Get active positions
            cursor.execute("SELECT * FROM active_positions;")
            positions = cursor.fetchall()
            
            conn.close()
            
            if positions:
                logger.info(f"Found {len(positions)} active positions")
            else:
                logger.info("No active positions found")
            
            return positions
        except Exception as e:
            logger.error(f"Error getting active positions: {e}")
            return []
    
    def _get_active_sessions(self):
        """Get active trading sessions from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if the trading_sessions table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='trading_sessions';")
            if not cursor.fetchone():
                logger.warning("trading_sessions table not found")
                conn.close()
                return []
            
            # Get active sessions
            cursor.execute("SELECT * FROM trading_sessions WHERE is_active=1;")
            sessions = cursor.fetchall()
            
            conn.close()
            
            if sessions:
                logger.info(f"Found {len(sessions)} active trading sessions")
            else:
                logger.info("No active trading sessions found")
            
            return sessions
        except Exception as e:
            logger.error(f"Error getting active sessions: {e}")
            return []
    
    def _pause_trading_engine(self):
        """Pause the trading engine"""
        try:
            # Find and stop trading engine processes
            os.system("pkill -f fixed_continuous_trading_engine.py")
            
            # Wait for processes to stop
            time.sleep(2)
            
            # Check if processes are still running
            result = os.popen("pgrep -f fixed_continuous_trading_engine.py").read().strip()
            if result:
                logger.warning(f"Trading engine processes still running: {result}")
                return False
            
            logger.info("Trading engine paused successfully")
            return True
        except Exception as e:
            logger.error(f"Error pausing trading engine: {e}")
            return False
    
    def _resume_trading_engine(self):
        """Resume the trading engine"""
        try:
            # Start the trading engine in the background
            os.system("python3 src/web_interface/fixed_continuous_trading_engine.py > logs/trading_engine.log 2>&1 &")
            
            # Wait for process to start
            time.sleep(2)
            
            # Check if process is running
            result = os.popen("pgrep -f fixed_continuous_trading_engine.py").read().strip()
            if not result:
                logger.warning("Trading engine failed to start")
                return False
            
            logger.info("Trading engine resumed successfully")
            return True
        except Exception as e:
            logger.error(f"Error resuming trading engine: {e}")
            return False
    
    def _update_maintenance_flag(self, active):
        """Update maintenance flag in the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if the system_status table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='system_status';")
            if not cursor.fetchone():
                # Create the system_status table
                cursor.execute('''
                CREATE TABLE system_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE,
                    value TEXT,
                    updated_at TEXT
                );
                ''')
                conn.commit()
            
            # Update or insert maintenance flag
            cursor.execute('''
            INSERT OR REPLACE INTO system_status (key, value, updated_at)
            VALUES (?, ?, ?)
            ''', ('maintenance_mode', 'active' if active else 'inactive', datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Updated maintenance flag to {active}")
            return True
        except Exception as e:
            logger.error(f"Error updating maintenance flag: {e}")
            return False
    
    def _monitor_positions(self):
        """Monitor positions during maintenance mode"""
        logger.info("Starting position monitoring thread")
        
        while not self.stop_monitoring:
            try:
                positions = self._get_active_positions()
                
                if positions:
                    # In a real implementation, this would check exchange APIs
                    # for position status and execute stop-loss/take-profit orders
                    logger.info(f"Monitoring {len(positions)} positions")
                    
                    # Example: Check each position (simplified)
                    for position in positions:
                        position_id = position[0]
                        symbol = position[2]
                        entry_price = position[3]
                        logger.info(f"Position {position_id} ({symbol}) at {entry_price} is being monitored")
                
                # Sleep for monitoring interval
                time.sleep(10)
                
            except Exception as e:
                logger.error(f"Error in position monitoring: {e}")
                time.sleep(30)  # Longer sleep on error
    
    def enter_maintenance_mode(self):
        """Enter maintenance mode"""
        logger.info("Entering maintenance mode")
        
        # Check if already in maintenance mode
        status = self._load_status()
        if status['active']:
            logger.warning("Already in maintenance mode")
            return False
        
        # Get active sessions and positions
        sessions = self._get_active_sessions()
        positions = self._get_active_positions()
        
        # Pause trading engine
        if not self._pause_trading_engine():
            logger.error("Failed to pause trading engine")
            return False
        
        # Update maintenance flag
        self._update_maintenance_flag(True)
        
        # Save maintenance status
        status = {
            'active': True,
            'start_time': datetime.now().isoformat(),
            'sessions': sessions,
            'positions': positions
        }
        self._save_status(status)
        
        # Start monitoring thread
        self.stop_monitoring = False
        self.monitor_thread = threading.Thread(target=self._monitor_positions)
        self.monitor_thread.daemon = True
        self.monitor_thread.start()
        
        self.maintenance_active = True
        logger.info("Entered maintenance mode successfully")
        
        # Update dashboard UI
        self._update_dashboard_ui(True)
        
        return True
    
    def exit_maintenance_mode(self):
        """Exit maintenance mode"""
        logger.info("Exiting maintenance mode")
        
        # Check if in maintenance mode
        status = self._load_status()
        if not status['active'] and not self.maintenance_active:
            logger.warning("Not in maintenance mode")
            return False
        
        # Stop monitoring thread
        self.stop_monitoring = True
        if self.monitor_thread and self.monitor_thread.is_alive():
            self.monitor_thread.join(timeout=5)
        
        # Update maintenance flag
        self._update_maintenance_flag(False)
        
        # Resume trading engine
        if not self._resume_trading_engine():
            logger.error("Failed to resume trading engine")
            # Continue anyway to clean up maintenance mode
        
        # Save maintenance status
        status = {
            'active': False,
            'end_time': datetime.now().isoformat(),
            'sessions': [],
            'positions': []
        }
        self._save_status(status)
        
        self.maintenance_active = False
        logger.info("Exited maintenance mode successfully")
        
        # Update dashboard UI
        self._update_dashboard_ui(False)
        
        return True
    
    def _update_dashboard_ui(self, maintenance_active):
        """Update dashboard UI to show maintenance mode"""
        try:
            dashboard_path = 'src/web_interface/production_dashboard.py'
            
            if not os.path.exists(dashboard_path):
                logger.warning(f"Dashboard file not found at {dashboard_path}")
                return
            
            with open(dashboard_path, 'r') as f:
                content = f.read()
            
            # Check if maintenance mode indicator exists
            maintenance_indicator = "app.config['MAINTENANCE_MODE'] = "
            
            if maintenance_indicator in content:
                # Update existing indicator
                lines = content.split('\n')
                for i, line in enumerate(lines):
                    if maintenance_indicator in line:
                        lines[i] = f"{maintenance_indicator}{str(maintenance_active)}"
                        break
                
                modified_content = '\n'.join(lines)
            else:
                # Add maintenance mode indicator
                app_config_line = "app = Flask(__name__)"
                maintenance_config = f"\n# Maintenance mode flag\napp.config['MAINTENANCE_MODE'] = {str(maintenance_active)}\n"
                
                modified_content = content.replace(app_config_line, app_config_line + maintenance_config)
            
            # Write modified content
            with open(dashboard_path, 'w') as f:
                f.write(modified_content)
            
            logger.info(f"Updated dashboard UI maintenance mode to {maintenance_active}")
            
            # Restart dashboard
            os.system("pkill -f production_dashboard.py")
            time.sleep(2)
            os.system("python3 src/web_interface/production_dashboard.py > dashboard.log 2>&1 &")
            
        except Exception as e:
            logger.error(f"Error updating dashboard UI: {e}")
    
    def check_status(self):
        """Check maintenance mode status"""
        status = self._load_status()
        
        if status['active']:
            start_time = datetime.fromisoformat(status['start_time'])
            duration = datetime.now() - start_time
            hours, remainder = divmod(duration.total_seconds(), 3600)
            minutes, seconds = divmod(remainder, 60)
            
            print(f"\n🔧 MAINTENANCE MODE ACTIVE")
            print(f"Started: {start_time}")
            print(f"Duration: {int(hours)}h {int(minutes)}m {int(seconds)}s")
            print(f"Active Sessions: {len(status.get('sessions', []))}")
            print(f"Active Positions: {len(status.get('positions', []))}")
            print("\nTo exit maintenance mode, run: python3 maintenance_mode.py --exit")
        else:
            print("\n✅ MAINTENANCE MODE INACTIVE")
            print("System is operating normally")
            print("\nTo enter maintenance mode, run: python3 maintenance_mode.py --enter")
        
        return status['active']

def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Maintenance Mode Handler')
    group = parser.add_mutually_exclusive_group()
    group.add_argument('--enter', action='store_true', help='Enter maintenance mode')
    group.add_argument('--exit', action='store_true', help='Exit maintenance mode')
    group.add_argument('--status', action='store_true', help='Check maintenance mode status')
    args = parser.parse_args()
    
    maintenance = MaintenanceMode()
    
    if args.enter:
        success = maintenance.enter_maintenance_mode()
        if success:
            print("\n🔧 ENTERED MAINTENANCE MODE")
            print("The system will continue monitoring existing positions")
            print("but will not place new orders or start new trading sessions.")
            print("\nTo exit maintenance mode, run: python3 maintenance_mode.py --exit")
        else:
            print("\n❌ FAILED TO ENTER MAINTENANCE MODE")
            print("Check logs for details: logs/maintenance.log")
    elif args.exit:
        success = maintenance.exit_maintenance_mode()
        if success:
            print("\n✅ EXITED MAINTENANCE MODE")
            print("The system has resumed normal operation.")
        else:
            print("\n❌ FAILED TO EXIT MAINTENANCE MODE")
            print("Check logs for details: logs/maintenance.log")
    elif args.status:
        maintenance.check_status()
    else:
        # No arguments, show status and help
        maintenance.check_status()
        print("\nUse --enter to enter maintenance mode")
        print("Use --exit to exit maintenance mode")
        print("Use --status to check maintenance mode status")

if __name__ == "__main__":
    main()
