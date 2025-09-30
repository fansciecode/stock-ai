#!/usr/bin/env python3
"""
Test Live Trading
================

Verify the live trading functionality is working correctly
"""

import requests
import time
import json

def test_live_trading():
    """Test the live trading functionality"""
    print("🧪 TESTING LIVE TRADING FUNCTIONALITY")
    print("=" * 50)
    
    # Step 1: Login
    print("\n1️⃣ Login to system...")
    login_data = {'email': 'kirannaik@unitednewdigitalmedia.com', 'password': 'test123'}
    session = requests.Session()
    login_resp = session.post('http://localhost:8000/api/login', json=login_data)
    
    if login_resp.status_code == 200:
        print("✅ Logged in successfully")
        
        # Step 2: Check trading mode
        print("\n2️⃣ Checking trading mode...")
        modes_resp = session.get('http://localhost:8000/api/trading-modes')
        if modes_resp.status_code == 200:
            modes_data = modes_resp.json()
            trading_mode = modes_data.get('current_mode', 'UNKNOWN')
            print(f"🔍 Current trading mode: {trading_mode}")
        
        # Step 3: Get trading activity (should show LIVE mode)
        print("\n3️⃣ Checking trading activity...")
        activity_resp = session.get('http://localhost:8000/api/trading-activity')
        if activity_resp.status_code == 200:
            activity = activity_resp.json()
            recent_logs = activity.get('activity', [])[:5]  # Get first 5 logs
            
            print("🔍 Recent activity:")
            for log in recent_logs:
                print(f"   {log}")
            
            # Check for LIVE mode indicators
            live_indicators = [log for log in recent_logs if 'LIVE' in log]
            if live_indicators:
                print("✅ Found LIVE mode indicators in activity")
            else:
                print("❌ No LIVE mode indicators found in activity")
                
            # Check for Test mode indicators (should be none)
            test_indicators = [log for log in recent_logs if 'Test mode' in log]
            if not test_indicators:
                print("✅ No Test mode indicators found (correct)")
            else:
                print("❌ Found Test mode indicators (incorrect)")
        
        # Step 4: Start AI trading
        print("\n4️⃣ Starting AI trading...")
        start_resp = session.post('http://localhost:8000/api/start-ai-trading')
        if start_resp.status_code == 200:
            result = start_resp.json()
            print(f"✅ AI Trading started: {result.get('message', 'Success')}")
            
            # Step 5: Monitor for order attempts
            print("\n5️⃣ Monitoring for order attempts (30 seconds)...")
            for i in range(6):
                time.sleep(5)
                
                # Check activity
                activity_resp = session.get('http://localhost:8000/api/trading-activity')
                if activity_resp.status_code == 200:
                    activity = activity_resp.json()
                    recent_logs = activity.get('activity', [])[-3:]
                    
                    print(f"[{(i+1)*5}s] Recent activity:")
                    for log in recent_logs:
                        print(f"   {log}")
                    
                    # Look for order attempts with correct sizes
                    all_logs = activity.get('activity', [])
                    
                    # Check for $10.00 orders (fixed Binance size)
                    binance_orders = [log for log in all_logs if '$10.00' in log]
                    if binance_orders:
                        print(f"\n✅ Found {len(binance_orders)} Binance orders with correct $10.00 size")
                        for order in binance_orders[:2]:  # Show first 2
                            print(f"   {order}")
                    
                    # Check for ₹500 orders (fixed Zerodha size)
                    zerodha_orders = [log for log in all_logs if '₹500' in log]
                    if zerodha_orders:
                        print(f"\n✅ Found {len(zerodha_orders)} Zerodha orders with correct ₹500 size")
                        for order in zerodha_orders[:2]:  # Show first 2
                            print(f"   {order}")
                    
                    # Check for LIVE mode indicators
                    live_indicators = [log for log in all_logs if '🔴 LIVE' in log or 'LIVE mode' in log]
                    if live_indicators:
                        print(f"\n✅ Found {len(live_indicators)} indicators of LIVE trading mode")
                        for indicator in live_indicators[:2]:  # Show first 2
                            print(f"   {indicator}")
                else:
                    print(f"❌ Activity check failed: {activity_resp.status_code}")
            
            # Step 6: Check trading status
            print("\n6️⃣ Checking trading status...")
            status_resp = session.get('http://localhost:8000/api/trading-status')
            if status_resp.status_code == 200:
                status = status_resp.json()
                active = status.get('status', {}).get('active', False)
                positions = status.get('status', {}).get('active_positions', 0)
                pnl = status.get('status', {}).get('current_pnl', 0)
                
                print(f"📊 Trading Status:")
                print(f"   Active: {active}")
                print(f"   Positions: {positions}")
                print(f"   P&L: ${pnl}")
                
                if active:
                    print("✅ Trading session is active")
                else:
                    print("❌ Trading session is not active")
            else:
                print(f"❌ Status check failed: {status_resp.status_code}")
            
            # Step 7: Stop AI trading
            print("\n7️⃣ Stopping AI trading...")
            stop_resp = session.post('http://localhost:8000/api/stop-ai-trading')
            if stop_resp.status_code == 200:
                stop_result = stop_resp.json()
                print(f"✅ AI Trading stopped: {stop_result.get('message', 'Success')}")
            else:
                print(f"❌ Failed to stop AI trading: {stop_resp.status_code}")
        else:
            print(f"❌ Failed to start AI trading: {start_resp.status_code}")
    else:
        print(f"❌ Login failed: {login_resp.status_code}")
    
    print("\n🎯 TEST COMPLETE!")
    print("=" * 50)

if __name__ == "__main__":
    test_live_trading()
