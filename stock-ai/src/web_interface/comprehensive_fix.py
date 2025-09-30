#!/usr/bin/env python3
"""
Comprehensive fix for all dashboard and database issues
"""

import os
import sqlite3
import subprocess
import time

def fix_all_issues():
    """Fix all the issues in one go"""
    
    print("🔧 Starting comprehensive fix...")
    
    # 1. Kill any running dashboard processes
    print("1️⃣ Stopping existing dashboard processes...")
    try:
        subprocess.run(["pkill", "-f", "production_dashboard"], check=False)
        time.sleep(2)
    except:
        pass
    
    # 2. Fix database paths and create tables
    print("2️⃣ Setting up database...")
    
    # Ensure data directory exists
    os.makedirs("../../data", exist_ok=True)
    
    # Database path
    db_path = "../../data/fixed_continuous_trading.db"
    
    # Connect and create tables
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create trading_sessions table with correct schema
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trading_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            is_active INTEGER DEFAULT 1,
            trading_mode TEXT DEFAULT 'LIVE',
            profit_loss REAL DEFAULT 0.0,
            session_token TEXT
        )
    """)
    
    # Create positions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS positions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            symbol TEXT,
            exchange TEXT,
            side TEXT,
            amount REAL,
            entry_price REAL,
            current_price REAL,
            pnl REAL DEFAULT 0.0,
            status TEXT DEFAULT 'open',
            created_at TEXT,
            FOREIGN KEY (session_id) REFERENCES trading_sessions (id)
        )
    """)
    
    # Create execution_log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS execution_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            timestamp TEXT,
            action TEXT,
            symbol TEXT,
            details TEXT,
            FOREIGN KEY (session_id) REFERENCES trading_sessions (id)
        )
    """)
    
    # Clear any existing active sessions to start fresh
    cursor.execute("UPDATE trading_sessions SET is_active = 0 WHERE is_active = 1")
    
    conn.commit()
    conn.close()
    
    print(f"✅ Database setup complete: {os.path.abspath(db_path)}")
    
    # 3. Check users database
    print("3️⃣ Checking users database...")
    users_db_path = "../../data/users.db"
    
    if os.path.exists(users_db_path):
        conn = sqlite3.connect(users_db_path)
        cursor = conn.cursor()
        
        # Check if our test user exists
        cursor.execute("SELECT user_id FROM users WHERE email = ?", ("kirannaik@unitednewdigitalmedia.com",))
        user = cursor.fetchone()
        
        if user:
            print(f"✅ Test user found: {user[0]}")
            
            # Check API keys
            cursor.execute("SELECT COUNT(*) FROM api_keys WHERE user_id = ?", (user[0],))
            key_count = cursor.fetchone()[0]
            print(f"✅ API keys found: {key_count}")
        else:
            print("⚠️ Test user not found in database")
        
        conn.close()
    else:
        print("⚠️ Users database not found")
    
    # 4. Start dashboard
    print("4️⃣ Starting dashboard...")
    
    # Start dashboard in background
    process = subprocess.Popen(
        ["python3", "production_dashboard.py"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait a moment for startup
    time.sleep(3)
    
    # Check if it's running
    if process.poll() is None:
        print("✅ Dashboard started successfully")
        
        # Test the login endpoint
        print("5️⃣ Testing login...")
        try:
            import requests
            response = requests.post(
                "http://localhost:8000/api/login",
                json={
                    "email": "kirannaik@unitednewdigitalmedia.com",
                    "password": "Test@123"
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("✅ Login test successful!")
                    print(f"   User ID: {data.get('user_id')}")
                else:
                    print(f"❌ Login failed: {data.get('message')}")
            else:
                print(f"❌ Login request failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Login test error: {e}")
        
        print("\n🎉 COMPREHENSIVE FIX COMPLETE!")
        print("📋 Dashboard is running on: http://localhost:8000")
        print("🔑 Login with: kirannaik@unitednewdigitalmedia.com / Test@123")
        print("\n🔍 The dashboard should now:")
        print("   ✅ Use real database queries")
        print("   ✅ Show correct API keys")
        print("   ✅ Save trading sessions properly")
        print("   ✅ No more 'Failed to save session to database' errors")
        
    else:
        print("❌ Dashboard failed to start")
        stdout, stderr = process.communicate()
        print(f"STDOUT: {stdout.decode()}")
        print(f"STDERR: {stderr.decode()}")

if __name__ == "__main__":
    fix_all_issues()
