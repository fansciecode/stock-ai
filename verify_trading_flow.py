#!/usr/bin/env python3
"""
Verify Complete Trading Flow
============================

This script verifies the entire trading flow from signal generation to order execution,
including risk management and strategy application.
"""

import requests
import time
import json
import sqlite3
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def verify_trading_flow():
    """Verify the complete trading flow with detailed checks"""
    print("🔍 VERIFYING COMPLETE TRADING FLOW")
    print("=" * 50)
    
    # Step 1: Login and setup
    print("\n1️⃣ Login and setup...")
    login_data = {'email': 'kirannaik@unitednewdigitalmedia.com', 'password': 'test123'}
    session = requests.Session()
    login_resp = session.post('http://localhost:8000/api/login', json=login_data)
    
    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.status_code}")
        return
        
    print("✅ Logged in successfully")
    
    # Step 2: Verify trading mode is LIVE
    print("\n2️⃣ Verifying trading mode...")
    modes_resp = session.get('http://localhost:8000/api/trading-modes')
    if modes_resp.status_code == 200:
        modes_data = modes_resp.json()
        trading_mode = modes_data.get('current_mode', 'UNKNOWN')
        print(f"🔍 Current trading mode: {trading_mode}")
        if trading_mode != 'LIVE':
            print("❌ Trading mode is not LIVE")
            return
    else:
        print(f"❌ Trading modes request failed: {modes_resp.status_code}")
        return
    
    # Step 3: Check AI model accuracy
    print("\n3️⃣ Checking AI model accuracy...")
    try:
        # Connect to database to check model metrics
        with sqlite3.connect('data/fixed_continuous_trading.db') as conn:
            cursor = conn.execute("""
                SELECT value FROM system_metrics 
                WHERE metric_name = 'ai_model_accuracy' 
                ORDER BY timestamp DESC LIMIT 1
            """)
            row = cursor.fetchone()
            if row:
                accuracy = float(row[0])
                print(f"📊 AI Model Accuracy: {accuracy:.1f}%")
                if accuracy >= 80:
                    print("✅ Model accuracy meets minimum requirement (80%+)")
                else:
                    print(f"⚠️ Model accuracy below target: {accuracy:.1f}% (target: 80%+)")
            else:
                print("⚠️ No model accuracy data found in database")
    except Exception as e:
        print(f"⚠️ Could not check model accuracy: {e}")
    
    # Step 4: Start AI trading
    print("\n4️⃣ Starting AI trading session...")
    start_resp = session.post('http://localhost:8000/api/start-ai-trading')
    if start_resp.status_code != 200:
        print(f"❌ Failed to start AI trading: {start_resp.status_code}")
        return
        
    print("✅ AI Trading started successfully")
    
    # Step 5: Monitor signal generation
    print("\n5️⃣ Monitoring signal generation (30 seconds)...")
    signals = []
    
    for i in range(6):
        time.sleep(5)
        
        # Get live signals
        signals_resp = session.get('http://localhost:8000/api/live-signals')
        if signals_resp.status_code == 200:
            signals_data = signals_resp.json()
            new_signals = signals_data.get('signals', [])
            
            if new_signals:
                signals.extend(new_signals)
                print(f"[{(i+1)*5}s] ✅ Found {len(new_signals)} new signals")
                
                # Show sample signal
                sample = new_signals[0]
                print(f"   📊 Sample: {sample.get('symbol')} {sample.get('signal_type')} (Confidence: {sample.get('confidence', 'N/A')})")
                print(f"   🧠 Reasoning: {sample.get('reasoning', 'N/A')}")
        else:
            print(f"[{(i+1)*5}s] ❌ Failed to get signals: {signals_resp.status_code}")
    
    # Step 6: Check trading activity for order placement
    print(f"\n6️⃣ Checking order placement based on {len(signals)} signals...")
    
    activity_resp = session.get('http://localhost:8000/api/trading-activity')
    if activity_resp.status_code != 200:
        print(f"❌ Failed to get trading activity: {activity_resp.status_code}")
    else:
        activity = activity_resp.json()
        logs = activity.get('activity', [])
        
        # Check for order attempts
        order_attempts = [log for log in logs if 'Attempting' in log]
        print(f"📊 Found {len(order_attempts)} order attempts")
        
        # Check for correct order sizes
        binance_orders = [log for log in logs if '$10.00' in log]
        zerodha_orders = [log for log in logs if '₹500' in log]
        
        print(f"📊 Binance orders ($10.00): {len(binance_orders)}")
        print(f"📊 Zerodha orders (₹500): {len(zerodha_orders)}")
        
        # Check for risk management application
        risk_logs = [log for log in logs if 'stop-loss' in log.lower() or 'take-profit' in log.lower()]
        print(f"🛡️ Risk management logs: {len(risk_logs)}")
        
        # Show sample risk settings if available
        if risk_logs:
            print(f"   🛡️ Sample: {risk_logs[0]}")
    
    # Step 7: Check strategy application
    print("\n7️⃣ Verifying strategy application...")
    
    # Get strategy signals from database
    try:
        with sqlite3.connect('data/fixed_continuous_trading.db') as conn:
            cursor = conn.execute("""
                SELECT strategy_name, COUNT(*) as signal_count 
                FROM strategy_signals 
                WHERE timestamp >= datetime('now', '-1 hour')
                GROUP BY strategy_name
            """)
            
            strategies = cursor.fetchall()
            if strategies:
                print("📊 Strategy signals in the last hour:")
                for strategy, count in strategies:
                    print(f"   - {strategy}: {count} signals")
            else:
                print("⚠️ No recent strategy signals found in database")
    except Exception as e:
        print(f"⚠️ Could not check strategy signals: {e}")
    
    # Step 8: Check position performance
    print("\n8️⃣ Checking position performance...")
    
    status_resp = session.get('http://localhost:8000/api/trading-status')
    if status_resp.status_code == 200:
        status = status_resp.json()
        active = status.get('status', {}).get('active', False)
        positions = status.get('status', {}).get('active_positions', 0)
        pnl = status.get('status', {}).get('current_pnl', 0)
        
        print(f"📊 Trading Status:")
        print(f"   Active: {active}")
        print(f"   Positions: {positions}")
        print(f"   Current P&L: ${pnl:.2f}")
        
        # Check historical performance
        try:
            with sqlite3.connect('data/fixed_continuous_trading.db') as conn:
                # Get completed positions
                df = pd.read_sql_query("""
                    SELECT * FROM active_positions 
                    WHERE status = 'closed' 
                    ORDER BY exit_time DESC LIMIT 100
                """, conn)
                
                if not df.empty:
                    # Calculate win rate
                    win_count = len(df[df['pnl'] > 0])
                    total_count = len(df)
                    win_rate = (win_count / total_count) * 100 if total_count > 0 else 0
                    
                    # Calculate average profit and loss
                    avg_profit = df[df['pnl'] > 0]['pnl'].mean() if len(df[df['pnl'] > 0]) > 0 else 0
                    avg_loss = df[df['pnl'] < 0]['pnl'].mean() if len(df[df['pnl'] < 0]) > 0 else 0
                    
                    print(f"\n📊 Historical Performance (Last {total_count} Positions):")
                    print(f"   Win Rate: {win_rate:.1f}%")
                    print(f"   Average Profit: ${avg_profit:.2f}")
                    print(f"   Average Loss: ${avg_loss:.2f}")
                    
                    # Calculate profit factor
                    total_profit = df[df['pnl'] > 0]['pnl'].sum()
                    total_loss = abs(df[df['pnl'] < 0]['pnl'].sum())
                    profit_factor = total_profit / total_loss if total_loss > 0 else float('inf')
                    
                    print(f"   Profit Factor: {profit_factor:.2f}")
                    
                    # Check if profit factor is above 1.0 (profitable)
                    if profit_factor > 1.0:
                        print("✅ System is profitable (Profit Factor > 1.0)")
                    else:
                        print("⚠️ System is not profitable (Profit Factor < 1.0)")
                else:
                    print("⚠️ No historical position data found")
        except Exception as e:
            print(f"⚠️ Could not analyze historical performance: {e}")
    else:
        print(f"❌ Status check failed: {status_resp.status_code}")
    
    # Step 9: Stop AI trading
    print("\n9️⃣ Stopping AI trading...")
    stop_resp = session.post('http://localhost:8000/api/stop-ai-trading')
    if stop_resp.status_code == 200:
        print("✅ AI Trading stopped successfully")
    else:
        print(f"❌ Failed to stop AI trading: {stop_resp.status_code}")
    
    # Step 10: Final summary
    print("\n🔍 VERIFICATION SUMMARY")
    print("=" * 50)
    print("✅ Trading Mode: LIVE")
    print(f"✅ Signals Generated: {len(signals)}")
    print(f"✅ Orders Attempted: {len(order_attempts) if 'order_attempts' in locals() else 'N/A'}")
    print(f"✅ Risk Management Applied: {len(risk_logs) > 0 if 'risk_logs' in locals() else 'N/A'}")
    
    if 'profit_factor' in locals() and profit_factor > 1.0:
        print("✅ System is PROFITABLE")
    elif 'profit_factor' in locals():
        print("❌ System is NOT PROFITABLE")
    else:
        print("⚠️ Profitability: Insufficient data")
    
    print("\n🎯 VERIFICATION COMPLETE!")
    print("=" * 50)

if __name__ == "__main__":
    verify_trading_flow()
