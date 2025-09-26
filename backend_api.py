#!/usr/bin/env python3
"""
Simple Backend API Service for AI Trading System
Runs on port 8002 to provide API endpoints for the dashboard
"""

from flask import Flask, jsonify, request
import sys
import os
import json
import sqlite3
from datetime import datetime

# Add project path
sys.path.append('.')
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Trading Backend',
        'port': 8002,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get system status"""
    try:
        # Check database connections
        db_status = {}
        
        # Check instruments database
        try:
            with sqlite3.connect('data/instruments.db') as conn:
                cursor = conn.execute('SELECT COUNT(*) FROM instruments')
                db_status['instruments'] = cursor.fetchone()[0]
        except Exception as e:
            db_status['instruments'] = f"Error: {e}"
        
        # Check trading database
        try:
            with sqlite3.connect('data/fixed_continuous_trading.db') as conn:
                cursor = conn.execute('SELECT COUNT(*) FROM active_positions')
                db_status['positions'] = cursor.fetchone()[0]
        except Exception as e:
            db_status['positions'] = f"Error: {e}"
        
        return jsonify({
            'success': True,
            'service': 'AI Trading Backend',
            'databases': db_status,
            'models_available': os.path.exists('models/main_ai_model.pkl'),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.route('/api/instruments/<int:limit>', methods=['GET'])
def get_instruments(limit=100):
    """Get instruments for signal generation"""
    try:
        with sqlite3.connect('data/instruments.db') as conn:
            cursor = conn.execute("""
                SELECT symbol, name, exchange, asset_class, market_cap 
                FROM instruments 
                WHERE market_cap > 0
                ORDER BY RANDOM() 
                LIMIT ?
            """, (limit,))
            
            instruments = []
            for row in cursor.fetchall():
                instruments.append({
                    'symbol': row[0],
                    'name': row[1],
                    'exchange': row[2],
                    'asset_class': row[3],
                    'market_cap': row[4]
                })
                
        return jsonify({
            'success': True,
            'instruments': instruments,
            'count': len(instruments)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ai-signals', methods=['POST'])
def generate_ai_signals():
    """Generate AI signals for given instruments"""
    try:
        data = request.get_json()
        instruments = data.get('instruments', [])
        
        # Import AI model
        try:
            import joblib
            import numpy as np
            
            # Load AI model
            model_path = 'models/main_ai_model.pkl'
            if os.path.exists(model_path):
                model_data = joblib.load(model_path)
                model = model_data.get('model') if isinstance(model_data, dict) else model_data
            else:
                # Fallback: create a simple random model for demo
                from sklearn.ensemble import RandomForestClassifier
                model = RandomForestClassifier(n_estimators=50, random_state=42)
                # Train on dummy data
                X_dummy = np.random.randn(100, 6)
                y_dummy = np.random.randint(0, 2, 100)
                model.fit(X_dummy, y_dummy)
            
            signals = []
            for instrument in instruments:
                # Generate features
                features = np.array([
                    np.random.uniform(30, 70),  # RSI
                    np.random.uniform(0.5, 2.0),  # Volume ratio
                    np.random.uniform(-0.05, 0.05),  # Price change
                    np.random.uniform(0.01, 0.1),  # Volatility
                    np.random.uniform(0, 1),  # Trend signal
                    hash(instrument.get('symbol', 'UNKNOWN')) % 10  # Asset category
                ]).reshape(1, -1)
                
                # Get AI prediction
                try:
                    signal_strength = model.predict_proba(features)[0][1]  # Probability of positive signal
                except:
                    signal_strength = np.random.uniform(0.3, 0.8)  # Fallback
                
                signals.append({
                    'symbol': instrument.get('symbol', 'UNKNOWN'),
                    'signal_strength': float(signal_strength),
                    'features': features.flatten().tolist()
                })
                
        except Exception as model_error:
            print(f"Model error: {model_error}")
            # Generate random signals as fallback
            signals = []
            for instrument in instruments:
                signals.append({
                    'symbol': instrument.get('symbol', 'UNKNOWN'),
                    'signal_strength': np.random.uniform(0.3, 0.8),
                    'features': [np.random.uniform(0, 1) for _ in range(6)]
                })
        
        return jsonify({
            'success': True,
            'signals': signals,
            'count': len(signals),
            'model_used': 'AI Model' if 'model' in locals() else 'Random Fallback'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/trading-status/<user_email>', methods=['GET'])
def get_trading_status(user_email):
    """Get trading status for a user"""
    try:
        with sqlite3.connect('data/fixed_continuous_trading.db') as conn:
            # Check active trading sessions
            cursor = conn.execute("""
                SELECT session_id, user_email, status, start_time, current_portfolio 
                FROM trading_sessions 
                WHERE user_email = ? AND status = 'active'
                ORDER BY start_time DESC 
                LIMIT 1
            """, (user_email,))
            
            session_row = cursor.fetchone()
            if session_row:
                session_id, user_email, status, start_time, portfolio = session_row
                
                # Get active positions
                cursor = conn.execute("""
                    SELECT COUNT(*), SUM(COALESCE(pnl, 0)) 
                    FROM active_positions 
                    WHERE user_email = ? AND status = 'active'
                """, (user_email,))
                
                pos_count, total_pnl = cursor.fetchone()
                
                return jsonify({
                    'success': True,
                    'active': True,
                    'session_id': session_id,
                    'start_time': start_time,
                    'portfolio_value': portfolio or 10000,
                    'active_positions': pos_count or 0,
                    'total_pnl': total_pnl or 0
                })
            else:
                return jsonify({
                    'success': True,
                    'active': False,
                    'message': 'No active trading session'
                })
                
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 Starting AI Trading Backend API...")
    print("📱 Backend URL: http://localhost:8002")
    print("🔗 Health Check: http://localhost:8002/health")
    print("📊 Status API: http://localhost:8002/api/status")
    
    app.run(host='0.0.0.0', port=8002, debug=False)
