#!/usr/bin/env python3
"""
🔴 PLACE REAL DOGE ORDER
Use your live Binance API keys to place a real DOGE order
"""

import sys
import os
sys.path.append('src/web_interface')

def place_real_doge_order():
    """Place a real DOGE order using the dashboard's API key system"""
    print("🔴 PLACING REAL DOGE ORDER ON LIVE BINANCE...")
    
    try:
        # Use the existing API key system from the dashboard
        from simple_api_key_manager import SimpleAPIKeyManager
        
        # Initialize the API key manager
        api_manager = SimpleAPIKeyManager()
        user_email = "kirannaik@unitednewdigitalmedia.com"
        
        # Get live Binance API keys
        live_keys = api_manager.get_user_api_keys(user_email)
        
        binance_live_key = None
        for key in live_keys:
            if key['exchange'] == 'binance' and not key.get('is_testnet', True):
                binance_live_key = key
                break
        
        if not binance_live_key:
            print("❌ No live Binance API key found")
            print("🔧 Make sure you have added LIVE (not testnet) Binance API keys")
            return False
        
        print("✅ Found live Binance API key")
        
        # Import ccxt for Binance trading
        try:
            import ccxt
        except ImportError:
            print("❌ ccxt library not installed")
            print("🔧 Install with: pip install ccxt")
            return False
        
        # Create live Binance client
        binance = ccxt.binance({
            'apiKey': binance_live_key['api_key'],
            'secret': binance_live_key['secret_key'],
            'sandbox': False,  # LIVE trading (not testnet)
            'enableRateLimit': True,
            'options': {
                'defaultType': 'spot'
            }
        })
        
        print("✅ Created live Binance client")
        
        # Test connection and get balance
        balance = binance.fetch_balance()
        usdt_balance = balance.get('USDT', {}).get('free', 0)
        doge_balance = balance.get('DOGE', {}).get('free', 0)
        
        print(f"💰 Current USDT Balance: {usdt_balance}")
        print(f"🐕 Current DOGE Balance: {doge_balance}")
        
        if usdt_balance < 1:
            print("⚠️ Insufficient USDT balance for order")
            print("💡 You need at least $1 USDT to place an order")
            print("🔗 Add funds to your Binance account first")
            return False
        
        # Get current DOGE price
        symbol = 'DOGE/USDT'
        ticker = binance.fetch_ticker(symbol)
        doge_price = ticker['last']
        
        # Calculate order size (use $0.50 for safety)
        order_value_usdt = 0.50
        doge_quantity = order_value_usdt / doge_price
        
        print(f"📊 Current DOGE Price: ${doge_price:.6f}")
        print(f"🎯 Order Details:")
        print(f"   💰 Value: ${order_value_usdt} USDT")
        print(f"   🐕 Quantity: {doge_quantity:.2f} DOGE")
        print(f"   📈 Type: Market Buy Order")
        
        # Confirm the order
        print("\n" + "="*50)
        print("⚠️  FINAL CONFIRMATION")
        print("🔴 This will place a REAL order on Binance!")
        print("💰 You will spend real money!")
        print("🐕 You will receive real DOGE!")
        print("="*50)
        
        confirm = input("Proceed with REAL DOGE purchase? (yes/no): ").lower().strip()
        
        if confirm != 'yes':
            print("⏸️ Order cancelled by user")
            return False
        
        # Place the market buy order
        print("\n🚀 Placing order...")
        order = binance.create_market_buy_order(symbol, doge_quantity)
        
        print("\n🎉 REAL DOGE ORDER PLACED SUCCESSFULLY!")
        print("="*60)
        print(f"🆔 Order ID: {order['id']}")
        print(f"📊 Symbol: {order['symbol']}")
        print(f"💰 Amount: {order['amount']} DOGE")
        print(f"📈 Status: {order['status']}")
        print(f"💵 Cost: ~${order_value_usdt} USDT")
        print(f"⏰ Time: {order.get('datetime', 'Unknown')}")
        print("="*60)
        
        print("\n✅ SUCCESS! CHECK YOUR BINANCE ACCOUNT!")
        print("🔍 You should now see:")
        print("   📈 This order in Order History")
        print("   💰 Reduced USDT balance")
        print("   🐕 Increased DOGE balance")
        print("   📊 Trade in Trade History")
        
        # Get updated balance
        try:
            new_balance = binance.fetch_balance()
            new_usdt = new_balance.get('USDT', {}).get('free', 0)
            new_doge = new_balance.get('DOGE', {}).get('free', 0)
            
            print(f"\n📊 Updated Balances:")
            print(f"   💰 USDT: {usdt_balance:.2f} → {new_usdt:.2f} (Change: {new_usdt - usdt_balance:.2f})")
            print(f"   🐕 DOGE: {doge_balance:.2f} → {new_doge:.2f} (Change: {new_doge - doge_balance:.2f})")
            
        except Exception as balance_error:
            print(f"⚠️ Could not fetch updated balance: {balance_error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Order placement failed: {e}")
        print("\n🔧 Possible reasons:")
        print("   1. API keys don't have trading permissions")
        print("   2. Insufficient balance")
        print("   3. Order size too small")
        print("   4. Network connectivity issue")
        print("   5. Binance API rate limits")
        
        return False

def main():
    """Main function"""
    print("=" * 80)
    print("🔴 REAL DOGE ORDER PLACEMENT")
    print("🎯 This will use your LIVE Binance account!")
    print("=" * 80)
    
    if place_real_doge_order():
        print("\n🎉 MISSION ACCOMPLISHED!")
        print("✅ Real DOGE order placed on your Binance account")
        print("🔍 Check your Binance app/website to confirm")
        print("\n🚀 Your AI trading system can now place REAL orders!")
    else:
        print("\n❌ ORDER FAILED")
        print("🔧 Check the errors above and try again")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
