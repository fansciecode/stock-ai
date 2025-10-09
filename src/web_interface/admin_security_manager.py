#!/usr/bin/env python3
"""
Admin Security Manager for AI Trading Platform
Handles admin controls, fraud detection, and user lifecycle management
"""

import sqlite3
import json
import uuid
import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import re
import requests

class AdminSecurityManager:
    def __init__(self):
        self.db_path = '../../data/admin_security.db'
        self._create_tables()
        
        # Security settings
        self.max_accounts_per_device = 2
        self.max_accounts_per_ip = 5
        self.fraud_score_threshold = 75
        self.admin_api_key = 'admin_secure_key_2024'
    
    def _create_tables(self):
        """Create admin and security tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Admin users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_users (
                admin_id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'ADMIN',  -- SUPER_ADMIN, ADMIN, MODERATOR
                permissions TEXT,  -- JSON: ["user_management", "fraud_detection", "payments"]
                is_active BOOLEAN DEFAULT 1,
                last_login TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # User device fingerprints for fraud detection
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS device_fingerprints (
                fingerprint_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                device_hash TEXT NOT NULL,  -- Browser, OS, Screen resolution hash
                ip_address TEXT NOT NULL,
                user_agent TEXT,
                timezone TEXT,
                language TEXT,
                screen_resolution TEXT,
                browser_fingerprint TEXT,  -- Canvas, WebGL, Audio fingerprint
                first_seen TEXT NOT NULL,
                last_seen TEXT NOT NULL,
                total_logins INTEGER DEFAULT 1,
                is_suspicious BOOLEAN DEFAULT 0
            )
        """)
        
        # Deleted/banned accounts tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS deleted_accounts (
                deleted_id TEXT PRIMARY KEY,
                original_user_id TEXT NOT NULL,
                email TEXT NOT NULL,
                phone_hash TEXT,  -- Hashed phone number
                device_hash TEXT NOT NULL,
                ip_address TEXT NOT NULL,
                deletion_reason TEXT NOT NULL,  -- FRAUD, PAYMENT_ABUSE, VIOLATION
                deleted_by TEXT NOT NULL,  -- admin_id who deleted
                lifetime_earnings REAL DEFAULT 0.0,
                lifetime_payments REAL DEFAULT 0.0,
                account_age_days INTEGER DEFAULT 0,
                deletion_date TEXT NOT NULL,
                fraud_score INTEGER DEFAULT 0,
                is_banned BOOLEAN DEFAULT 0  -- Permanent ban vs temporary deletion
            )
        """)
        
        # Fraud detection logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fraud_detection_logs (
                fraud_id TEXT PRIMARY KEY,
                user_id TEXT,
                detection_type TEXT NOT NULL,  -- DUPLICATE_DEVICE, IP_ABUSE, PAYMENT_PATTERN
                fraud_score INTEGER NOT NULL,
                evidence TEXT,  -- JSON with evidence details
                action_taken TEXT,  -- FLAGGED, SUSPENDED, BANNED
                admin_reviewed BOOLEAN DEFAULT 0,
                admin_notes TEXT,
                detected_at TEXT NOT NULL,
                reviewed_at TEXT,
                reviewed_by TEXT
            )
        """)
        
        # Payment pattern analysis
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payment_patterns (
                pattern_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                payment_sequence TEXT,  -- JSON: Pattern of payment behaviors
                profit_pattern TEXT,  -- JSON: Pattern of reported profits
                suspension_pattern TEXT,  -- JSON: Pattern of account suspensions
                risk_score INTEGER DEFAULT 0,
                pattern_type TEXT,  -- LEGITIMATE, SUSPICIOUS, FRAUDULENT
                last_updated TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # User verification records
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_verification (
                verification_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                verification_type TEXT NOT NULL,  -- EMAIL, PHONE, DOCUMENT, BANK
                verification_status TEXT NOT NULL,  -- PENDING, VERIFIED, FAILED
                verification_data TEXT,  -- JSON with verification details
                document_hash TEXT,  -- Hash of uploaded documents
                verification_date TEXT,
                expires_at TEXT,
                verified_by TEXT  -- admin_id if manually verified
            )
        """)
        
        # Lifetime user control (prevents re-registration)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS lifetime_bans (
                ban_id TEXT PRIMARY KEY,
                identifier_hash TEXT NOT NULL UNIQUE,  -- Hash of email+phone+device
                ban_type TEXT NOT NULL,  -- EMAIL, DEVICE, IP, GLOBAL
                ban_reason TEXT NOT NULL,
                banned_by TEXT NOT NULL,  -- admin_id
                ban_date TEXT NOT NULL,
                expires_at TEXT,  -- NULL for permanent bans
                is_active BOOLEAN DEFAULT 1
            )
        """)
        
        conn.commit()
        conn.close()
    
    def create_admin_user(self, username: str, email: str, password: str, 
                         role: str = 'ADMIN', permissions: List[str] = None) -> Dict:
        """Create a new admin user"""
        try:
            admin_id = str(uuid.uuid4())
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            if permissions is None:
                permissions = ['user_management', 'fraud_detection', 'payments', 'analytics']
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO admin_users 
                (admin_id, username, email, password_hash, role, permissions)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (admin_id, username, email, password_hash, role, json.dumps(permissions)))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Created admin user: {username} ({role})")
            return {
                'success': True,
                'admin_id': admin_id,
                'username': username,
                'role': role
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def authenticate_admin(self, username: str, password: str) -> Dict:
        """Authenticate admin user"""
        try:
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT admin_id, username, email, role, permissions, is_active
                FROM admin_users
                WHERE username = ? AND password_hash = ? AND is_active = 1
            """, (username, password_hash))
            
            result = cursor.fetchone()
            
            if result:
                admin_id, username, email, role, permissions, is_active = result
                
                # Update last login
                cursor.execute("""
                    UPDATE admin_users SET last_login = ? WHERE admin_id = ?
                """, (datetime.now().isoformat(), admin_id))
                
                conn.commit()
                conn.close()
                
                return {
                    'success': True,
                    'admin_id': admin_id,
                    'username': username,
                    'email': email,
                    'role': role,
                    'permissions': json.loads(permissions)
                }
            else:
                conn.close()
                return {'success': False, 'error': 'Invalid credentials'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def capture_device_fingerprint(self, user_id: str, request_data: Dict) -> str:
        """Capture and store device fingerprint for fraud detection"""
        try:
            # Create device hash from multiple factors
            device_components = [
                request_data.get('user_agent', ''),
                request_data.get('screen_resolution', ''),
                request_data.get('timezone', ''),
                request_data.get('language', ''),
                request_data.get('platform', ''),
                request_data.get('browser_fingerprint', ''),
                request_data.get('canvas_fingerprint', ''),
                request_data.get('webgl_fingerprint', '')
            ]
            
            device_string = '|'.join(device_components)
            device_hash = hashlib.sha256(device_string.encode()).hexdigest()
            
            fingerprint_id = str(uuid.uuid4())
            ip_address = request_data.get('ip_address', 'unknown')
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if device already exists
            cursor.execute("""
                SELECT fingerprint_id, total_logins FROM device_fingerprints
                WHERE device_hash = ? AND user_id = ?
            """, (device_hash, user_id))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing fingerprint
                cursor.execute("""
                    UPDATE device_fingerprints 
                    SET last_seen = ?, total_logins = total_logins + 1
                    WHERE fingerprint_id = ?
                """, (datetime.now().isoformat(), existing[0]))
            else:
                # Create new fingerprint
                cursor.execute("""
                    INSERT INTO device_fingerprints 
                    (fingerprint_id, user_id, device_hash, ip_address, user_agent,
                     timezone, language, screen_resolution, browser_fingerprint,
                     first_seen, last_seen)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (fingerprint_id, user_id, device_hash, ip_address,
                      request_data.get('user_agent', ''),
                      request_data.get('timezone', ''),
                      request_data.get('language', ''),
                      request_data.get('screen_resolution', ''),
                      request_data.get('browser_fingerprint', ''),
                      datetime.now().isoformat(),
                      datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            return device_hash
            
        except Exception as e:
            print(f"❌ Error capturing device fingerprint: {e}")
            return ""
    
    def detect_fraud_patterns(self, user_id: str, device_hash: str, ip_address: str) -> Dict:
        """Detect fraud patterns for new user registration"""
        fraud_score = 0
        evidence = []
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check 1: Device used by multiple accounts
            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) FROM device_fingerprints
                WHERE device_hash = ?
            """, (device_hash,))
            
            device_user_count = cursor.fetchone()[0]
            
            if device_user_count > self.max_accounts_per_device:
                fraud_score += 30
                evidence.append(f"Device used by {device_user_count} accounts (max: {self.max_accounts_per_device})")
            
            # Check 2: IP address abuse
            cursor.execute("""
                SELECT COUNT(DISTINCT user_id) FROM device_fingerprints
                WHERE ip_address = ? AND first_seen > ?
            """, (ip_address, (datetime.now() - timedelta(days=7)).isoformat()))
            
            ip_user_count = cursor.fetchone()[0]
            
            if ip_user_count > self.max_accounts_per_ip:
                fraud_score += 25
                evidence.append(f"IP used by {ip_user_count} accounts in 7 days (max: {self.max_accounts_per_ip})")
            
            # Check 3: Deleted account patterns
            cursor.execute("""
                SELECT COUNT(*), AVG(fraud_score) FROM deleted_accounts
                WHERE device_hash = ? OR ip_address = ?
            """, (device_hash, ip_address))
            
            deleted_result = cursor.fetchone()
            deleted_count = deleted_result[0]
            avg_fraud_score = deleted_result[1] or 0
            
            if deleted_count > 0:
                fraud_score += min(40, deleted_count * 15)
                evidence.append(f"{deleted_count} deleted accounts from this device/IP (avg fraud score: {avg_fraud_score:.1f})")
            
            # Check 4: Banned identifiers
            device_ban_hash = hashlib.sha256(f"device:{device_hash}".encode()).hexdigest()
            ip_ban_hash = hashlib.sha256(f"ip:{ip_address}".encode()).hexdigest()
            
            cursor.execute("""
                SELECT ban_reason FROM lifetime_bans
                WHERE identifier_hash IN (?, ?) AND is_active = 1
            """, (device_ban_hash, ip_ban_hash))
            
            ban_result = cursor.fetchone()
            
            if ban_result:
                fraud_score = 100
                evidence.append(f"Device/IP is permanently banned: {ban_result[0]}")
            
            # Check 5: Suspicious timing patterns
            cursor.execute("""
                SELECT first_seen FROM device_fingerprints
                WHERE ip_address = ?
                ORDER BY first_seen DESC LIMIT 5
            """, (ip_address,))
            
            recent_registrations = cursor.fetchall()
            
            if len(recent_registrations) >= 3:
                # Check if registrations are too close together
                times = [datetime.fromisoformat(r[0]) for r in recent_registrations]
                time_diffs = [(times[i] - times[i+1]).total_seconds() for i in range(len(times)-1)]
                
                if any(diff < 3600 for diff in time_diffs):  # Less than 1 hour apart
                    fraud_score += 20
                    evidence.append("Multiple registrations within 1 hour from same IP")
            
            conn.close()
            
            # Determine action based on fraud score
            if fraud_score >= 90:
                action = "BANNED"
                allowed = False
            elif fraud_score >= self.fraud_score_threshold:
                action = "FLAGGED"
                allowed = False
            elif fraud_score >= 40:
                action = "REVIEW_REQUIRED"
                allowed = True  # Allow but require verification
            else:
                action = "ALLOWED"
                allowed = True
            
            # Log fraud detection
            fraud_id = str(uuid.uuid4())
            self._log_fraud_detection(fraud_id, user_id, "REGISTRATION_CHECK", 
                                    fraud_score, evidence, action)
            
            return {
                'allowed': allowed,
                'fraud_score': fraud_score,
                'action': action,
                'evidence': evidence,
                'fraud_id': fraud_id,
                'verification_required': action == "REVIEW_REQUIRED"
            }
            
        except Exception as e:
            print(f"❌ Fraud detection error: {e}")
            return {
                'allowed': True,
                'fraud_score': 0,
                'action': "ERROR",
                'evidence': [f"Fraud detection failed: {e}"]
            }
    
    def _log_fraud_detection(self, fraud_id: str, user_id: str, detection_type: str,
                           fraud_score: int, evidence: List[str], action: str):
        """Log fraud detection event"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO fraud_detection_logs
                (fraud_id, user_id, detection_type, fraud_score, evidence, 
                 action_taken, detected_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (fraud_id, user_id, detection_type, fraud_score, 
                  json.dumps(evidence), action, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error logging fraud detection: {e}")
    
    def ban_user_permanently(self, user_id: str, ban_reason: str, admin_id: str,
                           ban_type: str = "GLOBAL") -> Dict:
        """Permanently ban a user and their identifiers"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get user details for banning
            cursor.execute("""
                SELECT email, user_id FROM users WHERE user_id = ?
            """, (user_id,))
            
            user_result = cursor.fetchone()
            if not user_result:
                return {'success': False, 'error': 'User not found'}
            
            email, user_id = user_result
            
            # Get device fingerprints
            cursor.execute("""
                SELECT device_hash, ip_address FROM device_fingerprints
                WHERE user_id = ?
            """, (user_id,))
            
            fingerprints = cursor.fetchall()
            
            # Create ban identifiers
            ban_identifiers = []
            
            # Email ban
            email_hash = hashlib.sha256(f"email:{email}".encode()).hexdigest()
            ban_identifiers.append(('EMAIL', email_hash))
            
            # Device and IP bans
            for device_hash, ip_address in fingerprints:
                device_ban_hash = hashlib.sha256(f"device:{device_hash}".encode()).hexdigest()
                ip_ban_hash = hashlib.sha256(f"ip:{ip_address}".encode()).hexdigest()
                
                ban_identifiers.append(('DEVICE', device_ban_hash))
                ban_identifiers.append(('IP', ip_ban_hash))
            
            # Global ban (combination of email + primary device)
            if fingerprints:
                global_identifier = f"global:{email}:{fingerprints[0][0]}"
                global_hash = hashlib.sha256(global_identifier.encode()).hexdigest()
                ban_identifiers.append(('GLOBAL', global_hash))
            
            # Insert bans
            for ban_type, identifier_hash in ban_identifiers:
                ban_id = str(uuid.uuid4())
                
                cursor.execute("""
                    INSERT OR REPLACE INTO lifetime_bans
                    (ban_id, identifier_hash, ban_type, ban_reason, banned_by, ban_date)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (ban_id, identifier_hash, ban_type, ban_reason, admin_id, 
                      datetime.now().isoformat()))
            
            # Move user to deleted accounts
            self._move_to_deleted_accounts(user_id, ban_reason, admin_id, fraud_score=100)
            
            # Disable user account
            cursor.execute("""
                UPDATE users SET is_active = 0 WHERE user_id = ?
            """, (user_id,))
            
            # Suspend subscription
            cursor.execute("""
                UPDATE subscriptions SET status = 'BANNED' WHERE user_id = ?
            """, (user_id,))
            
            conn.commit()
            conn.close()
            
            print(f"🚫 Permanently banned user {user_id}: {ban_reason}")
            
            return {
                'success': True,
                'banned_identifiers': len(ban_identifiers),
                'ban_types': [bt for bt, _ in ban_identifiers]
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def check_registration_allowed(self, email: str, device_hash: str, ip_address: str) -> Dict:
        """Check if registration is allowed for given identifiers"""
        try:
            # Create identifier hashes
            email_hash = hashlib.sha256(f"email:{email}".encode()).hexdigest()
            device_ban_hash = hashlib.sha256(f"device:{device_hash}".encode()).hexdigest()
            ip_ban_hash = hashlib.sha256(f"ip:{ip_address}".encode()).hexdigest()
            global_hash = hashlib.sha256(f"global:{email}:{device_hash}".encode()).hexdigest()
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check for active bans
            cursor.execute("""
                SELECT ban_type, ban_reason, ban_date FROM lifetime_bans
                WHERE identifier_hash IN (?, ?, ?, ?) AND is_active = 1
            """, (email_hash, device_ban_hash, ip_ban_hash, global_hash))
            
            ban_result = cursor.fetchone()
            
            if ban_result:
                ban_type, ban_reason, ban_date = ban_result
                conn.close()
                
                return {
                    'allowed': False,
                    'reason': f'Account creation blocked: {ban_reason}',
                    'ban_type': ban_type,
                    'ban_date': ban_date
                }
            
            conn.close()
            return {'allowed': True}
            
        except Exception as e:
            return {'allowed': True, 'error': str(e)}  # Allow on error
    
    def _move_to_deleted_accounts(self, user_id: str, reason: str, admin_id: str, fraud_score: int = 0):
        """Move user account to deleted accounts table"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get user data
            cursor.execute("""
                SELECT email, created_at FROM users WHERE user_id = ?
            """, (user_id,))
            
            user_data = cursor.fetchone()
            if not user_data:
                return
            
            email, created_at = user_data
            
            # Calculate account age
            created_date = datetime.fromisoformat(created_at)
            account_age = (datetime.now() - created_date).days
            
            # Get device hash
            cursor.execute("""
                SELECT device_hash, ip_address FROM device_fingerprints
                WHERE user_id = ? LIMIT 1
            """, (user_id,))
            
            device_data = cursor.fetchone()
            device_hash = device_data[0] if device_data else ""
            ip_address = device_data[1] if device_data else ""
            
            # Get financial data
            cursor.execute("""
                SELECT SUM(amount) FROM payments
                WHERE user_id = ? AND payment_status = 'SUCCESS'
            """, (user_id,))
            
            total_payments = cursor.fetchone()[0] or 0.0
            
            # Insert into deleted accounts
            deleted_id = str(uuid.uuid4())
            
            cursor.execute("""
                INSERT INTO deleted_accounts
                (deleted_id, original_user_id, email, device_hash, ip_address,
                 deletion_reason, deleted_by, lifetime_payments, account_age_days,
                 deletion_date, fraud_score, is_banned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (deleted_id, user_id, email, device_hash, ip_address,
                  reason, admin_id, total_payments, account_age,
                  datetime.now().isoformat(), fraud_score, True))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error moving to deleted accounts: {e}")
    
    def get_admin_dashboard_data(self, admin_id: str) -> Dict:
        """Get admin dashboard data"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Fraud detection stats
            cursor.execute("""
                SELECT COUNT(*), AVG(fraud_score) FROM fraud_detection_logs
                WHERE detected_at > ?
            """, ((datetime.now() - timedelta(days=30)).isoformat(),))
            
            fraud_stats = cursor.fetchone()
            
            # User verification stats
            cursor.execute("""
                SELECT verification_status, COUNT(*) FROM user_verification
                GROUP BY verification_status
            """, )
            
            verification_stats = dict(cursor.fetchall())
            
            # Banned accounts
            cursor.execute("""
                SELECT COUNT(*) FROM lifetime_bans WHERE is_active = 1
            """)
            
            banned_count = cursor.fetchone()[0]
            
            # Recent fraud alerts
            cursor.execute("""
                SELECT fraud_id, user_id, detection_type, fraud_score, action_taken, detected_at
                FROM fraud_detection_logs
                WHERE admin_reviewed = 0 AND fraud_score >= ?
                ORDER BY detected_at DESC LIMIT 10
            """, (self.fraud_score_threshold,))
            
            recent_alerts = cursor.fetchall()
            
            conn.close()
            
            return {
                'success': True,
                'fraud_detections_30d': fraud_stats[0] or 0,
                'avg_fraud_score': fraud_stats[1] or 0,
                'verification_stats': verification_stats,
                'banned_accounts': banned_count,
                'pending_reviews': len(recent_alerts),
                'recent_alerts': [
                    {
                        'fraud_id': alert[0],
                        'user_id': alert[1],
                        'type': alert[2],
                        'score': alert[3],
                        'action': alert[4],
                        'detected_at': alert[5]
                    } for alert in recent_alerts
                ]
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def grant_lifetime_access(self, user_id: str, admin_id: str, reason: str = "Admin Grant") -> Dict:
        """Grant lifetime access to a user (VIP treatment)"""
        try:
            from subscription_manager import subscription_manager
            
            # Create special lifetime subscription
            result = subscription_manager.create_subscription(
                user_id=user_id,
                user_email="",  # Will be filled from user table
                tier='LIFETIME'
            )
            
            # Log the action
            print(f"✅ Granted lifetime access to user {user_id} by admin {admin_id}: {reason}")
            
            return {
                'success': True,
                'message': f'Lifetime access granted: {reason}'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Global instance
admin_security = AdminSecurityManager()

# Create default super admin if not exists
try:
    admin_security.create_admin_user(
        username='superadmin',
        email='admin@aitradingplatform.com',
        password='Admin123!SecurePass',
        role='SUPER_ADMIN',
        permissions=['user_management', 'fraud_detection', 'payments', 'analytics', 'system_control']
    )
except:
    pass  # Admin already exists
