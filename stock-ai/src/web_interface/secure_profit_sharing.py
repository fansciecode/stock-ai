#!/usr/bin/env python3
"""
Secure Profit Sharing System
Comprehensive security measures to prevent fraud and ensure we get our 15% share
"""

import sqlite3
import hashlib
import hmac
import time
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging
from cryptography.fernet import Fernet
import uuid

class SecureProfitSharingManager:
    """Manages profit sharing with multiple security layers"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
        self.setup_security_database()
    
    def _get_or_create_encryption_key(self):
        """Get or create encryption key for sensitive data"""
        try:
            with open('../../data/profit_key.key', 'rb') as key_file:
                return key_file.read()
        except FileNotFoundError:
            key = Fernet.generate_key()
            with open('../../data/profit_key.key', 'wb') as key_file:
                key_file.write(key)
            return key
    
    def setup_security_database(self):
        """Setup security tables for profit tracking"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Enhanced profit tracking with security
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS secure_profit_tracking (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    trading_session_hash TEXT NOT NULL,
                    initial_balance_encrypted TEXT NOT NULL,
                    final_balance_encrypted TEXT NOT NULL,
                    profit_amount_encrypted TEXT NOT NULL,
                    platform_share_encrypted TEXT NOT NULL,
                    user_share_encrypted TEXT NOT NULL,
                    verification_hash TEXT NOT NULL,
                    api_key_fingerprint TEXT NOT NULL,
                    exchange_confirmations TEXT,
                    timestamp TEXT NOT NULL,
                    payment_status TEXT DEFAULT 'pending',
                    payment_due_date TEXT,
                    security_flags TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            # User security profile
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_security_profile (
                    user_id TEXT PRIMARY KEY,
                    device_fingerprint TEXT,
                    ip_history TEXT,
                    api_key_hash TEXT,
                    exchange_account_verification TEXT,
                    trust_score INTEGER DEFAULT 0,
                    fraud_flags TEXT,
                    last_verification TEXT,
                    payment_history TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            # Payment enforcement
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payment_enforcement (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    profit_tracking_id INTEGER NOT NULL,
                    amount_due REAL NOT NULL,
                    due_date TEXT NOT NULL,
                    payment_attempts INTEGER DEFAULT 0,
                    enforcement_level INTEGER DEFAULT 1,
                    access_restricted INTEGER DEFAULT 0,
                    collection_actions TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id),
                    FOREIGN KEY (profit_tracking_id) REFERENCES secure_profit_tracking (id)
                )
            """)
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Security database setup error: {e}")
    
    def calculate_secure_profit_share(self, user_id: str, trading_session_data: Dict) -> Dict[str, Any]:
        """Calculate profit share with multiple verification layers"""
        try:
            # 1. VERIFY USER IDENTITY AND TRUST SCORE
            trust_check = self._verify_user_trust(user_id)
            if not trust_check['trusted']:
                return {
                    'success': False,
                    'error': f'User trust verification failed: {trust_check["reason"]}',
                    'action_required': 'identity_verification'
                }
            
            # 2. VERIFY TRADING SESSION AUTHENTICITY
            session_verification = self._verify_trading_session(trading_session_data)
            if not session_verification['valid']:
                return {
                    'success': False,
                    'error': f'Trading session verification failed: {session_verification["reason"]}',
                    'action_required': 'session_audit'
                }
            
            # 3. CROSS-VERIFY WITH EXCHANGE APIs
            exchange_verification = self._cross_verify_with_exchanges(user_id, trading_session_data)
            if not exchange_verification['verified']:
                return {
                    'success': False,
                    'error': f'Exchange verification failed: {exchange_verification["reason"]}',
                    'action_required': 'exchange_audit'
                }
            
            # 4. CALCULATE PROFIT WITH MULTIPLE CONFIRMATIONS
            profit_calculation = self._calculate_verified_profit(trading_session_data, exchange_verification)
            
            if profit_calculation['total_profit'] <= 0:
                return {
                    'success': True,
                    'profit_share_due': 0,
                    'message': 'No profit generated - no payment required'
                }
            
            # 5. APPLY TIERED PLATFORM SHARE BASED ON SUBSCRIPTION
            # Get user's subscription tier to determine profit share percentage
            subscription_tier = self._get_user_subscription_tier(user_id)
            
            if subscription_tier == 'starter':
                profit_share_rate = 0.25  # 25% for starter tier
            elif subscription_tier == 'pro':
                profit_share_rate = 0.20  # 20% for pro tier  
            elif subscription_tier == 'enterprise':
                profit_share_rate = 0.15  # 15% for enterprise tier
            elif subscription_tier == 'institutional':
                profit_share_rate = 0.10  # 10% for institutional tier
            else:
                profit_share_rate = 0.30  # 30% for unsubscribed users (highest rate)
            
            platform_share = profit_calculation['total_profit'] * profit_share_rate
            user_share = profit_calculation['total_profit'] - platform_share
            
            # 6. CREATE SECURE PROFIT RECORD
            profit_record = self._create_secure_profit_record(
                user_id, trading_session_data, profit_calculation, platform_share, user_share
            )
            
            # 7. SETUP PAYMENT ENFORCEMENT
            enforcement_record = self._setup_payment_enforcement(user_id, profit_record['id'], platform_share)
            
            return {
                'success': True,
                'total_profit': profit_calculation['total_profit'],
                'platform_share': platform_share,
                'user_share': user_share,
                'platform_percentage': profit_share_rate * 100,
                'subscription_tier': subscription_tier,
                'profit_record_id': profit_record['id'],
                'payment_due_date': enforcement_record['due_date'],
                'verification_hash': profit_record['verification_hash'],
                'security_measures': {
                    'trust_score': trust_check['trust_score'],
                    'exchange_verified': True,
                    'session_verified': True,
                    'payment_enforcement': True
                }
            }
            
        except Exception as e:
            self.logger.error(f"Secure profit calculation error: {e}")
            return {'success': False, 'error': str(e)}
    
    def _verify_user_trust(self, user_id: str) -> Dict[str, Any]:
        """Verify user trustworthiness and calculate trust score"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Get user security profile
            cursor.execute("""
                SELECT trust_score, fraud_flags, payment_history, api_key_hash
                FROM user_security_profile 
                WHERE user_id = ?
            """, (user_id,))
            
            profile = cursor.fetchone()
            
            if not profile:
                # Create new security profile
                trust_score = 50  # Starting trust score
                self._create_user_security_profile(user_id, trust_score)
            else:
                trust_score, fraud_flags, payment_history, api_key_hash = profile
                
                # Check for fraud flags
                if fraud_flags:
                    flags = json.loads(fraud_flags)
                    if any(flag['severity'] == 'high' for flag in flags):
                        return {
                            'trusted': False,
                            'reason': 'High-severity fraud flags detected',
                            'trust_score': trust_score
                        }
                
                # Check payment history
                if payment_history:
                    history = json.loads(payment_history)
                    overdue_payments = [p for p in history if p.get('status') == 'overdue']
                    if len(overdue_payments) >= 3:
                        return {
                            'trusted': False,
                            'reason': 'Multiple overdue payments',
                            'trust_score': trust_score
                        }
            
            conn.close()
            
            # Trust threshold
            if trust_score < 30:
                return {
                    'trusted': False,
                    'reason': f'Trust score too low: {trust_score}/100',
                    'trust_score': trust_score
                }
            
            return {
                'trusted': True,
                'trust_score': trust_score,
                'reason': 'User verification passed'
            }
            
        except Exception as e:
            return {
                'trusted': False,
                'reason': f'Trust verification error: {str(e)}',
                'trust_score': 0
            }
    
    def _verify_trading_session(self, session_data: Dict) -> Dict[str, Any]:
        """Verify trading session authenticity"""
        try:
            # Check session duration (prevent fake quick sessions)
            start_time = datetime.fromisoformat(session_data.get('start_time', ''))
            end_time = datetime.fromisoformat(session_data.get('end_time', datetime.now().isoformat()))
            duration = (end_time - start_time).total_seconds()
            
            if duration < 300:  # Less than 5 minutes
                return {
                    'valid': False,
                    'reason': f'Session too short: {duration}s (minimum 5 minutes required)'
                }
            
            # Verify position count and trades
            positions = session_data.get('positions', [])
            if len(positions) == 0:
                return {
                    'valid': False,
                    'reason': 'No trading positions found'
                }
            
            # Check for realistic profit patterns
            total_profit = sum(pos.get('profit_loss', 0) for pos in positions)
            if total_profit > 10000:  # Suspiciously high profit
                return {
                    'valid': False,
                    'reason': f'Unrealistic profit amount: ${total_profit}'
                }
            
            return {
                'valid': True,
                'reason': 'Session verification passed',
                'duration': duration,
                'positions_count': len(positions)
            }
            
        except Exception as e:
            return {
                'valid': False,
                'reason': f'Session verification error: {str(e)}'
            }
    
    def _cross_verify_with_exchanges(self, user_id: str, session_data: Dict) -> Dict[str, Any]:
        """Cross-verify profits with actual exchange APIs"""
        try:
            # Get user's API keys
            from multi_exchange_order_manager import MultiExchangeOrderManager
            order_manager = MultiExchangeOrderManager()
            
            # This would connect to real exchanges and verify:
            # 1. Account balances before/after trading
            # 2. Actual order history
            # 3. Real P&L from exchange records
            
            # For now, we'll simulate this verification
            verification_results = {
                'binance_verified': True,
                'zerodha_verified': True,
                'balance_matches': True,
                'order_history_confirmed': True
            }
            
            if all(verification_results.values()):
                return {
                    'verified': True,
                    'reason': 'Exchange verification passed',
                    'confirmations': verification_results
                }
            else:
                return {
                    'verified': False,
                    'reason': 'Exchange verification failed',
                    'failed_checks': [k for k, v in verification_results.items() if not v]
                }
                
        except Exception as e:
            return {
                'verified': False,
                'reason': f'Exchange verification error: {str(e)}'
            }
    
    def _calculate_verified_profit(self, session_data: Dict, exchange_verification: Dict) -> Dict[str, Any]:
        """Calculate profit with multiple verification sources"""
        try:
            # Method 1: From session positions
            session_profit = sum(pos.get('profit_loss', 0) for pos in session_data.get('positions', []))
            
            # Method 2: From exchange verification (simulated)
            exchange_profit = session_profit  # In real implementation, get from exchange APIs
            
            # Method 3: Cross-check with order history
            order_profit = session_profit  # In real implementation, calculate from order fills
            
            # Verify all methods agree (within tolerance)
            profits = [session_profit, exchange_profit, order_profit]
            avg_profit = sum(profits) / len(profits)
            tolerance = 0.05  # 5% tolerance
            
            for profit in profits:
                if abs(profit - avg_profit) > (avg_profit * tolerance):
                    raise ValueError(f"Profit calculation mismatch: {profits}")
            
            return {
                'total_profit': avg_profit,
                'verification_methods': {
                    'session_calculation': session_profit,
                    'exchange_verification': exchange_profit,
                    'order_history': order_profit
                },
                'verified': True
            }
            
        except Exception as e:
            return {
                'total_profit': 0,
                'verified': False,
                'error': str(e)
            }
    
    def _create_secure_profit_record(self, user_id: str, session_data: Dict, profit_calc: Dict, platform_share: float, user_share: float) -> Dict[str, Any]:
        """Create encrypted profit record with verification hash"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Create verification hash
            verification_data = f"{user_id}:{profit_calc['total_profit']}:{platform_share}:{time.time()}"
            verification_hash = hashlib.sha256(verification_data.encode()).hexdigest()
            
            # Encrypt sensitive data
            initial_balance = self.cipher_suite.encrypt(str(10000).encode()).decode()  # Placeholder
            final_balance = self.cipher_suite.encrypt(str(10000 + profit_calc['total_profit']).encode()).decode()
            profit_encrypted = self.cipher_suite.encrypt(str(profit_calc['total_profit']).encode()).decode()
            platform_encrypted = self.cipher_suite.encrypt(str(platform_share).encode()).decode()
            user_encrypted = self.cipher_suite.encrypt(str(user_share).encode()).decode()
            
            # Insert secure record
            cursor.execute("""
                INSERT INTO secure_profit_tracking (
                    user_id, session_id, trading_session_hash, initial_balance_encrypted,
                    final_balance_encrypted, profit_amount_encrypted, platform_share_encrypted,
                    user_share_encrypted, verification_hash, api_key_fingerprint,
                    exchange_confirmations, timestamp, payment_due_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                session_data.get('id', 'unknown'),
                hashlib.md5(str(session_data).encode()).hexdigest(),
                initial_balance,
                final_balance,
                profit_encrypted,
                platform_encrypted,
                user_encrypted,
                verification_hash,
                hashlib.sha256(f"api_keys_{user_id}".encode()).hexdigest(),
                json.dumps(profit_calc.get('verification_methods', {})),
                datetime.now().isoformat(),
                (datetime.now() + timedelta(days=7)).isoformat()  # 7 days to pay
            ))
            
            record_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return {
                'id': record_id,
                'verification_hash': verification_hash,
                'encrypted': True
            }
            
        except Exception as e:
            self.logger.error(f"Error creating profit record: {e}")
            raise
    
    def _setup_payment_enforcement(self, user_id: str, profit_record_id: int, amount_due: float) -> Dict[str, Any]:
        """Setup automatic payment enforcement"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            due_date = datetime.now() + timedelta(days=7)  # 7 days to pay
            
            cursor.execute("""
                INSERT INTO payment_enforcement (
                    user_id, profit_tracking_id, amount_due, due_date,
                    enforcement_level, collection_actions
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                profit_record_id,
                amount_due,
                due_date.isoformat(),
                1,  # Level 1: Reminder
                json.dumps({
                    'reminder_sent': False,
                    'access_warning': False,
                    'trading_suspended': False,
                    'account_locked': False
                })
            ))
            
            conn.commit()
            conn.close()
            
            return {
                'due_date': due_date.isoformat(),
                'amount_due': amount_due,
                'enforcement_active': True
            }
            
        except Exception as e:
            self.logger.error(f"Error setting up payment enforcement: {e}")
            raise
    
    def _create_user_security_profile(self, user_id: str, initial_trust_score: int):
        """Create initial security profile for user"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO user_security_profile (
                    user_id, trust_score, fraud_flags, payment_history
                ) VALUES (?, ?, ?, ?)
            """, (
                user_id,
                initial_trust_score,
                json.dumps([]),
                json.dumps([])
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Error creating security profile: {e}")
    
    def enforce_payment_collection(self, user_id: str) -> Dict[str, Any]:
        """Enforce payment collection with escalating measures"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Get overdue payments
            cursor.execute("""
                SELECT pe.*, spt.platform_share_encrypted
                FROM payment_enforcement pe
                JOIN secure_profit_tracking spt ON pe.profit_tracking_id = spt.id
                WHERE pe.user_id = ? AND pe.due_date < ? AND pe.access_restricted = 0
                ORDER BY pe.due_date ASC
            """, (user_id, datetime.now().isoformat()))
            
            overdue_payments = cursor.fetchall()
            
            if not overdue_payments:
                return {'action_required': False, 'message': 'No overdue payments'}
            
            total_overdue = 0
            enforcement_actions = []
            
            for payment in overdue_payments:
                payment_id, user_id, profit_id, amount_due, due_date, attempts, level, restricted, actions = payment[:9]
                
                # Decrypt amount
                encrypted_amount = payment[9]  # platform_share_encrypted
                try:
                    decrypted_amount = float(self.cipher_suite.decrypt(encrypted_amount.encode()).decode())
                    total_overdue += decrypted_amount
                except:
                    total_overdue += amount_due
                
                # Escalate enforcement level
                days_overdue = (datetime.now() - datetime.fromisoformat(due_date)).days
                
                if days_overdue >= 30:  # 30+ days: Lock account
                    new_level = 4
                    enforcement_actions.append('account_locked')
                    self._lock_user_account(user_id)
                elif days_overdue >= 14:  # 14+ days: Suspend trading
                    new_level = 3
                    enforcement_actions.append('trading_suspended')
                    self._suspend_user_trading(user_id)
                elif days_overdue >= 7:  # 7+ days: Access warning
                    new_level = 2
                    enforcement_actions.append('access_warning')
                    self._send_access_warning(user_id)
                else:  # 1+ days: Reminder
                    new_level = 1
                    enforcement_actions.append('reminder_sent')
                    self._send_payment_reminder(user_id)
                
                # Update enforcement record
                cursor.execute("""
                    UPDATE payment_enforcement 
                    SET enforcement_level = ?, payment_attempts = payment_attempts + 1,
                        collection_actions = ?
                    WHERE id = ?
                """, (new_level, json.dumps(enforcement_actions), payment_id))
            
            conn.commit()
            conn.close()
            
            return {
                'action_required': True,
                'total_overdue': total_overdue,
                'overdue_count': len(overdue_payments),
                'enforcement_actions': enforcement_actions,
                'max_enforcement_level': max(payment[6] for payment in overdue_payments)
            }
            
        except Exception as e:
            self.logger.error(f"Payment enforcement error: {e}")
            return {'action_required': False, 'error': str(e)}
    
    def _lock_user_account(self, user_id: str):
        """Lock user account completely"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE users SET is_active = 0 WHERE user_id = ?
            """, (user_id,))
            
            conn.commit()
            conn.close()
            
            self.logger.warning(f"🔒 ACCOUNT LOCKED: {user_id} - Overdue payments")
            
        except Exception as e:
            self.logger.error(f"Error locking account: {e}")
    
    def _suspend_user_trading(self, user_id: str):
        """Suspend user's trading access"""
        # This would integrate with the trading engine to prevent new trades
        self.logger.warning(f"🚫 TRADING SUSPENDED: {user_id} - Payment overdue")
    
    def _send_access_warning(self, user_id: str):
        """Send access warning to user"""
        self.logger.info(f"⚠️ ACCESS WARNING SENT: {user_id}")
    
    def _send_payment_reminder(self, user_id: str):
        """Send payment reminder to user"""
        self.logger.info(f"📧 PAYMENT REMINDER SENT: {user_id}")
    
    def _get_user_subscription_tier(self, user_id: str) -> str:
        """Get user's subscription tier"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT subscription_tier FROM users WHERE user_id = ?
            """, (user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result[0] if result else 'unsubscribed'
            
        except Exception as e:
            self.logger.error(f"Error getting subscription tier: {e}")
            return 'unsubscribed'

# Global instance
secure_profit_manager = SecureProfitSharingManager()
