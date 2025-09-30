#!/usr/bin/env python3
"""
Subscription Manager for AI Trading Platform
Handles user subscriptions, payment tracking, and trading access control
"""

import sqlite3
import json
import uuid
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
import hashlib
import hmac

class SubscriptionManager:
    def __init__(self):
        self.db_path = 'data/subscriptions.db'
        self._create_tables()
        
        # Payment Gateway Configuration
        self.razorpay_config = {
            'key_id': 'rzp_test_demo_key_12345',  # Demo key
            'key_secret': 'demo_secret_67890',
            'webhook_secret': 'whsec_demo_webhook_secret'
        }
    
    def _create_tables(self):
        """Create subscription and payment tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Subscriptions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                subscription_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                user_email TEXT NOT NULL,
                tier TEXT NOT NULL,  -- DEMO, PRO, ENTERPRISE
                status TEXT NOT NULL,  -- ACTIVE, SUSPENDED, CANCELLED
                payment_model TEXT NOT NULL,  -- FIXED, PROFIT_SHARE, HYBRID
                start_date TEXT NOT NULL,
                end_date TEXT,
                current_period_start TEXT NOT NULL,
                current_period_end TEXT NOT NULL,
                auto_renew BOOLEAN DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Portfolio tracking for profit calculation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS portfolio_snapshots (
                snapshot_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                portfolio_value REAL NOT NULL,
                exchange_balances TEXT,  -- JSON: {"binance": 1000, "zerodha": 5000}
                deposits REAL DEFAULT 0.0,
                withdrawals REAL DEFAULT 0.0,
                snapshot_date TEXT NOT NULL,
                snapshot_type TEXT NOT NULL  -- MONTH_START, MONTH_END, DAILY
            )
        """)
        
        # Payment records
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                payment_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                subscription_id TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'INR',
                payment_method TEXT NOT NULL,  -- RAZORPAY, STRIPE, BANK
                payment_gateway_id TEXT,  -- External payment ID
                payment_status TEXT NOT NULL,  -- PENDING, SUCCESS, FAILED, REFUNDED
                payment_type TEXT NOT NULL,  -- SUBSCRIPTION, PROFIT_SHARE, UPGRADE
                billing_period_start TEXT,
                billing_period_end TEXT,
                profit_amount REAL DEFAULT 0.0,  -- User's profit for the period
                fee_percentage REAL DEFAULT 0.0,  -- Fee percentage applied
                payment_date TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT  -- JSON for additional data
            )
        """)
        
        # Trading sessions tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trading_session_logs (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                start_time TEXT NOT NULL,
                end_time TEXT,
                session_duration INTEGER,  -- in seconds
                positions_opened INTEGER DEFAULT 0,
                positions_closed INTEGER DEFAULT 0,
                total_volume REAL DEFAULT 0.0,
                realized_pnl REAL DEFAULT 0.0,
                status TEXT DEFAULT 'ACTIVE'  -- ACTIVE, COMPLETED, TERMINATED
            )
        """)
        
        # Usage limits and tracking
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS usage_tracking (
                usage_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                usage_date TEXT NOT NULL,
                trading_hours REAL DEFAULT 0.0,
                api_calls INTEGER DEFAULT 0,
                positions_count INTEGER DEFAULT 0,
                portfolio_value REAL DEFAULT 0.0,
                monthly_reset_date TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def create_subscription(self, user_id: str, user_email: str, tier: str = 'DEMO') -> Dict:
        """Create a new subscription for user"""
        try:
            subscription_id = str(uuid.uuid4())
            now = datetime.now()
            
            # Set subscription parameters based on tier
            if tier == 'DEMO':
                period_days = 14  # 14-day free trial
                payment_model = 'FREE'
            elif tier == 'PRO':
                period_days = 30
                payment_model = 'PROFIT_SHARE'
            elif tier == 'ENTERPRISE':
                period_days = 30
                payment_model = 'PROFIT_SHARE'
            else:
                return {'success': False, 'error': 'Invalid tier'}
            
            start_date = now.isoformat()
            end_date = (now + timedelta(days=period_days)).isoformat()
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO subscriptions 
                (subscription_id, user_id, user_email, tier, status, payment_model, 
                 start_date, current_period_start, current_period_end)
                VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
            """, (subscription_id, user_id, user_email, tier, payment_model, 
                  start_date, start_date, end_date))
            
            # Create initial portfolio snapshot
            self._create_portfolio_snapshot(user_id, 0.0, {}, 'SUBSCRIPTION_START')
            
            conn.commit()
            conn.close()
            
            print(f"✅ Created {tier} subscription for {user_email}")
            return {
                'success': True, 
                'subscription_id': subscription_id,
                'tier': tier,
                'expires_at': end_date
            }
            
        except Exception as e:
            print(f"❌ Error creating subscription: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_user_subscription(self, user_id: str) -> Dict:
        """Get current subscription details for user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT subscription_id, tier, status, payment_model, 
                       current_period_start, current_period_end, auto_renew
                FROM subscriptions 
                WHERE user_id = ? AND status = 'ACTIVE'
                ORDER BY created_at DESC LIMIT 1
            """, (user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                subscription_id, tier, status, payment_model, start, end, auto_renew = result
                
                # Check if subscription expired
                end_date = datetime.fromisoformat(end)
                is_expired = datetime.now() > end_date
                
                return {
                    'success': True,
                    'subscription_id': subscription_id,
                    'tier': tier,
                    'status': status,
                    'payment_model': payment_model,
                    'current_period_start': start,
                    'current_period_end': end,
                    'is_expired': is_expired,
                    'auto_renew': bool(auto_renew),
                    'days_remaining': max(0, (end_date - datetime.now()).days)
                }
            else:
                return {'success': False, 'error': 'No active subscription found'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def check_trading_access(self, user_id: str) -> Dict:
        """Check if user has access to trading based on subscription"""
        subscription = self.get_user_subscription(user_id)
        
        if not subscription['success']:
            return {
                'allowed': False, 
                'reason': 'No active subscription',
                'action_required': 'SUBSCRIBE'
            }
        
        # Check if expired
        if subscription['is_expired']:
            if subscription['tier'] == 'DEMO':
                return {
                    'allowed': False,
                    'reason': 'Demo period expired',
                    'action_required': 'UPGRADE'
                }
            else:
                # Check if payment is due
                payment_due = self._check_payment_due(user_id)
                if payment_due['payment_required']:
                    return {
                        'allowed': False,
                        'reason': f"Payment due: ₹{payment_due['amount']}",
                        'action_required': 'PAYMENT',
                        'payment_details': payment_due
                    }
        
        # Check usage limits
        usage_check = self._check_usage_limits(user_id, subscription['tier'])
        if not usage_check['allowed']:
            return usage_check
        
        return {
            'allowed': True,
            'tier': subscription['tier'],
            'expires_in_days': subscription['days_remaining']
        }
    
    def _check_payment_due(self, user_id: str) -> Dict:
        """Check if payment is due based on profit-share model"""
        try:
            # Get last month's portfolio performance
            last_month_start = datetime.now().replace(day=1) - timedelta(days=1)
            last_month_start = last_month_start.replace(day=1)
            last_month_end = datetime.now().replace(day=1) - timedelta(days=1)
            
            profit = self._calculate_monthly_profit(user_id, last_month_start, last_month_end)
            
            subscription = self.get_user_subscription(user_id)
            if not subscription['success']:
                return {'payment_required': False}
            
            tier = subscription['tier']
            
            # Calculate fee based on tier
            if tier == 'PRO':
                fee_percentage = 0.15  # 15%
                minimum_fee = 29  # $29 minimum
            elif tier == 'ENTERPRISE':
                fee_percentage = 0.12  # 12%
                minimum_fee = 99  # $99 minimum
            else:
                return {'payment_required': False}
            
            if profit > 0:
                fee_amount = max(profit * fee_percentage, minimum_fee)
            else:
                fee_amount = minimum_fee
            
            # Check if payment already made for this period
            payment_exists = self._check_payment_exists(user_id, last_month_start, last_month_end)
            
            return {
                'payment_required': not payment_exists,
                'amount': fee_amount,
                'profit': profit,
                'fee_percentage': fee_percentage * 100,
                'period_start': last_month_start.isoformat(),
                'period_end': last_month_end.isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error checking payment due: {e}")
            return {'payment_required': False}
    
    def _calculate_monthly_profit(self, user_id: str, start_date: datetime, end_date: datetime) -> float:
        """Calculate user's profit for a given period"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get portfolio snapshots for the period
            cursor.execute("""
                SELECT portfolio_value, deposits, withdrawals, snapshot_date
                FROM portfolio_snapshots
                WHERE user_id = ? AND snapshot_date BETWEEN ? AND ?
                ORDER BY snapshot_date
            """, (user_id, start_date.isoformat(), end_date.isoformat()))
            
            snapshots = cursor.fetchall()
            conn.close()
            
            if len(snapshots) < 2:
                return 0.0
            
            start_value = snapshots[0][0]  # First snapshot value
            end_value = snapshots[-1][0]   # Last snapshot value
            
            # Calculate net deposits/withdrawals
            total_deposits = sum(row[1] for row in snapshots)
            total_withdrawals = sum(row[2] for row in snapshots)
            
            # Profit = End Value - Start Value - Net Deposits + Withdrawals
            profit = end_value - start_value - total_deposits + total_withdrawals
            
            return max(0.0, profit)  # Only positive profits count
            
        except Exception as e:
            print(f"❌ Error calculating profit: {e}")
            return 0.0
    
    def create_payment_order(self, user_id: str, amount: float, payment_type: str = 'PROFIT_SHARE') -> Dict:
        """Create a payment order with Razorpay"""
        try:
            payment_id = str(uuid.uuid4())
            
            # For demo purposes, simulate payment gateway response
            if amount <= 100:  # Demo success for small amounts
                gateway_order_id = f"order_demo_success_{int(time.time())}"
                status = 'CREATED'
            else:  # Demo failure for large amounts
                gateway_order_id = f"order_demo_fail_{int(time.time())}"
                status = 'FAILED'
            
            # Store payment record
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO payments 
                (payment_id, user_id, amount, payment_method, payment_gateway_id, 
                 payment_status, payment_type, created_at)
                VALUES (?, ?, ?, 'RAZORPAY', ?, ?, ?, ?)
            """, (payment_id, user_id, amount, gateway_order_id, status, payment_type, 
                  datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            return {
                'success': True,
                'payment_id': payment_id,
                'gateway_order_id': gateway_order_id,
                'amount': amount,
                'currency': 'INR',
                'status': status
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def process_payment_webhook(self, webhook_data: Dict) -> Dict:
        """Process payment webhook from Razorpay"""
        try:
            # Verify webhook signature (simplified for demo)
            gateway_order_id = webhook_data.get('order_id')
            payment_status = webhook_data.get('status', 'FAILED')
            
            print(f"🔄 Processing webhook for order {gateway_order_id}: {payment_status}")
            
            # Update payment record
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE payments 
                SET payment_status = ?, payment_date = ?
                WHERE payment_gateway_id = ?
            """, (payment_status, datetime.now().isoformat(), gateway_order_id))
            
            # If payment successful, reactivate subscription
            if payment_status == 'SUCCESS':
                cursor.execute("""
                    SELECT user_id FROM payments WHERE payment_gateway_id = ?
                """, (gateway_order_id,))
                
                result = cursor.fetchone()
                if result:
                    user_id = result[0]
                    print(f"💳 Payment successful for user {user_id}, reactivating subscription...")
                    conn.commit()  # Commit payment update first
                    conn.close()
                    
                    # Reactivate subscription
                    self._reactivate_subscription(user_id)
                    return {'success': True, 'status': payment_status, 'reactivated': True}
                else:
                    print(f"⚠️ No payment record found for order {gateway_order_id}")
                    conn.commit()
                    conn.close()
                    return {'success': True, 'status': payment_status, 'reactivated': False}
            else:
                conn.commit()
                conn.close()
                print(f"❌ Payment failed for order {gateway_order_id}")
            
            return {'success': True, 'status': payment_status}
            
        except Exception as e:
            print(f"❌ Webhook processing error: {e}")
            return {'success': False, 'error': str(e)}
    
    def _reactivate_subscription(self, user_id: str):
        """Reactivate user subscription after successful payment"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Extend subscription by 30 days from now
            new_start_date = datetime.now().isoformat()
            new_end_date = (datetime.now() + timedelta(days=30)).isoformat()
            
            # Update existing subscription or create new one
            cursor.execute("""
                UPDATE subscriptions 
                SET status = 'ACTIVE', 
                    current_period_start = ?, 
                    current_period_end = ?, 
                    updated_at = ?
                WHERE user_id = ?
            """, (new_start_date, new_end_date, datetime.now().isoformat(), user_id))
            
            # If no rows were updated, the user might not have a subscription
            if cursor.rowcount == 0:
                print(f"⚠️ No subscription found for user {user_id}, creating new one")
                
                # Get user email
                cursor.execute("SELECT user_email FROM subscriptions WHERE user_id = ? LIMIT 1", (user_id,))
                result = cursor.fetchone()
                user_email = result[0] if result else f"user_{user_id}@unknown.com"
                
                # Create new subscription
                subscription_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO subscriptions 
                    (subscription_id, user_id, user_email, tier, status, payment_model, 
                     start_date, current_period_start, current_period_end, auto_renew)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (subscription_id, user_id, user_email, 'PRO', 'ACTIVE', 'PROFIT_SHARE',
                      new_start_date, new_start_date, new_end_date, True))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Reactivated subscription for user {user_id} until {new_end_date[:10]}")
            
        except Exception as e:
            print(f"❌ Error reactivating subscription: {e}")
    
    def suspend_user_trading(self, user_id: str, reason: str):
        """Suspend user's trading access"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE subscriptions 
                SET status = 'SUSPENDED', updated_at = ?
                WHERE user_id = ?
            """, (datetime.now().isoformat(), user_id))
            
            conn.commit()
            conn.close()
            
            print(f"🚫 Suspended trading for user {user_id}: {reason}")
            
        except Exception as e:
            print(f"❌ Error suspending user: {e}")
    
    def _create_portfolio_snapshot(self, user_id: str, portfolio_value: float, 
                                  exchange_balances: Dict, snapshot_type: str = 'DAILY'):
        """Create a portfolio snapshot for profit calculation"""
        try:
            snapshot_id = str(uuid.uuid4())
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO portfolio_snapshots 
                (snapshot_id, user_id, portfolio_value, exchange_balances, 
                 snapshot_date, snapshot_type)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (snapshot_id, user_id, portfolio_value, json.dumps(exchange_balances),
                  datetime.now().isoformat(), snapshot_type))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"❌ Error creating portfolio snapshot: {e}")
    
    def get_subscription_analytics(self, user_id: str) -> Dict:
        """Get subscription and usage analytics for user"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get subscription info
            subscription = self.get_user_subscription(user_id)
            
            # Get payment history
            cursor.execute("""
                SELECT amount, payment_status, payment_date, payment_type
                FROM payments
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
            
            payments = cursor.fetchall()
            
            # Get trading sessions
            cursor.execute("""
                SELECT COUNT(*), SUM(session_duration), SUM(realized_pnl)
                FROM trading_session_logs
                WHERE user_id = ?
            """, (user_id,))
            
            session_stats = cursor.fetchone()
            
            conn.close()
            
            return {
                'success': True,
                'subscription': subscription,
                'total_payments': len(payments),
                'total_amount_paid': sum(p[0] for p in payments if p[1] == 'SUCCESS'),
                'trading_sessions': session_stats[0] or 0,
                'total_trading_hours': (session_stats[1] or 0) / 3600,
                'total_realized_pnl': session_stats[2] or 0.0,
                'payment_history': [
                    {
                        'amount': p[0],
                        'status': p[1],
                        'date': p[2],
                        'type': p[3]
                    } for p in payments
                ]
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _check_usage_limits(self, user_id: str, tier: str) -> Dict:
        """Check if user has exceeded usage limits for their tier"""
        limits = {
            'DEMO': {
                'max_portfolio': 1000,  # $1000
                'max_positions': 5,
                'max_trading_hours_per_day': 8
            },
            'PRO': {
                'max_portfolio': 50000,  # $50,000
                'max_positions': 50,
                'max_trading_hours_per_day': 24
            },
            'ENTERPRISE': {
                'max_portfolio': 500000,  # $500,000
                'max_positions': 200,
                'max_trading_hours_per_day': 24
            }
        }
        
        tier_limits = limits.get(tier, limits['DEMO'])
        
        # For now, return allowed - implement actual usage checking later
        return {
            'allowed': True,
            'limits': tier_limits,
            'current_usage': {
                'portfolio_value': 0,
                'active_positions': 0,
                'daily_trading_hours': 0
            }
        }
    
    def _check_payment_exists(self, user_id: str, start_date: datetime, end_date: datetime) -> bool:
        """Check if payment already exists for given period"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) FROM payments
                WHERE user_id = ? AND payment_status = 'SUCCESS'
                AND billing_period_start = ? AND billing_period_end = ?
            """, (user_id, start_date.isoformat(), end_date.isoformat()))
            
            count = cursor.fetchone()[0]
            conn.close()
            
            return count > 0
            
        except Exception as e:
            return False

# Global instance
subscription_manager = SubscriptionManager()
