#!/usr/bin/env python3
"""
🔴 DIRECT LIVE ORDER PLACEMENT
Directly access live Binance API keys and place real order
"""

import sys
import os
import sqlite3
sys.path.append('src/web_interface')

def get_live_binance_keys():
    """Get live Binance API keys directly from database"""
    print("🔍 GETTING LIVE BINANCE API KEYS...")
    
    try:
        from simple_api_key_manager import SimpleAPIKeyManager
        
        # Get user ID
        db_path = 'src/web_interface/users.db'
        user_email = 'kirannaik@unitednewdigitalmedia.com'
        
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            
            # Get user ID
            cursor.execute('SELECT user_id FROM users WHERE email = ?', (user_email,))
            user_result = cursor.fetchone()
            
            if not user_result:
                print("❌ User not found")
                return None
            
            user_id = user_result[0]
            print(f"✅ Found user: {user_id}")
            
            # Get live Binance API key
            cursor.execute('''
                SELECT api_key, secret_key FROM api_keys 
                WHERE user_id = ? AND exchange = 'binance' AND is_testnet = 0 AND is_active = 1
                LIMIT 1
            ''', (user_id,))
            
            key_result = cursor.fetchone()
            
            if not key_result:
                print("❌ No live Binance API key found")
                return None
            
            encrypted_api_key, encrypted_secret = key_result
            print("✅ Found encrypted live Binance keys")
            
            # Decrypt the keys using the API key manager
            api_manager = SimpleAPIKeyManager()
            
            # Decrypt API key
            api_key = api_manager._decrypt_data(encrypted_api_key)
            secret_key = api_manager._decrypt_data(encrypted_secret)
            
            print("✅ Successfully decrypted API keys")
            print(f"   API Key: {api_key[:8]}...{api_key[-8:]}")
            print(f"   Secret: {secret_key[:8]}...{secret_key[-8:]}")
            
            return {
                'api_key': api_key,
                'secret_key': secret_key
            }
            
    except Exception as e:
        print(f"❌ Error getting live keys: {e}")
        return None

def place_live_doge_order():
    """Place a live DOGE order on Binance"""
    print("🔴 PLACING LIVE DOGE ORDER...")
    
    try:
        # Get live API keys
        keys = get_live_binance_keys()
        if not keys:
            return False
        
        # Import ccxt
        try:
            import ccxt
        except ImportError:
            print("❌ ccxt not installed. Installing...")
            os.system("pip install ccxt")
            import ccxt
        
        # Create live Binance client
        binance = ccxt.binance({
            'apiKey': keys['api_key'],
            'secret': keys['secret_key'],
            'sandbox': False,  # LIVE trading
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot'
            }
        })
        
        print("✅ Created live Binance client")
        
        # Test connection
        balance = binance.fetch_balance()
        usdt_balance = balance.get('USDT', {}).get('free', 0)
        doge_balance = balance.get('DOGE', {}).get('free', 0)
        
        print(f"💰 USDT Balance: {usdt_balance}")
        print(f"🐕 DOGE Balance: {doge_balance}")
        
        if usdt_balance < 1:
            print("⚠️ Insufficient USDT balance")
            print("💡 Add at least $1 USDT to your Binance account")
            return False
        
        # Get DOGE price
        symbol = 'DOGE/USDT'
        ticker = binance.fetch_ticker(symbol)
        doge_price = ticker['last']
        
        # Order details
        order_value = 0.50  # $0.50 order
        doge_quantity = order_value / doge_price
        
        print(f"📊 DOGE Price: ${doge_price:.6f}")
        print(f"🎯 Order: Buy {doge_quantity:.2f} DOGE for ${order_value}")
        
        # Final confirmation
        print("\\n" + "="*50)
        print("🚨 FINAL CONFIRMATION")
        print("🔴 This is a REAL order on LIVE Binance!")
        print(f"💰 Cost: ${order_value} USDT")
        print(f"🐕 You'll get: ~{doge_quantity:.2f} DOGE")
        print("="*50)
        
        confirm = input("Place REAL order? (yes/no): ").lower().strip()
        
        if confirm != 'yes':
            print("⏸️ Order cancelled")
            return False
        
        # Place the order
        print("🚀 Placing order...")
        order = binance.create_market_buy_order(symbol, doge_quantity)
        
        print("\\n🎉 REAL ORDER PLACED SUCCESSFULLY!")
        print("="*60)
        print(f"🆔 Order ID: {order['id']}")
        print(f"📊 Symbol: {order['symbol']}")
        print(f"💰 Amount: {order['amount']} DOGE")
        print(f"📈 Status: {order['status']}")
        print(f"💵 Cost: ${order_value} USDT")
        print("="*60)
        
        print("\\n✅ CHECK YOUR BINANCE ACCOUNT!")
        print("🔍 You should see:")
        print("   📈 Order in Order History")
        print("   💰 Reduced USDT balance")
        print("   🐕 Increased DOGE balance")
        
        return True
        
    except Exception as e:
        print(f"❌ Order failed: {e}")
        return False

def main():
    """Main function"""
    print("=" * 80)
    print("🔴 DIRECT LIVE DOGE ORDER PLACEMENT")
    print("🎯 Using your LIVE Binance API keys directly")
    print("=" * 80)
    
    if place_live_doge_order():
        print("\\n🎉 SUCCESS!")
        print("✅ Real DOGE order placed on Binance")
        print("🔍 Check your Binance account to confirm")
        print("\\n🚀 Your system can now place REAL orders!")
    else:
        print("\\n❌ FAILED")
        print("🔧 Check errors above")
    
    print("\\n" + "=" * 80)

if __name__ == "__main__":
    main()
