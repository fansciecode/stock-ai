#!/usr/bin/env python3
"""
🔐 USER MANAGEMENT SERVICE
Multi-user support with secure API key management
"""

import os
import json
import hashlib
import secrets
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from cryptography.fernet import Fernet
import logging

class UserManager:
    """Manages users, their API keys, and permissions"""
    
    def __init__(self, db_path='data/users.db'):
        self.db_path = db_path
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher = Fernet(self.encryption_key)
        self._init_database()
        
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for API keys"""
        key_file = 'data/encryption.key'
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            # Create new encryption key
            key = Fernet.generate_key()
            os.makedirs('data', exist_ok=True)
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
            
    def _init_database(self):
        """Initialize user database"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP,
                    subscription_tier TEXT DEFAULT 'basic',
                    is_active BOOLEAN DEFAULT 1
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS api_keys (
                    key_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    exchange TEXT,
                    api_key TEXT,
                    secret_key TEXT,
                    passphrase TEXT,
                    is_testnet BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_permissions (
                    user_id TEXT,
                    exchange TEXT,
                    max_instruments INTEGER DEFAULT 10,
                    max_daily_trades INTEGER DEFAULT 5,
                    max_position_size REAL DEFAULT 100.0,
                    can_live_trade BOOLEAN DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
    def create_user(self, email: str, password: str, subscription_tier: str = 'basic') -> Tuple[str, bool]:
        """Create a new user account"""
        try:
            user_id = secrets.token_urlsafe(16)
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT INTO users (user_id, email, password_hash, subscription_tier)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, email, password_hash, subscription_tier))
                
                # Set default permissions based on subscription tier
                permissions = self._get_default_permissions(subscription_tier)
                conn.execute('''
                    INSERT INTO user_permissions 
                    (user_id, exchange, max_instruments, max_daily_trades, max_position_size, can_live_trade)
                    VALUES (?, 'all', ?, ?, ?, ?)
                ''', (user_id, permissions['max_instruments'], permissions['max_daily_trades'],
                      permissions['max_position_size'], permissions['can_live_trade']))
                
            return user_id, True
            
        except sqlite3.IntegrityError:
            return None, False
            
    def authenticate_user(self, email: str, password: str) -> Optional[str]:
        """Authenticate user and return user_id if successful"""
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute('''
                SELECT user_id FROM users 
                WHERE email = ? AND password_hash = ? AND is_active = 1
            ''', (email, password_hash))
            
            result = cursor.fetchone()
            if result:
                # Update last login
                conn.execute('''
                    UPDATE users SET last_login = CURRENT_TIMESTAMP 
                    WHERE user_id = ?
                ''', (result[0],))
                return result[0]
                
        return None
        
    def add_api_keys(self, user_id: str, exchange: str, api_key: str, 
                     secret_key: str, passphrase: str = None, is_testnet: bool = True) -> bool:
        """Add encrypted API keys for a user"""
        try:
            key_id = secrets.token_urlsafe(12)
            
            # Encrypt sensitive data
            encrypted_api_key = self.cipher.encrypt(api_key.encode()).decode()
            encrypted_secret_key = self.cipher.encrypt(secret_key.encode()).decode()
            encrypted_passphrase = None
            if passphrase:
                encrypted_passphrase = self.cipher.encrypt(passphrase.encode()).decode()
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT INTO api_keys 
                    (key_id, user_id, exchange, api_key, secret_key, passphrase, is_testnet)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (key_id, user_id, exchange, encrypted_api_key, encrypted_secret_key, 
                      encrypted_passphrase, is_testnet))
                
            return True
            
        except Exception as e:
            logging.error(f"Failed to add API keys: {e}")
            return False
            
    def get_api_keys(self, user_id: str, exchange: str = None) -> List[Dict]:
        """Get decrypted API keys for a user"""
        with sqlite3.connect(self.db_path) as conn:
            if exchange:
                cursor = conn.execute('''
                    SELECT key_id, exchange, api_key, secret_key, passphrase, is_testnet
                    FROM api_keys 
                    WHERE user_id = ? AND exchange = ? AND is_active = 1
                ''', (user_id, exchange))
            else:
                cursor = conn.execute('''
                    SELECT key_id, exchange, api_key, secret_key, passphrase, is_testnet
                    FROM api_keys 
                    WHERE user_id = ? AND is_active = 1
                ''', (user_id,))
                
            keys = []
            for row in cursor.fetchall():
                try:
                    # Decrypt sensitive data
                    api_key = self.cipher.decrypt(row[2].encode()).decode()
                    secret_key = self.cipher.decrypt(row[3].encode()).decode()
                    passphrase = None
                    if row[4]:
                        passphrase = self.cipher.decrypt(row[4].encode()).decode()
                        
                    keys.append({
                        'key_id': row[0],
                        'exchange': row[1],
                        'api_key': api_key,
                        'secret_key': secret_key,
                        'passphrase': passphrase,
                        'is_testnet': row[5]
                    })
                except Exception as e:
                    logging.error(f"Failed to decrypt keys: {e}")
                    
            return keys
            
    def get_user_permissions(self, user_id: str) -> Dict:
        """Get user permissions and limits"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute('''
                SELECT max_instruments, max_daily_trades, max_position_size, can_live_trade
                FROM user_permissions 
                WHERE user_id = ?
            ''', (user_id,))
            
            result = cursor.fetchone()
            if result:
                return {
                    'max_instruments': result[0],
                    'max_daily_trades': result[1],
                    'max_position_size': result[2],
                    'can_live_trade': bool(result[3])
                }
                
        return self._get_default_permissions('basic')
        
    def _get_default_permissions(self, subscription_tier: str) -> Dict:
        """Get default permissions based on subscription tier"""
        permissions = {
            'basic': {
                'max_instruments': 10,
                'max_daily_trades': 5,
                'max_position_size': 100.0,
                'can_live_trade': False
            },
            'pro': {
                'max_instruments': 100,
                'max_daily_trades': 50,
                'max_position_size': 1000.0,
                'can_live_trade': True
            },
            'enterprise': {
                'max_instruments': -1,  # Unlimited
                'max_daily_trades': -1,  # Unlimited
                'max_position_size': 10000.0,
                'can_live_trade': True
            }
        }
        
        return permissions.get(subscription_tier, permissions['basic'])
        
    def update_last_api_usage(self, user_id: str, exchange: str):
        """Update last API usage timestamp"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                UPDATE api_keys 
                SET last_used = CURRENT_TIMESTAMP 
                WHERE user_id = ? AND exchange = ?
            ''', (user_id, exchange))
            
    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics"""
        with sqlite3.connect(self.db_path) as conn:
            # Get user info
            cursor = conn.execute('''
                SELECT email, subscription_tier, created_at, last_login
                FROM users WHERE user_id = ?
            ''', (user_id,))
            
            user_info = cursor.fetchone()
            if not user_info:
                return {}
                
            # Get API keys count
            cursor = conn.execute('''
                SELECT COUNT(*) FROM api_keys 
                WHERE user_id = ? AND is_active = 1
            ''', (user_id,))
            
            api_keys_count = cursor.fetchone()[0]
            
            return {
                'email': user_info[0],
                'subscription_tier': user_info[1],
                'created_at': user_info[2],
                'last_login': user_info[3],
                'api_keys_count': api_keys_count,
                'permissions': self.get_user_permissions(user_id)
            }

class SessionManager:
    """Manages user sessions and authentication tokens"""
    
    def __init__(self):
        self.sessions = {}  # In production, use Redis
        
    def create_session(self, user_id: str) -> str:
        """Create a new session token"""
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=24)
        
        self.sessions[token] = {
            'user_id': user_id,
            'created_at': datetime.now(),
            'expires_at': expires_at,
            'last_activity': datetime.now()
        }
        
        return token
        
    def validate_session(self, token: str) -> Optional[str]:
        """Validate session token and return user_id"""
        if token not in self.sessions:
            return None
            
        session = self.sessions[token]
        
        # Check if session is expired
        if datetime.now() > session['expires_at']:
            del self.sessions[token]
            return None
            
        # Update last activity
        session['last_activity'] = datetime.now()
        return session['user_id']
        
    def destroy_session(self, token: str):
        """Destroy a session"""
        if token in self.sessions:
            del self.sessions[token]

# Global instances
user_manager = UserManager()
session_manager = SessionManager()

def get_user_by_session(token: str) -> Optional[str]:
    """Get user ID from session token"""
    return session_manager.validate_session(token)

def require_auth(func):
    """Decorator to require authentication"""
    def wrapper(*args, **kwargs):
        # Extract token from request headers
        # Implementation depends on your web framework
        pass
    return wrapper

if __name__ == "__main__":
    # Test the user management system
    um = UserManager()
    
    # Create test user
    user_id, success = um.create_user("test@example.com", "password123", "pro")
    if success:
        print(f"Created user: {user_id}")
        
        # Add API keys
        success = um.add_api_keys(
            user_id, 
            "binance", 
            "test_api_key", 
            "test_secret_key",
            is_testnet=True
        )
        
        if success:
            print("Added API keys successfully")
            
            # Get API keys
            keys = um.get_api_keys(user_id, "binance")
            print(f"Retrieved keys: {len(keys)}")
            
            # Get user stats
            stats = um.get_user_stats(user_id)
            print(f"User stats: {stats}")
    else:
        print("Failed to create user")
