#!/usr/bin/env python3
"""
Subscription System with Market-Competitive Pricing
Designed for small to large traders with optimal pricing
"""

import sqlite3
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging

class SubscriptionManager:
    """Manages user subscriptions with competitive pricing"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.setup_database()
    
    def setup_database(self):
        """Setup subscription database"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Create subscriptions table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS subscriptions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    tier TEXT NOT NULL,
                    status TEXT DEFAULT 'active',
                    start_date TEXT NOT NULL,
                    end_date TEXT,
                    auto_renew INTEGER DEFAULT 1,
                    payment_method TEXT,
                    amount_paid REAL,
                    currency TEXT DEFAULT 'USD',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            # Create payments table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    subscription_id INTEGER,
                    amount REAL NOT NULL,
                    currency TEXT DEFAULT 'USD',
                    payment_method TEXT,
                    razorpay_payment_id TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id),
                    FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
                )
            """)
            
            # Create profit_sharing table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS profit_sharing (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    trading_session_id INTEGER,
                    total_profit REAL NOT NULL,
                    platform_share REAL NOT NULL,
                    user_share REAL NOT NULL,
                    share_percentage REAL DEFAULT 15.0,
                    status TEXT DEFAULT 'calculated',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            """)
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Database setup error: {e}")
    
    def get_pricing_tiers(self) -> Dict[str, Any]:
        """Get competitive pricing tiers optimized for user acquisition"""
        return {
            "starter": {
                "name": "Starter",
                "description": "Perfect for new traders",
                "icon": "🌱",
                "features": [
                    "Up to $500 portfolio",
                    "Basic AI signals",
                    "1 exchange (Binance OR Zerodha)",
                    "Email support",
                    "Basic risk management"
                ],
                "pricing": {
                    "monthly": {"amount": 29, "currency": "USD"},
                    "yearly": {"amount": 299, "currency": "USD", "discount": 17}
                },
                "limits": {
                    "max_portfolio": 500,
                    "max_positions": 5,
                    "exchanges": 1,
                    "api_calls_per_day": 1000
                },
                "target_audience": "Beginners, Students, Small traders"
            },
            "trader": {
                "name": "Trader",
                "description": "For serious retail traders",
                "icon": "📈",
                "features": [
                    "Up to $5,000 portfolio",
                    "Advanced AI signals",
                    "Both exchanges (Binance + Zerodha)",
                    "Priority support",
                    "Advanced risk management",
                    "Portfolio analytics",
                    "Mobile alerts"
                ],
                "pricing": {
                    "monthly": {"amount": 79, "currency": "USD"},
                    "yearly": {"amount": 799, "currency": "USD", "discount": 16}
                },
                "limits": {
                    "max_portfolio": 5000,
                    "max_positions": 20,
                    "exchanges": 2,
                    "api_calls_per_day": 5000
                },
                "target_audience": "Active traders, Small funds"
            },
            "pro": {
                "name": "Pro",
                "description": "For professional traders",
                "icon": "🚀",
                "features": [
                    "Up to $25,000 portfolio",
                    "Premium AI signals",
                    "Multi-exchange routing",
                    "24/7 priority support",
                    "Custom risk parameters",
                    "Advanced analytics",
                    "API access",
                    "Backtesting tools"
                ],
                "pricing": {
                    "monthly": {"amount": 199, "currency": "USD"},
                    "yearly": {"amount": 1999, "currency": "USD", "discount": 16}
                },
                "limits": {
                    "max_portfolio": 25000,
                    "max_positions": 50,
                    "exchanges": "unlimited",
                    "api_calls_per_day": 25000
                },
                "target_audience": "Professional traders, Small hedge funds"
            },
            "institutional": {
                "name": "Institutional",
                "description": "For institutions and large funds",
                "icon": "🏛️",
                "features": [
                    "Unlimited portfolio size",
                    "Custom AI model training",
                    "White-label solutions",
                    "Dedicated account manager",
                    "Custom integrations",
                    "On-premise deployment",
                    "SLA guarantees",
                    "Compliance reporting"
                ],
                "pricing": {
                    "monthly": {"amount": 999, "currency": "USD"},
                    "yearly": {"amount": 9999, "currency": "USD", "discount": 17},
                    "custom": True
                },
                "limits": {
                    "max_portfolio": "unlimited",
                    "max_positions": "unlimited",
                    "exchanges": "unlimited",
                    "api_calls_per_day": "unlimited"
                },
                "target_audience": "Hedge funds, Investment banks, Institutions"
            },
            "profit_share": {
                "name": "Profit Share",
                "description": "Pay only when you profit",
                "icon": "💰",
                "features": [
                    "No upfront costs",
                    "15% of profits only",
                    "All Pro features included",
                    "Risk-free trial",
                    "Performance-based pricing"
                ],
                "pricing": {
                    "profit_share": {"percentage": 15, "minimum_profit": 100}
                },
                "limits": {
                    "max_portfolio": 10000,
                    "max_positions": 30,
                    "exchanges": 2,
                    "api_calls_per_day": 10000
                },
                "target_audience": "Risk-averse traders, Performance seekers"
            }
        }
    
    def calculate_pricing_with_taxes(self, tier: str, billing_cycle: str, user_country: str = "IN") -> Dict[str, Any]:
        """Calculate final pricing including taxes"""
        tiers = self.get_pricing_tiers()
        
        if tier not in tiers:
            raise ValueError(f"Invalid tier: {tier}")
        
        tier_data = tiers[tier]
        
        if tier == "profit_share":
            return {
                "base_amount": 0,
                "profit_share_percentage": 15,
                "minimum_profit_threshold": 100,
                "total_amount": 0,
                "currency": "USD",
                "taxes": 0,
                "billing_cycle": "profit_based"
            }
        
        if billing_cycle not in tier_data["pricing"]:
            raise ValueError(f"Invalid billing cycle: {billing_cycle}")
        
        pricing = tier_data["pricing"][billing_cycle]
        base_amount = pricing["amount"]
        
        # Calculate taxes based on country
        tax_rate = self._get_tax_rate(user_country)
        tax_amount = base_amount * tax_rate
        total_amount = base_amount + tax_amount
        
        return {
            "tier": tier,
            "billing_cycle": billing_cycle,
            "base_amount": base_amount,
            "tax_rate": tax_rate * 100,
            "tax_amount": round(tax_amount, 2),
            "total_amount": round(total_amount, 2),
            "currency": pricing["currency"],
            "discount": pricing.get("discount", 0),
            "savings": round(base_amount * pricing.get("discount", 0) / 100, 2) if billing_cycle == "yearly" else 0
        }
    
    def _get_tax_rate(self, country_code: str) -> float:
        """Get tax rate based on country"""
        tax_rates = {
            "IN": 0.18,    # GST in India
            "US": 0.08,    # Average sales tax
            "GB": 0.20,    # VAT in UK
            "DE": 0.19,    # VAT in Germany
            "CA": 0.13,    # HST in Canada
            "AU": 0.10,    # GST in Australia
            "SG": 0.07,    # GST in Singapore
        }
        return tax_rates.get(country_code, 0.10)  # Default 10%
    
    def create_subscription(self, user_id: str, tier: str, billing_cycle: str, payment_method: str = "razorpay") -> Dict[str, Any]:
        """Create a new subscription"""
        try:
            pricing = self.calculate_pricing_with_taxes(tier, billing_cycle)
            
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            # Calculate end date
            if billing_cycle == "monthly":
                end_date = datetime.now() + timedelta(days=30)
            elif billing_cycle == "yearly":
                end_date = datetime.now() + timedelta(days=365)
            else:
                end_date = None  # For profit-share model
            
            # Insert subscription
            cursor.execute("""
                INSERT INTO subscriptions (user_id, tier, start_date, end_date, amount_paid, currency, payment_method)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id, tier, datetime.now().isoformat(),
                end_date.isoformat() if end_date else None,
                pricing["total_amount"], pricing["currency"], payment_method
            ))
            
            subscription_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "subscription_id": subscription_id,
                "tier": tier,
                "pricing": pricing,
                "end_date": end_date.isoformat() if end_date else None
            }
            
        except Exception as e:
            self.logger.error(f"Subscription creation error: {e}")
            return {"success": False, "error": str(e)}
    
    def check_subscription_status(self, user_id: str) -> Dict[str, Any]:
        """Check user's current subscription status"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT tier, status, start_date, end_date, amount_paid, currency
                FROM subscriptions 
                WHERE user_id = ? AND status = 'active'
                ORDER BY created_at DESC LIMIT 1
            """, (user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if not result:
                return {
                    "has_subscription": False,
                    "tier": "none",
                    "status": "inactive",
                    "message": "No active subscription found"
                }
            
            tier, status, start_date, end_date, amount_paid, currency = result
            
            # Check if subscription has expired
            if end_date:
                end_datetime = datetime.fromisoformat(end_date)
                if datetime.now() > end_datetime:
                    self._expire_subscription(user_id)
                    return {
                        "has_subscription": False,
                        "tier": tier,
                        "status": "expired",
                        "expired_on": end_date,
                        "message": "Subscription has expired"
                    }
            
            return {
                "has_subscription": True,
                "tier": tier,
                "status": status,
                "start_date": start_date,
                "end_date": end_date,
                "amount_paid": amount_paid,
                "currency": currency,
                "days_remaining": self._calculate_days_remaining(end_date) if end_date else None
            }
            
        except Exception as e:
            self.logger.error(f"Subscription status check error: {e}")
            return {"has_subscription": False, "error": str(e)}
    
    def _calculate_days_remaining(self, end_date_str: str) -> int:
        """Calculate days remaining in subscription"""
        try:
            end_date = datetime.fromisoformat(end_date_str)
            remaining = end_date - datetime.now()
            return max(0, remaining.days)
        except:
            return 0
    
    def _expire_subscription(self, user_id: str):
        """Mark subscription as expired"""
        try:
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                UPDATE subscriptions 
                SET status = 'expired' 
                WHERE user_id = ? AND status = 'active'
            """, (user_id,))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Subscription expiration error: {e}")
    
    def calculate_profit_share(self, user_id: str, total_profit: float, session_id: int) -> Dict[str, Any]:
        """Calculate profit sharing for profit-share tier users"""
        try:
            if total_profit <= 0:
                return {"success": False, "message": "No profit to share"}
            
            # Check if user is on profit-share tier
            subscription = self.check_subscription_status(user_id)
            if not subscription.get("has_subscription") or subscription.get("tier") != "profit_share":
                return {"success": False, "message": "User not on profit-share tier"}
            
            # Calculate shares
            platform_percentage = 15.0  # 15% to platform
            platform_share = total_profit * (platform_percentage / 100)
            user_share = total_profit - platform_share
            
            # Save to database
            conn = sqlite3.connect('../../data/users.db')
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO profit_sharing (user_id, trading_session_id, total_profit, platform_share, user_share, share_percentage)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (user_id, session_id, total_profit, platform_share, user_share, platform_percentage))
            
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "total_profit": total_profit,
                "platform_share": round(platform_share, 2),
                "user_share": round(user_share, 2),
                "platform_percentage": platform_percentage
            }
            
        except Exception as e:
            self.logger.error(f"Profit share calculation error: {e}")
            return {"success": False, "error": str(e)}

# Global instance
subscription_manager = SubscriptionManager()
