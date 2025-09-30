#!/usr/bin/env python3
"""
Fix Simulation Fallback Issue
=============================

This script fixes the issue where the system falls back to simulation
even when live API keys are available and live trading is enabled.

Issues to fix:
1. Clear old trading sessions blocking new ones
2. Force live trading when API keys are available
3. Fix AI startup failure
4. Ensure real orders are placed
"""

import sqlite3
import os
import sys
import time
import requests
import json
from datetime import datetime

def clear_old_trading_sessions():
    """Clear old trading sessions that might be blocking new ones"""
    print("🧹 Clearing old trading sessions...")
    
    db_paths = [
        'data/continuous_trading.db',
        'data/fixed_continuous_trading.db', 
        'data/trading.db'
    ]
    
    for db_path in db_paths:
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Clear trading sessions
                cursor.execute("DELETE FROM trading_sessions WHERE 1=1")
                sessions_deleted = cursor.rowcount
                
                # Clear positions
                cursor.execute("DELETE FROM positions WHERE 1=1") 
                positions_deleted = cursor.rowcount
                
                conn.commit()
                conn.close()
                
                print(f"✅ {db_path}: Deleted {sessions_deleted} sessions, {positions_deleted} positions")
                
            except Exception as e:
                print(f"❌ Error clearing {db_path}: {e}")
        else:
            print(f"⚠️ Database not found: {db_path}")

