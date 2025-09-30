#!/usr/bin/env python3
"""
Fix database schema issues for the trading engine
"""

import sqlite3
import os

def fix_database_schema():
    """Ensure the database schema matches what the code expects"""
    
    # Database path
    db_path = 'data/fixed_continuous_trading.db'
    
    # Ensure data directory exists
    os.makedirs('data', exist_ok=True)
    
    # Connect to database
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
    
    # Commit and close
    conn.commit()
    conn.close()
    
    print("✅ Database schema fixed successfully!")
    print(f"📁 Database location: {os.path.abspath(db_path)}")

if __name__ == "__main__":
    fix_database_schema()
