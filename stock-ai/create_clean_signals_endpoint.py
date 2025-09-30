#!/usr/bin/env python3
"""
🔧 CREATE CLEAN SIGNALS ENDPOINT
Create a clean, working version of the live signals endpoint
"""

def create_clean_endpoint():
    """Create a clean live signals endpoint"""
    
    endpoint_code = '''
@app.route('/api/live-signals')
def api_live_signals():
    """Get live trading signals - COMPREHENSIVE VERSION"""
    
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated', 'success': False})
    
    try:
        signals = []
        
        # Try to get comprehensive live data
        try:
            import sys
            import os
            
            # Add paths for imports
            current_dir = os.path.dirname(os.path.abspath(__file__))
            project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
            data_dir = os.path.join(project_root, 'src', 'data')
            strategies_dir = os.path.join(project_root, 'src', 'strategies')
            
            if data_dir not in sys.path:
                sys.path.insert(0, data_dir)
            if strategies_dir not in sys.path:
                sys.path.insert(0, strategies_dir)
            
            # Import modules
            from comprehensive_market_data import get_comprehensive_live_data
            from real_trading_strategies import generate_strategy_signal
            
            # Get live data
            live_data = get_comprehensive_live_data(limit=50)
            
            for symbol, market_data in live_data.items():
                if market_data and 'current_price' in market_data:
                    try:
                        # Generate strategy signal
                        strategy_result = generate_strategy_signal(symbol, market_data)
                        
                        signal_type = strategy_result.get('signal', 'HOLD')
                        strength = strategy_result.get('strength', 75)
                        reasoning = strategy_result.get('reasoning', 'Multi-strategy analysis')
                        
                        # Calculate target price
                        current_price = market_data['current_price']
                        if signal_type == 'BUY':
                            target_price = current_price * 1.02
                        elif signal_type == 'SELL':
                            target_price = current_price * 0.98
                        else:
                            target_price = current_price
                        
                        signals.append({
                            'symbol': symbol,
                            'signal': signal_type,
                            'signal_icon': '🟢' if signal_type == 'BUY' else ('🔴' if signal_type == 'SELL' else '🟡'),
                            'strength': int(strength),
                            'confidence': int(strength),
                            'reasoning': reasoning,
                            'current_price': current_price,
                            'target_price': target_price,
                            'name': market_data.get('name', symbol),
                            'exchange': market_data.get('exchange', 'Live'),
                            'timestamp': market_data.get('timestamp', datetime.now().isoformat()),
                            'volume': market_data.get('volume', 0),
                            'price_change_pct': market_data.get('price_change_pct', 0),
                            'real_data': True,
                            'data_source': market_data.get('source', 'comprehensive_market_data')
                        })
                        
                    except Exception as strategy_error:
                        # Skip this symbol if strategy fails
                        continue
            
            # If we got signals, return them
            if signals:
                return jsonify({
                    'signals': signals,
                    'success': True,
                    'count': len(signals),
                    'source': 'comprehensive_real_data'
                })
        
        except Exception as comprehensive_error:
            # Log the error but continue to fallback
            print(f"Comprehensive data error: {comprehensive_error}")
        
        # Fallback: Generate diverse demo signals
        import random
        from datetime import datetime
        
        demo_instruments = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
            'BTC-USD', 'ETH-USD', 'BNB-USD', 'ADA-USD', 'SOL-USD',
            'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS'
        ]
        
        signal_types = ['BUY', 'SELL', 'HOLD']
        
        for i, instrument in enumerate(demo_instruments):
            signal_type = signal_types[i % 3]  # Ensure diversity
            
            if '-USD' in instrument:
                base_price = random.uniform(1000, 70000) if 'BTC' in instrument else random.uniform(100, 5000)
            elif '.NS' in instrument:
                base_price = random.uniform(1500, 4000)
            else:
                base_price = random.uniform(100, 500)
            
            signals.append({
                'symbol': instrument,
                'signal': signal_type,
                'signal_icon': '🟢' if signal_type == 'BUY' else ('🔴' if signal_type == 'SELL' else '🟡'),
                'strength': random.randint(70, 95),
                'confidence': random.randint(75, 98),
                'reasoning': f'Demo {signal_type.lower()} signal for testing',
                'current_price': base_price,
                'target_price': base_price * (1.02 if signal_type == 'BUY' else 0.98 if signal_type == 'SELL' else 1.0),
                'name': instrument.replace('-USD', '').replace('.NS', ' Ltd'),
                'exchange': 'Demo',
                'timestamp': datetime.now().isoformat(),
                'volume': random.randint(100000, 10000000),
                'price_change_pct': random.uniform(-3, 3),
                'real_data': False,
                'data_source': 'demo_fallback'
            })
        
        return jsonify({
            'signals': signals,
            'success': True,
            'count': len(signals),
            'source': 'demo_fallback'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'signals': [],
            'success': False
        })
'''
    
    return endpoint_code

def main():
    """Main function"""
    print("🔧 CREATING CLEAN SIGNALS ENDPOINT")
    print("=" * 50)
    
    endpoint_code = create_clean_endpoint()
    
    print("✅ Clean endpoint code created")
    print("📋 Code length:", len(endpoint_code), "characters")
    print("🔧 Ready to replace the existing endpoint")

if __name__ == "__main__":
    main()
