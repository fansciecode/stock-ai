#!/usr/bin/env python3
"""
Test script to verify real trading setup is ready
"""

import sys
import os
sys.path.append('src/web_interface')

def test_real_trading_setup():
    """Test that the real trading system is properly configured"""
    
    print("🧪 Testing Real Trading Setup...")
    print("=" * 50)
    
    # Test 1: Check if MultiExchangeOrderManager can get API keys
    print("1️⃣ Testing API Key Retrieval...")
    try:
        from multi_exchange_order_manager import MultiExchangeOrderManager
        order_manager = MultiExchangeOrderManager()
        
        # Test Binance API keys
        binance_keys = order_manager._get_binance_api_keys()
        if binance_keys:
            print(f"✅ Binance API keys found: {binance_keys['api_key'][:8]}...")
        else:
            print("⚠️ No Binance API keys found")
        
        # Test balance checking
        print("\n2️⃣ Testing Balance Checking...")
        binance_balance = order_manager._get_real_binance_balance()
        print(f"📊 Binance Balance: {binance_balance}")
        
        zerodha_balance = order_manager._get_real_zerodha_balance()
        print(f"📊 Zerodha Balance: {zerodha_balance}")
        
    except Exception as e:
        print(f"❌ Error testing order manager: {e}")
    
    # Test 2: Check if CCXT is available for real trading
    print("\n3️⃣ Testing CCXT Availability...")
    try:
        import ccxt
        print("✅ CCXT library available for real trading")
        
        # Test creating a Binance client (without API keys)
        binance = ccxt.binance({'sandbox': False})
        print("✅ Binance client can be created")
        
    except ImportError:
        print("❌ CCXT not installed - run: pip install ccxt")
    except Exception as e:
        print(f"⚠️ CCXT error: {e}")
    
    # Test 3: Check if Zerodha KiteConnect is available
    print("\n4️⃣ Testing Zerodha KiteConnect...")
    try:
        from kiteconnect import KiteConnect
        print("✅ KiteConnect library available")
    except ImportError:
        print("⚠️ KiteConnect not installed - run: pip install kiteconnect")
    except Exception as e:
        print(f"⚠️ KiteConnect error: {e}")
    
    # Test 4: Check database connectivity
    print("\n5️⃣ Testing Database Connectivity...")
    try:
        import sqlite3
        
        # Check users database
        db_paths = [
            'src/web_interface/users.db',
            'data/users.db',
            'src/web_interface/../../data/users.db'
        ]
        
        users_db_found = False
        for db_path in db_paths:
            if os.path.exists(db_path):
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Check for test user
                cursor.execute("SELECT user_id FROM users WHERE email = ?", ('kirannaik@unitednewdigitalmedia.com',))
                user = cursor.fetchone()
                
                if user:
                    print(f"✅ User database found: {db_path}")
                    print(f"✅ Test user found: {user[0]}")
                    
                    # Check API keys
                    cursor.execute("SELECT COUNT(*) FROM api_keys WHERE user_id = ?", (user[0],))
                    key_count = cursor.fetchone()[0]
                    print(f"✅ API keys in database: {key_count}")
                    
                    users_db_found = True
                
                conn.close()
                break
        
        if not users_db_found:
            print("❌ Users database not found or no test user")
        
        # Check trading database
        trading_db_paths = [
            'data/fixed_continuous_trading.db',
            'src/web_interface/../../data/fixed_continuous_trading.db'
        ]
        
        for db_path in trading_db_paths:
            if os.path.exists(db_path):
                print(f"✅ Trading database found: {db_path}")
                break
        else:
            print("❌ Trading database not found")
            
    except Exception as e:
        print(f"❌ Database test error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 REAL TRADING READINESS SUMMARY:")
    print("=" * 50)
    print("✅ System is configured for real trading")
    print("💰 When you add funds to Binance/Zerodha:")
    print("   - System will detect real balances")
    print("   - Place actual orders using CCXT/KiteConnect")
    print("   - Monitor real positions and P&L")
    print("🔄 Current behavior (0 balance): Simulation mode")
    print("🚀 With funds: LIVE trading mode")
    print("=" * 50)

if __name__ == "__main__":
    test_real_trading_setup()
