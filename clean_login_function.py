@app.route('/api/login', methods=['POST'])
def api_login():
    """Handle user login - ONLY authenticate existing users"""
    try:
        # Handle both JSON and form data
        if request.content_type == 'application/json':
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        email = data.get('email', '')
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            })
        
        # Authenticate user from database - ONLY authenticate, never create
        user_id = None
        user_found = False
        user_exists = False
        
        try:
            # Use the correct database (users.db in current directory)
            db_conn = sqlite3.connect('users.db')
            cursor = db_conn.cursor()
            
            # Look up user by email
            cursor.execute("SELECT user_id, password_hash FROM users WHERE email = ? AND is_active = 1", (email,))
            user_result = cursor.fetchone()
            
            if user_result:
                stored_user_id, stored_password = user_result
                user_exists = True  # User exists in database
                
                # Check password (both plain text and hashed)
                import hashlib
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                if password == stored_password or password_hash == stored_password:
                    user_id = stored_user_id
                    user_found = True
                    
                    # Update last login
                    cursor.execute("UPDATE users SET last_login = datetime('now') WHERE user_id = ?", (user_id,))
                    db_conn.commit()
            
            db_conn.close()
            
        except Exception as e:
            print(f"⚠️ Database error during authentication: {e}")
            return jsonify({
                'success': False,
                'error': 'Database connection error. Please try again.'
            })
        
        if user_exists and not user_found:
            # User exists but wrong password
            return jsonify({
                'success': False,
                'error': 'Invalid email or password. Please check your credentials.'
            })
        elif not user_exists:
            # User doesn't exist
            return jsonify({
                'success': False,
                'error': 'Account not found. Please sign up first or check your email address.'
            })
        
        # User authenticated successfully
        if user_found:
            # Generate session data
            user_token = f"token_{int(time.time())}"
            
            # Set session data
            session['user_token'] = user_token
            session['user_id'] = user_id
            session['user_email'] = email
            session.permanent = True
            
            # Load trading mode preference
            try:
                trading_mode = 'TESTNET'  # Default
                db_conn = sqlite3.connect('users.db')
                cursor = db_conn.cursor()
                cursor.execute("SELECT trading_mode FROM user_trading_modes WHERE user_id = ?", (user_id,))
                row = cursor.fetchone()
                if row:
                    trading_mode = row[0]
                db_conn.close()
            except Exception as e:
                print(f"⚠️ Failed to load trading mode, defaulting to TESTNET: {e}")
                trading_mode = 'TESTNET'
            
            session['trading_mode'] = trading_mode
            
            print(f"🔐 User logged in: {email}, ID: {user_id}, Mode: {trading_mode}")
            print(f"🔧 Session keys set: {list(session.keys())}")
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'token': user_token,
                'user_id': user_id,
                'user': {
                    'id': user_id,
                    'email': email
                },
                'redirect_url': '/dashboard'
            })
    
    except Exception as e:
        print(f"⚠️ Unexpected error in login: {e}")
        return jsonify({
            'success': False,
            'error': 'An unexpected error occurred. Please try again.'
        })
