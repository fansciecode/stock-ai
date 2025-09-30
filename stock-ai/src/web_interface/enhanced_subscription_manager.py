#!/usr/bin/env python3
"""
Enhanced Subscription Manager with Complete Lifecycle Management
Handles subscription states, trial periods, auto-expiry, and prevents multiple subscriptions
"""

import sqlite3
import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import logging

class EnhancedSubscriptionManager:
    """Complete subscription lifecycle management"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.setup_database()
        self.start_background_monitor()
    
    def setup_database(self):
        """Setup enhanced subscription database with all required fields"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Enhanced subscriptions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    tier TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    trial_end_date TEXT,
                    is_trial INTEGER DEFAULT 0,
                    auto_renew INTEGER DEFAULT 1,
                    payment_method TEXT,
                    amount_paid REAL,
                    currency TEXT DEFAULT 'USD',
                    billing_cycle TEXT DEFAULT 'monthly',
                    last_warning_sent TEXT,
                    grace_period_end TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            # Subscription history table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS subscription_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    old_tier TEXT,
                    new_tier TEXT,
                    reason TEXT,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            conn.commit()
            conn.close()
            self.logger.info("Enhanced subscription database setup complete")
            
        except Exception as e:
            self.logger.error(f"Database setup error: {e}")
    
    def get_user_subscription_state(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user subscription state"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT tier, status, start_date, end_date, trial_end_date, is_trial,
                       auto_renew, amount_paid, currency, billing_cycle, last_warning_sent,
                       grace_period_end, created_at
                FROM subscriptions 
                WHERE user_id = ? AND status IN ('active', 'trial', 'grace_period')
                ORDER BY created_at DESC LIMIT 1
            """, (user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if not result:
                return {
                    "has_subscription": False,
                    "tier": "none",
                    "status": "inactive",
                    "can_trade": False,
                    "can_select_plans": True,
                    "message": "No active subscription found",
                    "action_required": "subscribe"
                }
            
            (tier, status, start_date, end_date, trial_end_date, is_trial,
             auto_renew, amount_paid, currency, billing_cycle, last_warning_sent,
             grace_period_end, created_at) = result
            
            now = datetime.now()
            
            # Check trial status
            if is_trial and trial_end_date:
                trial_end = datetime.fromisoformat(trial_end_date)
                if now > trial_end:
                    # Trial expired
                    self._expire_trial(user_id)
                    return {
                        "has_subscription": False,
                        "tier": tier,
                        "status": "trial_expired",
                        "can_trade": False,
                        "can_select_plans": True,
                        "message": "Trial period has expired",
                        "action_required": "subscribe",
                        "trial_expired_on": trial_end_date
                    }
                else:
                    # Active trial
                    days_remaining = (trial_end - now).days
                    return {
                        "has_subscription": True,
                        "tier": tier,
                        "status": "trial",
                        "can_trade": True,
                        "can_select_plans": False,  # Prevent multiple selections during trial
                        "message": f"Trial active - {days_remaining} days remaining",
                        "days_remaining": days_remaining,
                        "trial_end_date": trial_end_date,
                        "show_upgrade_warning": days_remaining <= 2
                    }
            
            # Check regular subscription expiry
            if end_date:
                end_datetime = datetime.fromisoformat(end_date)
                if now > end_datetime:
                    # Check if in grace period
                    if grace_period_end:
                        grace_end = datetime.fromisoformat(grace_period_end)
                        if now <= grace_end:
                            # In grace period
                            grace_days = (grace_end - now).days
                            return {
                                "has_subscription": True,
                                "tier": tier,
                                "status": "grace_period",
                                "can_trade": True,  # Allow trading in grace period
                                "can_select_plans": True,  # Allow renewal
                                "message": f"Subscription expired - {grace_days} days grace period remaining",
                                "grace_days_remaining": grace_days,
                                "action_required": "renew",
                                "expired_on": end_date
                            }
                    
                    # Fully expired
                    self._expire_subscription(user_id)
                    return {
                        "has_subscription": False,
                        "tier": tier,
                        "status": "expired",
                        "can_trade": False,
                        "can_select_plans": True,
                        "message": "Subscription has expired",
                        "action_required": "subscribe",
                        "expired_on": end_date
                    }
                else:
                    # Active subscription - check for expiry warning
                    days_until_expiry = (end_datetime - now).days
                    show_expiry_warning = days_until_expiry <= 7
                    
                    return {
                        "has_subscription": True,
                        "tier": tier,
                        "status": "active",
                        "can_trade": True,
                        "can_select_plans": False,  # Prevent multiple active subscriptions
                        "message": f"Active subscription - {days_until_expiry} days remaining",
                        "days_remaining": days_until_expiry,
                        "end_date": end_date,
                        "auto_renew": bool(auto_renew),
                        "billing_cycle": billing_cycle,
                        "show_expiry_warning": show_expiry_warning,
                        "current_plan": tier
                    }
            
            # Lifetime or no end date
            return {
                "has_subscription": True,
                "tier": tier,
                "status": "active",
                "can_trade": True,
                "can_select_plans": False,  # Prevent multiple selections
                "message": "Active subscription",
                "current_plan": tier,
                "is_lifetime": True
            }
            
        except Exception as e:
            self.logger.error(f"Error getting subscription state: {e}")
            return {
                "has_subscription": False,
                "tier": "none",
                "status": "error",
                "can_trade": False,
                "can_select_plans": True,
                "message": f"Error checking subscription: {str(e)}",
                "action_required": "contact_support"
            }
    
    def can_user_select_plan(self, user_id: str, target_tier: str) -> Dict[str, Any]:
        """Check if user can select a specific plan"""
        subscription_state = self.get_user_subscription_state(user_id)
        
        # If no active subscription, can select any plan
        if not subscription_state["has_subscription"]:
            return {
                "can_select": True,
                "action": "subscribe",
                "message": f"Subscribe to {target_tier.title()}",
                "is_current": False
            }
        
        current_tier = subscription_state.get("tier", "none")
        
        # If same tier, show current plan
        if current_tier == target_tier:
            return {
                "can_select": False,
                "action": "current",
                "message": "Current Plan",
                "is_current": True
            }
        
        # If in trial, can upgrade but not downgrade
        if subscription_state["status"] == "trial":
            tier_hierarchy = ["trial", "starter", "trader", "pro", "institutional"]
            current_index = tier_hierarchy.index(current_tier) if current_tier in tier_hierarchy else 0
            target_index = tier_hierarchy.index(target_tier) if target_tier in tier_hierarchy else 0
            
            if target_index > current_index:
                return {
                    "can_select": True,
                    "action": "upgrade",
                    "message": f"Upgrade to {target_tier.title()}",
                    "is_current": False
                }
            else:
                return {
                    "can_select": False,
                    "action": "downgrade_blocked",
                    "message": "Cannot downgrade during trial",
                    "is_current": False
                }
        
        # If active subscription, allow upgrades and downgrades
        if subscription_state["status"] == "active":
            tier_hierarchy = ["starter", "trader", "pro", "institutional"]
            current_index = tier_hierarchy.index(current_tier) if current_tier in tier_hierarchy else 0
            target_index = tier_hierarchy.index(target_tier) if target_tier in tier_hierarchy else 0
            
            if target_index > current_index:
                return {
                    "can_select": True,
                    "action": "upgrade",
                    "message": f"Upgrade to {target_tier.title()}",
                    "is_current": False
                }
            elif target_index < current_index:
                return {
                    "can_select": True,
                    "action": "downgrade",
                    "message": f"Downgrade to {target_tier.title()}",
                    "is_current": False
                }
        
        # If expired or grace period, can select any plan
        if subscription_state["status"] in ["expired", "grace_period"]:
            return {
                "can_select": True,
                "action": "resubscribe",
                "message": f"Reactivate with {target_tier.title()}",
                "is_current": False
            }
        
        # Default: cannot select
        return {
            "can_select": False,
            "action": "blocked",
            "message": "Plan selection not available",
            "is_current": False
        }
    
    def start_trial(self, user_id: str, trial_days: int = 7) -> Dict[str, Any]:
        """Start a trial subscription"""
        try:
            # Check if user already has a subscription
            current_state = self.get_user_subscription_state(user_id)
            if current_state["has_subscription"]:
                return {
                    "success": False,
                    "error": "User already has an active subscription"
                }
            
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            now = datetime.now()
            trial_end = now + timedelta(days=trial_days)
            
            cursor.execute("""
                INSERT INTO subscriptions 
                (user_id, tier, status, start_date, trial_end_date, is_trial, amount_paid, currency)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, "trial", "trial", now.isoformat(), trial_end.isoformat(), 1, 0.0, "USD"))
            
            # Log the action
            cursor.execute("""
                INSERT INTO subscription_history (user_id, action, new_tier, reason)
                VALUES (?, ?, ?, ?)
            """, (user_id, "trial_started", "trial", f"{trial_days} day trial"))
            
            conn.commit()
            conn.close()
            
            self.logger.info(f"Trial started for user {user_id}: {trial_days} days")
            return {
                "success": True,
                "trial_days": trial_days,
                "trial_end_date": trial_end.isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error starting trial: {e}")
            return {"success": False, "error": str(e)}
    
    def _expire_trial(self, user_id: str):
        """Mark trial as expired"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE subscriptions 
                SET status = 'trial_expired', updated_at = ?
                WHERE user_id = ? AND is_trial = 1 AND status = 'trial'
            """, (datetime.now().isoformat(), user_id))
            
            # Log the action
            cursor.execute("""
                INSERT INTO subscription_history (user_id, action, reason)
                VALUES (?, ?, ?)
            """, (user_id, "trial_expired", "Trial period ended"))
            
            conn.commit()
            conn.close()
            
            self.logger.info(f"Trial expired for user {user_id}")
            
        except Exception as e:
            self.logger.error(f"Error expiring trial: {e}")
    
    def _expire_subscription(self, user_id: str):
        """Mark subscription as expired and start grace period"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Start 3-day grace period
            grace_end = datetime.now() + timedelta(days=3)
            
            cursor.execute("""
                UPDATE subscriptions 
                SET status = 'grace_period', grace_period_end = ?, updated_at = ?
                WHERE user_id = ? AND status = 'active'
            """, (grace_end.isoformat(), datetime.now().isoformat(), user_id))
            
            # Log the action
            cursor.execute("""
                INSERT INTO subscription_history (user_id, action, reason)
                VALUES (?, ?, ?)
            """, (user_id, "subscription_expired", "Subscription period ended, grace period started"))
            
            conn.commit()
            conn.close()
            
            self.logger.info(f"Subscription expired for user {user_id}, grace period until {grace_end}")
            
        except Exception as e:
            self.logger.error(f"Error expiring subscription: {e}")
    
    def start_background_monitor(self):
        """Start background monitoring for subscription expiry"""
        def monitor_subscriptions():
            while True:
                try:
                    # Check for expired subscriptions every 5 minutes
                    self.check_and_handle_expiry()
                    time.sleep(300)  # 5 minutes
                except Exception as e:
                    self.logger.error(f"Error in subscription monitor: {e}")
                    time.sleep(60)  # Wait 1 minute on error
        
        # Start monitoring thread
        monitor_thread = threading.Thread(target=monitor_subscriptions, daemon=True)
        monitor_thread.start()
        self.logger.info("Background subscription monitor started")
    
    def check_and_handle_expiry(self):
        """Check for expired subscriptions and handle them"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            now = datetime.now()
            
            # Check for expired trials
            cursor.execute("""
                SELECT user_id FROM subscriptions 
                WHERE is_trial = 1 AND status = 'trial' 
                AND trial_end_date < ?
            """, (now.isoformat(),))
            
            expired_trials = [row[0] for row in cursor.fetchall()]
            
            # Check for expired regular subscriptions
            cursor.execute("""
                SELECT user_id FROM subscriptions 
                WHERE is_trial = 0 AND status = 'active' 
                AND end_date < ?
            """, (now.isoformat(),))
            
            expired_subscriptions = [row[0] for row in cursor.fetchall()]
            
            # Check for expired grace periods
            cursor.execute("""
                SELECT user_id FROM subscriptions 
                WHERE status = 'grace_period' 
                AND grace_period_end < ?
            """, (now.isoformat(),))
            
            expired_grace_periods = [row[0] for row in cursor.fetchall()]
            
            conn.close()
            
            # Handle expired trials
            for user_id in expired_trials:
                self._expire_trial(user_id)
            
            # Handle expired subscriptions
            for user_id in expired_subscriptions:
                self._expire_subscription(user_id)
            
            # Handle expired grace periods (fully expire)
            for user_id in expired_grace_periods:
                self._fully_expire_subscription(user_id)
            
            # Log summary
            all_expired = expired_trials + expired_subscriptions + expired_grace_periods
            if all_expired:
                self.logger.info(f"Processed {len(all_expired)} expired subscriptions")
            
        except Exception as e:
            self.logger.error(f"Error checking subscription expiry: {e}")
    
    def _fully_expire_subscription(self, user_id: str):
        """Fully expire subscription after grace period"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE subscriptions 
                SET status = 'expired', updated_at = ?
                WHERE user_id = ? AND status = 'grace_period'
            """, (datetime.now().isoformat(), user_id))
            
            # Log the action
            cursor.execute("""
                INSERT INTO subscription_history (user_id, action, reason)
                VALUES (?, ?, ?)
            """, (user_id, "fully_expired", "Grace period ended"))
            
            conn.commit()
            conn.close()
            
            self.logger.info(f"Subscription fully expired for user {user_id}")
            
        except Exception as e:
            self.logger.error(f"Error fully expiring subscription: {e}")

# Global instance
enhanced_subscription_manager = EnhancedSubscriptionManager()