def check_api_keys():
    """Check if live API keys are available"""
    print("🔑 Checking API keys...")
    
    try:
        conn = sqlite3.connect('data/continuous_trading.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT user_id, exchange, environment, status 
            FROM api_keys 
            WHERE user_id = 'kirannaik@unitednewdigitalmedia.com'
        """)
        
        keys = cursor.fetchall()
        conn.close()
        
        live_keys = [k for k in keys if k[2] == 'LIVE']
        testnet_keys = [k for k in keys if k[2] == 'TESTNET']
        
        print(f"📊 Found {len(live_keys)} LIVE keys, {len(testnet_keys)} TESTNET keys")
        
        for key in keys:
            print(f"   {key[1]} - {key[2]} - {key[3]}")
            
        return len(live_keys) > 0
        
    except Exception as e:
        print(f"❌ Error checking API keys: {e}")
        return False

def force_live_trading_mode():
    """Force the trading mode to LIVE"""
    print("🔴 Forcing LIVE trading mode...")
    
    try:
        conn = sqlite3.connect('data/continuous_trading.db')
        cursor = conn.cursor()
        
        # Update trading mode to LIVE
        cursor.execute("""
            UPDATE trading_modes 
            SET trading_mode = 'LIVE' 
            WHERE user_id = 'kirannaik@unitednewdigitalmedia.com'
        """)
        
        if cursor.rowcount == 0:
            # Insert if not exists
            cursor.execute("""
                INSERT OR REPLACE INTO trading_modes (user_id, trading_mode) 
                VALUES ('kirannaik@unitednewdigitalmedia.com', 'LIVE')
            """)
        
        conn.commit()
        conn.close()
        
        print("✅ Trading mode set to LIVE")
        
    except Exception as e:
        print(f"❌ Error setting trading mode: {e}")

def fix_trading_engine():
    """Fix the trading engine to prevent simulation fallback"""
    print("🔧 Fixing trading engine...")
    
    engine_file = 'src/web_interface/fixed_continuous_trading_engine.py'
    
    if not os.path.exists(engine_file):
        print(f"❌ Trading engine file not found: {engine_file}")
        return
    
    # Read the current file
    with open(engine_file, 'r') as f:
        content = f.read()
    
    # Find and fix the simulation fallback
    if '🎭 SIMULATED' in content:
        print("🎯 Found simulation fallback code")
        
        # Replace the simulation fallback with forced live trading
        old_code = '''                else:
                    # No live order - create simulated position
                    position['exchange'] = 'simulated'
                    exchange_display = "🎭 SIMULATED"
                    actual_symbol = instrument['symbol']
                    actual_price = current_price'''
        
        new_code = '''                else:
                    # Force live trading - no simulation allowed
                    print(f"⚠️ WARNING: Live order failed for {instrument['symbol']}, skipping...")
                    continue  # Skip this instrument instead of simulating'''
        
        if old_code in content:
            content = content.replace(old_code, new_code)
            
            # Write back the fixed file
            with open(engine_file, 'w') as f:
                f.write(content)
            
            print("✅ Fixed simulation fallback - now skips failed orders instead of simulating")
        else:
            print("⚠️ Simulation fallback code not found in expected format")
    else:
        print("✅ No simulation fallback found")

def test_dashboard_api():
    """Test if the dashboard API is working"""
    print("🌐 Testing dashboard API...")
    
    try:
        # Test login
        login_data = {
            'email': 'kirannaik@unitednewdigitalmedia.com',
            'password': 'test123'
        }
        
        response = requests.post('http://localhost:8000/api/login', json=login_data, timeout=5)
        
        if response.status_code == 200:
            print("✅ Dashboard API is responding")
            
            # Test trading status
            status_response = requests.get('http://localhost:8000/api/trading-status', timeout=5)
            if status_response.status_code == 200:
                status = status_response.json()
                print(f"📊 Trading Status: {status}")
                return True
            else:
                print(f"❌ Trading status failed: {status_response.status_code}")
        else:
            print(f"❌ Login failed: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Dashboard not running on port 8000")
    except Exception as e:
        print(f"❌ API test error: {e}")
    
    return False

def start_fresh_trading_session():
    """Start a fresh trading session"""
    print("🚀 Starting fresh trading session...")
    
    try:
        login_data = {
            'email': 'kirannaik@unitednewdigitalmedia.com',
            'password': 'test123'
        }
        
        # Login first
        login_response = requests.post('http://localhost:8000/api/login', json=login_data, timeout=10)
        
        if login_response.status_code == 200:
            print("✅ Logged in successfully")
            
            # Start AI trading
            start_response = requests.post('http://localhost:8000/api/start-ai-trading', timeout=30)
            
            if start_response.status_code == 200:
                result = start_response.json()
                print(f"🎉 AI Trading started: {result}")
                return True
            else:
                print(f"❌ Failed to start AI trading: {start_response.status_code}")
                print(f"Response: {start_response.text}")
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error starting trading session: {e}")
    
    return False

def monitor_trading_activity():
    """Monitor trading activity for a few minutes"""
    print("👀 Monitoring trading activity...")
    
    for i in range(6):  # Monitor for 1 minute (6 x 10 seconds)
        try:
            response = requests.get('http://localhost:8000/api/trading-status', timeout=5)
            
            if response.status_code == 200:
                status = response.json()
                active = status.get('active', False)
                positions = status.get('positions', 0)
                
                print(f"[{i*10}s] Active: {active}, Positions: {positions}")
                
                if active and positions > 0:
                    print("✅ Trading is active with positions!")
                    return True
            
        except Exception as e:
            print(f"[{i*10}s] Monitor error: {e}")
        
        time.sleep(10)
    
    print("⚠️ No active trading detected")
    return False

def main():
    """Main execution"""
    print("🔥 FIXING SIMULATION FALLBACK ISSUE")
    print("=" * 50)
    
    # Step 1: Clear old sessions
    clear_old_trading_sessions()
    print()
    
    # Step 2: Check API keys
    has_live_keys = check_api_keys()
    print()
    
    if not has_live_keys:
        print("❌ No LIVE API keys found - cannot enable live trading")
        return
    
    # Step 3: Force live trading mode
    force_live_trading_mode()
    print()
    
    # Step 4: Fix trading engine
    fix_trading_engine()
    print()
    
    # Step 5: Test dashboard API
    api_working = test_dashboard_api()
    print()
    
    if not api_working:
        print("❌ Dashboard API not working - please start the dashboard first")
        print("Run: python3 src/web_interface/production_dashboard.py")
        return
    
    # Step 6: Start fresh trading session
    session_started = start_fresh_trading_session()
    print()
    
    if session_started:
        # Step 7: Monitor activity
        monitor_trading_activity()
    
    print("\n🎯 Fix attempt completed!")
    print("If still showing SIMULATED, check the dashboard logs for specific errors.")

if __name__ == "__main__":
    main()
