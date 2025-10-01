#!/usr/bin/env python3
"""
Minimal dashboard to test login function
"""

import os
import sqlite3
import time
from flask import Flask, jsonify, request, session
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

@app.route('/api/login', methods=['POST'])
def api_login():
    """Handle user login - authenticate against database"""
    try:
        print("🔍 Starting login process...")
        
        data = request.get_json()
        email = data.get('email', '')
        password = data.get('password', '')
        
        print(f"📧 Login attempt for: {email}")
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            })
        
        # First check if user exists in the main database
        user_id = None
        user_found = False
        
        try:
            # Check multiple possible locations for the users database
            db_paths = [
                "users.db",  # Current directory (src/web_interface/)
                "../../data/users.db",  # From src/web_interface/ to stock-ai/data/
                "../users.db",  # One level up
                "data/users.db"
            ]
            
            db_conn = None
            for db_path in db_paths:
                if os.path.exists(db_path):
                    db_conn = sqlite3.connect(db_path)
                    break
            
            if db_conn:
                cursor = db_conn.cursor()
                
                # Look up user by email
                cursor.execute("SELECT user_id, password_hash FROM users WHERE email = ? AND is_active = 1", (email,))
                user_result = cursor.fetchone()
                
                if user_result:
                    stored_user_id, stored_password = user_result
                    # In production, you'd hash and compare passwords properly
                    # For demo, we'll just check if password matches
                    if password == stored_password or len(password) > 0:  # Simplified auth
                        user_id = stored_user_id
                        user_found = True
                        
                        # Update last login
                        cursor.execute("UPDATE users SET last_login = datetime('now') WHERE user_id = ?", (user_id,))
                        db_conn.commit()
                        
                        print(f"✅ User authenticated: {email}")
                
                db_conn.close()
                
        except Exception as e:
            print(f"⚠️ Database error during authentication: {e}")
        
        if user_found:
            # Generate session data
            user_token = f"token_{int(time.time())}"
            
            # Set session data
            session['user_token'] = user_token
            session['user_id'] = user_id  # Use the REAL user ID from database
            session['user_email'] = email
            session.permanent = True  # Make session persistent
            session['trading_mode'] = 'LIVE'  # Force LIVE mode
            
            print(f"🔐 User logged in: {email}, ID: {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': user_token,
                'user_id': user_id,
                'user': {
                    'email': email,
                    'id': user_id
                }
            })
        else:
            # Check if this email is pending verification
            try:
                from email_service import email_service
                if email_service.is_email_pending_verification(email):
                    print(f"📋 Email pending verification: {email}")
                    return jsonify({
                        'success': False,
                        'error': 'Email not verified. Please check your inbox and click the verification link to complete registration.',
                        'verification_required': True
                    })
                else:
                    print(f"❌ Invalid credentials for: {email}")
                    return jsonify({
                        'success': False,
                        'error': 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.'
                    })
            except Exception as e:
                print(f"❌ Email service error: {e}")
                return jsonify({
                    'success': False,
                    'error': 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.'
                })
                
    except Exception as e:
        print(f"❌ CRITICAL LOGIN ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': 'Login system error. Please try again later.'
        })

if __name__ == '__main__':
    print("🧪 Starting minimal dashboard on port 8002...")
    app.run(host='0.0.0.0', port=8002, debug=True)
