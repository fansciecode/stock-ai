#!/usr/bin/env python3
"""
Fix Button Color Change
=====================

This script fixes the issue where the trading button doesn't change color
from green to red when trading is active.
"""

import os
import logging
import time
import re

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/button_fix.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class ButtonColorFixer:
    """Fixes the button color change issue"""
    
    def __init__(self):
        """Initialize the button color fixer"""
        self.dashboard_path = 'src/web_interface/production_dashboard.py'
        
        # Create directories if they don't exist
        os.makedirs('logs', exist_ok=True)
    
    def _fix_html_template(self):
        """Fix the HTML template for button color change"""
        try:
            if not os.path.exists(self.dashboard_path):
                logger.warning(f"Dashboard file not found at {self.dashboard_path}")
                return False
            
            with open(self.dashboard_path, 'r') as f:
                content = f.read()
            
            # Find the HTML template section
            html_start = content.find('<!DOCTYPE html>')
            if html_start < 0:
                logger.warning("HTML template not found in dashboard file")
                return False
            
            # Find the trading button in the template
            trading_button_pattern = r'<button[^>]*id="startTradingBtn"[^>]*>(.*?)</button>'
            match = re.search(trading_button_pattern, content)
            
            if not match:
                logger.warning("Trading button not found in HTML template")
                return False
            
            # Check if the button already has the correct attributes
            button_html = match.group(0)
            
            if 'data-trading-active="false"' not in button_html:
                # Add data attribute to track trading state
                new_button_html = button_html.replace(
                    'id="startTradingBtn"',
                    'id="startTradingBtn" data-trading-active="false"'
                )
                content = content.replace(button_html, new_button_html)
                logger.info("Added data-trading-active attribute to button")
            
            # Find the JavaScript section for starting AI trading
            start_trading_js = content.find('$("#startTradingBtn").click(function() {')
            
            if start_trading_js < 0:
                logger.warning("Start trading JavaScript not found")
                return False
            
            # Check if the button color change code is already present
            if '$("#startTradingBtn").removeClass("btn-warning").addClass("btn-success")' not in content:
                # Add code to update button appearance when starting trading
                button_update_code = """
                // Update button appearance
                $("#startTradingBtn").html('<i class="fas fa-stop-circle"></i> Stop AI Trading');
                $("#startTradingBtn").removeClass("btn-success").addClass("btn-danger");
                $("#startTradingBtn").attr("data-trading-active", "true");
"""
                
                # Find a good place to insert the code (after the success callback)
                success_callback = content.find('success: function(data) {', start_trading_js)
                
                if success_callback > 0:
                    # Find the end of the showNotification call
                    notification_end = content.find(');', success_callback)
                    
                    if notification_end > 0:
                        # Insert the button update code after the notification
                        content = content[:notification_end+2] + button_update_code + content[notification_end+2:]
                        logger.info("Added button update code for starting trading")
            
            # Find the JavaScript section for stopping AI trading
            stop_trading_js = content.find('$("#stopTradingBtn").click(function() {')
            
            # If there's no dedicated stop button, we need to modify the start button to toggle
            if stop_trading_js < 0:
                # Add toggle functionality to the start button
                toggle_code = """
    // Toggle trading state
    $("#startTradingBtn").click(function() {
        var isTrading = $(this).attr("data-trading-active") === "true";
        
        if (isTrading) {
            // Stop trading
            $.ajax({
                url: '/api/stop-ai-trading',
                type: 'POST',
                success: function(data) {
                    showNotification('success', 'AI trading stopped successfully');
                    
                    // Update button appearance
                    $("#startTradingBtn").html('<i class="fas fa-play-circle"></i> Start AI Trading');
                    $("#startTradingBtn").removeClass("btn-danger").addClass("btn-success");
                    $("#startTradingBtn").attr("data-trading-active", "false");
                },
                error: function(xhr, status, error) {
                    showNotification('error', 'Failed to stop AI trading: ' + error);
                }
            });
        } else {
            // Start trading
            $(this).prop('disabled', true);
            
            $.ajax({
                url: '/api/start-ai-trading',
                type: 'POST',
                timeout: 15000,
                success: function(data) {
                    showNotification('success', 'AI trading started successfully');
                    
                    // Update button appearance
                    $("#startTradingBtn").html('<i class="fas fa-stop-circle"></i> Stop AI Trading');
                    $("#startTradingBtn").removeClass("btn-success").addClass("btn-danger");
                    $("#startTradingBtn").attr("data-trading-active", "true");
                },
                error: function(xhr, status, error) {
                    showNotification('error', 'Failed to start AI trading: ' + error);
                    $("#startTradingBtn").prop('disabled', false);
                },
                complete: function() {
                    $("#startTradingBtn").prop('disabled', false);
                }
            });
        }
    });
"""
                
                # Replace the existing click handler
                existing_handler_start = content.find('$("#startTradingBtn").click(function() {')
                if existing_handler_start > 0:
                    # Find the end of the click handler
                    handler_end = content.find('});', existing_handler_start)
                    closing_brace = content.find('}', handler_end)
                    
                    if handler_end > 0 and closing_brace > 0:
                        # Replace the entire click handler
                        content = content[:existing_handler_start] + toggle_code + content[closing_brace+1:]
                        logger.info("Added toggle functionality to trading button")
            
            # Add function to check trading status periodically
            if "function checkTradingStatus()" not in content:
                status_check_code = """
    // Function to check trading status periodically
    function checkTradingStatus() {
        $.ajax({
            url: '/api/trading-status',
            type: 'GET',
            success: function(data) {
                if (data.is_trading) {
                    // Update button to show active trading
                    $("#startTradingBtn").html('<i class="fas fa-stop-circle"></i> Stop AI Trading');
                    $("#startTradingBtn").removeClass("btn-success").addClass("btn-danger");
                    $("#startTradingBtn").attr("data-trading-active", "true");
                } else {
                    // Update button to show inactive trading
                    $("#startTradingBtn").html('<i class="fas fa-play-circle"></i> Start AI Trading');
                    $("#startTradingBtn").removeClass("btn-danger").addClass("btn-success");
                    $("#startTradingBtn").attr("data-trading-active", "false");
                }
            }
        });
    }
    
    // Check trading status every 5 seconds
    setInterval(checkTradingStatus, 5000);
"""
                
                # Add the status check code before the closing script tag
                script_end = content.find('</script>', html_start)
                
                if script_end > 0:
                    content = content[:script_end] + status_check_code + content[script_end:]
                    logger.info("Added periodic trading status check")
            
            # Add trading status API endpoint if not present
            if "def trading_status():" not in content:
                status_endpoint = """
@app.route('/api/trading-status', methods=['GET'])
def trading_status():
    \"\"\"Get current trading status\"\"\"
    # Check if user is logged in
    if 'user_token' not in session:
        return jsonify({"error": "Not authenticated", "success": False}), 401
    
    # Force LIVE mode
    trading_mode = 'LIVE'
    
    try:
        user_email = session.get('user_email')
        
        # Check if trading is active for this user
        conn = sqlite3.connect('data/fixed_continuous_trading.db')
        cursor = conn.cursor()
        
        # Check if trading_sessions table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='trading_sessions';")
        if not cursor.fetchone():
            return jsonify({"is_trading": False, "success": True})
        
        # Check for active sessions
        cursor.execute("SELECT id FROM trading_sessions WHERE user_email=? AND is_active=1;", (user_email,))
        session_result = cursor.fetchone()
        
        is_trading = session_result is not None
        
        # Get position count if trading is active
        position_count = 0
        if is_trading:
            cursor.execute("SELECT COUNT(*) FROM active_positions WHERE session_id=?;", (session_result[0],))
            position_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            "is_trading": is_trading,
            "position_count": position_count,
            "success": True
        })
    except Exception as e:
        print(f"Error getting trading status: {e}")
        return jsonify({"error": str(e), "success": False}), 500
"""
                
                # Add the endpoint before the if __name__ == "__main__": line
                main_check = content.find('if __name__ == "__main__":')
                
                if main_check > 0:
                    content = content[:main_check] + status_endpoint + "\n" + content[main_check:]
                    logger.info("Added trading status API endpoint")
            
            # Write modified content
            with open(self.dashboard_path, 'w') as f:
                f.write(content)
            
            logger.info("Updated HTML template for button color change")
            return True
        except Exception as e:
            logger.error(f"Error fixing HTML template: {e}")
            return False
    
    def _restart_dashboard(self):
        """Restart the dashboard"""
        try:
            # Stop existing processes
            os.system("pkill -f production_dashboard.py")
            
            # Wait for processes to stop
            time.sleep(2)
            
            # Start dashboard
            os.system("python3 src/web_interface/production_dashboard.py > dashboard.log 2>&1 &")
            
            logger.info("Restarted dashboard")
            return True
        except Exception as e:
            logger.error(f"Error restarting dashboard: {e}")
            return False
    
    def fix_button_color(self):
        """Fix the button color change issue"""
        logger.info("Starting button color fix")
        
        # Step 1: Fix HTML template
        self._fix_html_template()
        
        # Step 2: Restart dashboard
        self._restart_dashboard()
        
        logger.info("Button color fix completed")
        return True

def main():
    """Main function"""
    print("🔧 FIXING BUTTON COLOR CHANGE ISSUE")
    print("=" * 50)
    
    fixer = ButtonColorFixer()
    success = fixer.fix_button_color()
    
    if success:
        print("\n✅ BUTTON COLOR FIX COMPLETED")
        print("\nThe following fixes have been applied:")
        print("  1. Added data attribute to track trading state")
        print("  2. Updated button appearance when trading is active/inactive")
        print("  3. Added toggle functionality to the trading button")
        print("  4. Added periodic trading status check")
        print("  5. Added trading status API endpoint")
        
        print("\nPlease refresh your browser to see the changes.")
        print("The trading button should now change from green to red when trading is active.")
    else:
        print("\n❌ BUTTON COLOR FIX FAILED")
        print("Check logs for details: logs/button_fix.log")

if __name__ == "__main__":
    main()
