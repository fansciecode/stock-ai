#!/usr/bin/env python3
"""
🔴 FORCE LIVE TRADING - Configure Real Binance API
This will configure the system to use LIVE Binance API keys for real trading
"""

import sys
import os
import sqlite3
sys.path.append('src/web_interface')

def check_current_api_keys():
    """Check what API keys are currently configured"""
    print("🔍 CHECKING CURRENT API KEYS...")
    
    try:
        from simple_api_key_manager import APIKeyManager
        
        api_manager = APIKeyManager()
        user_email = "kirannaik@unitednewdigitalmedia.com"
        
        # Get all API keys for user
        keys = api_manager.get_user_api_keys(user_email)
        
        print(f"📊 Found {len(keys)} API keys:")
        for key in keys:
            exchange = key.get('exchange', 'Unknown')
            key_type = key.get('key_type', 'Unknown')
            status = key.get('status', 'Unknown')
            print(f"   {exchange}: {key_type} - {status}")
            
        return keys
        
    except Exception as e:
        print(f"❌ Error checking API keys: {e}")
        return []

def configure_live_binance_keys():
    """Configure live Binance API keys"""
    print("🔧 CONFIGURING LIVE BINANCE API KEYS...")
    
    try:
        from simple_api_key_manager import APIKeyManager
        
        api_manager = APIKeyManager()
        user_email = "kirannaik@unitednewdigitalmedia.com"
        
        # First, remove any existing Binance testnet keys
        print("🗑️ Removing existing testnet keys...")
        try:
            # This will remove testnet keys if they exist
            api_manager.delete_api_key(user_email, 'binance', 'TESTNET')
            print("✅ Removed testnet keys")
        except:
            print("ℹ️ No testnet keys to remove")
        
        # Add live Binance API keys (you'll need to provide these)
        print("➕ Adding LIVE Binance API keys...")
        
        # Note: These are placeholder keys - you need to provide your actual LIVE keys
        live_api_key = "YOUR_LIVE_BINANCE_API_KEY"
        live_secret_key = "YOUR_LIVE_BINANCE_SECRET_KEY"
        
        if live_api_key == "YOUR_LIVE_BINANCE_API_KEY":
            print("⚠️ PLACEHOLDER KEYS DETECTED!")
            print("📝 You need to provide your actual LIVE Binance API keys")
            print("🔗 Get them from: https://www.binance.com/en/my/settings/api-management")
            print("")
            print("🔧 Required permissions:")
            print("   ✅ Enable Reading")
            print("   ✅ Enable Spot & Margin Trading")
            print("   ❌ Enable Futures (not needed)")
            print("   ❌ Enable Withdrawals (not recommended)")
            return False
        
        # Add the live API key
        result = api_manager.add_api_key(
            user_email=user_email,
            exchange='binance',
            api_key=live_api_key,
            secret_key=live_secret_key,
            key_type='LIVE',
            passphrase=None
        )
        
        if result['success']:
            print("✅ Live Binance API keys added successfully!")
            return True
        else:
            print(f"❌ Failed to add live keys: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"❌ Error configuring live keys: {e}")
        return False

def test_live_binance_connection():
    """Test connection to live Binance API"""
    print("🧪 TESTING LIVE BINANCE CONNECTION...")
    
    try:
        # Import the actual Binance client
        import ccxt
        
        # Get API keys from database
        from simple_api_key_manager import APIKeyManager
        api_manager = APIKeyManager()
        user_email = "kirannaik@unitednewdigitalmedia.com"
        
        keys = api_manager.get_user_api_keys(user_email)
        binance_live_key = None
        
        for key in keys:
            if key['exchange'] == 'binance' and key['key_type'] == 'LIVE':
                binance_live_key = key
                break
        
        if not binance_live_key:
            print("❌ No live Binance API key found")
            return False
        
        # Create live Binance client
        binance = ccxt.binance({
            'apiKey': binance_live_key['api_key'],
            'secret': binance_live_key['secret_key'],
            'sandbox': False,  # LIVE trading
            'enableRateLimit': True,
        })
        
        # Test connection by fetching balance
        balance = binance.fetch_balance()
        
        print("✅ Live Binance connection successful!")
        print(f"💰 USDT Balance: {balance.get('USDT', {}).get('free', 0)}")
        print(f"💰 BTC Balance: {balance.get('BTC', {}).get('free', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Live Binance connection failed: {e}")
        print("🔧 This might be because:")
        print("   1. API keys are incorrect")
        print("   2. API keys don't have trading permissions")
        print("   3. IP address not whitelisted")
        print("   4. ccxt library not installed")
        return False

def force_live_trading_mode():
    """Force the system to use live trading mode"""
    print("🔴 FORCING LIVE TRADING MODE...")
    
    try:
        from trading_mode_manager import TradingModeManager
        
        mode_manager = TradingModeManager()
        user_email = "kirannaik@unitednewdigitalmedia.com"
        
        # Set to LIVE mode
        result = mode_manager.set_trading_mode(user_email, 'LIVE', force=True)
        
        if result['success']:
            print("✅ User set to LIVE trading mode")
            
            # Verify the mode
            current_mode = mode_manager.get_trading_mode(user_email)
            print(f"🔍 Verified mode: {current_mode}")
            
            return current_mode == 'LIVE'
        else:
            print(f"❌ Failed to set LIVE mode: {result.get('error', 'Unknown')}")
            return False
            
    except Exception as e:
        print(f"❌ Error setting LIVE mode: {e}")
        return False

def place_test_live_order():
    """Place a small test order on live Binance"""
    print("🎯 PLACING TEST LIVE ORDER...")
    
    try:
        import ccxt
        from simple_api_key_manager import APIKeyManager
        
        # Get live API keys
        api_manager = APIKeyManager()
        user_email = "kirannaik@unitednewdigitalmedia.com"
        keys = api_manager.get_user_api_keys(user_email)
        
        binance_live_key = None
        for key in keys:
            if key['exchange'] == 'binance' and key['key_type'] == 'LIVE':
                binance_live_key = key
                break
        
        if not binance_live_key:
            print("❌ No live Binance API key found")
            return False
        
        # Create live Binance client
        binance = ccxt.binance({
            'apiKey': binance_live_key['api_key'],
            'secret': binance_live_key['secret_key'],
            'sandbox': False,  # LIVE trading
            'enableRateLimit': True,
        })
        
        # Check balance first
        balance = binance.fetch_balance()
        usdt_balance = balance.get('USDT', {}).get('free', 0)
        
        print(f"💰 Available USDT: {usdt_balance}")
        
        if usdt_balance < 1:
            print("⚠️ Insufficient USDT balance for test order")
            print("💡 You need at least $1 USDT to place a test order")
            return False
        
        # Place a small DOGE/USDT buy order
        symbol = 'DOGE/USDT'
        amount_usdt = 1.0  # $1 worth
        
        # Get current DOGE price
        ticker = binance.fetch_ticker(symbol)
        doge_price = ticker['last']
        doge_quantity = amount_usdt / doge_price
        
        print(f"📊 DOGE Price: ${doge_price:.6f}")
        print(f"🎯 Buying {doge_quantity:.2f} DOGE for ${amount_usdt}")
        
        # Place market buy order
        order = binance.create_market_buy_order(symbol, doge_quantity)
        
        print("✅ LIVE ORDER PLACED SUCCESSFULLY!")
        print(f"🆔 Order ID: {order['id']}")
        print(f"📊 Symbol: {order['symbol']}")
        print(f"💰 Amount: {order['amount']}")
        print(f"📈 Status: {order['status']}")
        
        print("\n🎉 REAL DOGE ORDER PLACED ON YOUR BINANCE ACCOUNT!")
        print("🔍 Check your Binance account - you should see this order!")
        
        return True
        
    except Exception as e:
        print(f"❌ Live order placement failed: {e}")
        print("🔧 This might be because:")
        print("   1. Insufficient balance")
        print("   2. API keys don't have trading permissions")
        print("   3. Market is closed")
        print("   4. Order size too small")
        return False

def main():
    """Main function to force live trading"""
    print("=" * 80)
    print("🔴 FORCE LIVE TRADING - CONFIGURE REAL BINANCE API")
    print("=" * 80)
    
    # Step 1: Check current API keys
    current_keys = check_current_api_keys()
    
    # Step 2: Configure live keys (if needed)
    if not any(key.get('key_type') == 'LIVE' and key.get('exchange') == 'binance' for key in current_keys):
        print("\n⚠️ NO LIVE BINANCE KEYS FOUND!")
        print("🔧 You need to configure live Binance API keys")
        print("📝 Please provide your live Binance API credentials")
        return
    
    # Step 3: Test live connection
    if not test_live_binance_connection():
        print("\n❌ LIVE CONNECTION FAILED")
        print("🔧 Please check your API keys and permissions")
        return
    
    # Step 4: Force live trading mode
    if not force_live_trading_mode():
        print("\n❌ FAILED TO SET LIVE MODE")
        return
    
    # Step 5: Place test live order
    print("\n" + "="*50)
    print("🎯 READY TO PLACE LIVE ORDER")
    print("⚠️ THIS WILL USE REAL MONEY!")
    print("💰 Order: $1 DOGE/USDT BUY")
    print("="*50)
    
    confirm = input("Continue with LIVE order? (yes/no): ").lower().strip()
    
    if confirm == 'yes':
        if place_test_live_order():
            print("\n🎉 SUCCESS! LIVE TRADING IS NOW WORKING!")
            print("🔍 Check your Binance account for the DOGE order")
        else:
            print("\n❌ LIVE ORDER FAILED - Check errors above")
    else:
        print("\n⏸️ Live order cancelled by user")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
