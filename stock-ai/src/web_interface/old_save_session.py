    def _save_session_to_db(self, session_data: Dict) -> int:
        """Save session data to database"""
        try:
            # Connect to the database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if session already exists
            if 'id' in session_data:
                # Update existing session
                cursor.execute(
                    "UPDATE trading_sessions SET is_active=1, trading_mode=?, session_token=? WHERE id=?",
                    (session_data['trading_mode'], session_data.get('session_token', ''), session_data['id'])
                )
                session_id = session_data['id']
            else:
                # Insert new session
                cursor.execute(
                    "INSERT INTO trading_sessions (user_email, start_time, is_active, trading_mode, session_token) VALUES (?, ?, 1, ?, ?)",
                    (session_data['user_email'], session_data['start_time'], session_data['trading_mode'], session_data.get('session_token', ''))
                )
                session_id = cursor.lastrowid
            
            # Commit changes and close connection
            conn.commit()
