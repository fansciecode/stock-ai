#!/usr/bin/env python3
"""
IBCM AI - Affiliate Marketing System
Implements affiliate marketing layer as described in the document
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import hashlib
import uuid

logger = logging.getLogger(__name__)

class AffiliateSystem:
    """
    Affiliate marketing system for IBCM platform
    - Affiliate partner onboarding
    - Product/event promotion tracking
    - Commission calculation and payouts
    - AI-driven optimization
    """
    
    def __init__(self, ai_engine):
        self.ai_engine = ai_engine
        
    async def register_affiliate(self, affiliate_data: Dict) -> Dict:
        """Register new affiliate partner"""
        try:
            # Generate unique affiliate ID and tracking codes
            affiliate_id = str(uuid.uuid4())
            tracking_code = self._generate_tracking_code(affiliate_id)
            
            affiliate_profile = {
                "affiliate_id": affiliate_id,
                "tracking_code": tracking_code,
                "name": affiliate_data.get("name", ""),
                "email": affiliate_data.get("email", ""),
                "type": affiliate_data.get("type", "individual"),  # individual, business, influencer
                "categories": affiliate_data.get("categories", []),
                "commission_rate": affiliate_data.get("commission_rate", 0.05),  # 5% default
                "status": "active",
                "registration_date": datetime.now(),
                "total_earnings": 0.0,
                "total_referrals": 0,
                "performance_metrics": {
                    "clicks": 0,
                    "conversions": 0,
                    "conversion_rate": 0.0
                }
            }
            
            # Save to database
            if self.ai_engine.db is not None:
                self.ai_engine.db.affiliates.insert_one(affiliate_profile)
            
            return {
                "success": True,
                "affiliate_id": affiliate_id,
                "tracking_code": tracking_code,
                "message": "Affiliate registered successfully"
            }
            
        except Exception as e:
            logger.error(f"Error registering affiliate: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_tracking_code(self, affiliate_id: str) -> str:
        """Generate unique tracking code for affiliate"""
        # Create a short, unique tracking code
        hash_input = f"{affiliate_id}_{datetime.now().timestamp()}"
        hash_obj = hashlib.md5(hash_input.encode())
        return hash_obj.hexdigest()[:8].upper()
    
    async def create_affiliate_link(self, affiliate_id: str, product_data: Dict) -> Dict:
        """Create trackable affiliate link for product/event"""
        try:
            # Verify affiliate exists
            affiliate = await self._get_affiliate(affiliate_id)
            if not affiliate:
                return {"success": False, "error": "Affiliate not found"}
            
            # Generate unique link ID
            link_id = str(uuid.uuid4())
            
            affiliate_link = {
                "link_id": link_id,
                "affiliate_id": affiliate_id,
                "product_id": product_data.get("product_id"),
                "product_type": product_data.get("type", "event"),  # event, product, service
                "base_url": product_data.get("url", ""),
                "tracking_url": f"/track/{affiliate['tracking_code']}/{link_id}",
                "commission_rate": product_data.get("commission_rate", affiliate.get("commission_rate", 0.05)),
                "created_date": datetime.now(),
                "status": "active",
                "click_count": 0,
                "conversion_count": 0
            }
            
            # Save to database
            if self.ai_engine.db is not None:
                self.ai_engine.db.affiliate_links.insert_one(affiliate_link)
            
            return {
                "success": True,
                "link_id": link_id,
                "tracking_url": affiliate_link["tracking_url"],
                "commission_rate": affiliate_link["commission_rate"]
            }
            
        except Exception as e:
            logger.error(f"Error creating affiliate link: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def track_click(self, tracking_code: str, link_id: str, user_data: Dict) -> Dict:
        """Track affiliate link click"""
        try:
            # Find affiliate and link
            affiliate = await self._get_affiliate_by_tracking_code(tracking_code)
            if not affiliate:
                return {"success": False, "error": "Invalid tracking code"}
            
            # Record click
            click_data = {
                "click_id": str(uuid.uuid4()),
                "affiliate_id": affiliate["affiliate_id"],
                "link_id": link_id,
                "user_ip": user_data.get("ip", ""),
                "user_agent": user_data.get("user_agent", ""),
                "referrer": user_data.get("referrer", ""),
                "timestamp": datetime.now(),
                "converted": False
            }
            
            # Save click data
            if self.ai_engine.db is not None:
                self.ai_engine.db.affiliate_clicks.insert_one(click_data)
                
                # Update click count
                self.ai_engine.db.affiliate_links.update_one(
                    {"link_id": link_id},
                    {"$inc": {"click_count": 1}}
                )
                
                self.ai_engine.db.affiliates.update_one(
                    {"affiliate_id": affiliate["affiliate_id"]},
                    {"$inc": {"performance_metrics.clicks": 1}}
                )
            
            return {
                "success": True,
                "click_id": click_data["click_id"],
                "redirect_url": await self._get_product_url(link_id)
            }
            
        except Exception as e:
            logger.error(f"Error tracking click: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def track_conversion(self, click_id: str, transaction_data: Dict) -> Dict:
        """Track affiliate conversion and calculate commission"""
        try:
            # Find the click record
            if self.ai_engine.db is not None:
                click = self.ai_engine.db.affiliate_clicks.find_one({"click_id": click_id})
                if not click:
                    return {"success": False, "error": "Click not found"}
                
                # Get affiliate and link data
                affiliate = await self._get_affiliate(click["affiliate_id"])
                link = self.ai_engine.db.affiliate_links.find_one({"link_id": click["link_id"]})
                
                if not affiliate or not link:
                    return {"success": False, "error": "Affiliate or link not found"}
                
                # Calculate commission
                transaction_amount = transaction_data.get("amount", 0.0)
                commission_rate = link.get("commission_rate", 0.05)
                commission_amount = transaction_amount * commission_rate
                
                # Record conversion
                conversion_data = {
                    "conversion_id": str(uuid.uuid4()),
                    "click_id": click_id,
                    "affiliate_id": affiliate["affiliate_id"],
                    "link_id": click["link_id"],
                    "transaction_amount": transaction_amount,
                    "commission_rate": commission_rate,
                    "commission_amount": commission_amount,
                    "transaction_id": transaction_data.get("transaction_id", ""),
                    "timestamp": datetime.now(),
                    "status": "confirmed"
                }
                
                # Save conversion
                self.ai_engine.db.affiliate_conversions.insert_one(conversion_data)
                
                # Update click as converted
                self.ai_engine.db.affiliate_clicks.update_one(
                    {"click_id": click_id},
                    {"$set": {"converted": True}}
                )
                
                # Update affiliate and link statistics
                self.ai_engine.db.affiliate_links.update_one(
                    {"link_id": click["link_id"]},
                    {"$inc": {"conversion_count": 1}}
                )
                
                self.ai_engine.db.affiliates.update_one(
                    {"affiliate_id": affiliate["affiliate_id"]},
                    {
                        "$inc": {
                            "total_earnings": commission_amount,
                            "total_referrals": 1,
                            "performance_metrics.conversions": 1
                        }
                    }
                )
                
                # Update conversion rate
                await self._update_conversion_rate(affiliate["affiliate_id"])
                
                return {
                    "success": True,
                    "conversion_id": conversion_data["conversion_id"],
                    "commission_amount": commission_amount,
                    "affiliate_id": affiliate["affiliate_id"]
                }
            
        except Exception as e:
            logger.error(f"Error tracking conversion: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_affiliate_analytics(self, affiliate_id: str, period_days: int = 30) -> Dict:
        """Get analytics for affiliate performance"""
        try:
            affiliate = await self._get_affiliate(affiliate_id)
            if not affiliate:
                return {"success": False, "error": "Affiliate not found"}
            
            start_date = datetime.now() - timedelta(days=period_days)
            
            analytics = {
                "affiliate_id": affiliate_id,
                "period_days": period_days,
                "total_clicks": 0,
                "total_conversions": 0,
                "total_earnings": 0.0,
                "conversion_rate": 0.0,
                "top_products": [],
                "daily_performance": []
            }
            
            if self.ai_engine.db is not None:
                # Get clicks in period
                clicks = list(self.ai_engine.db.affiliate_clicks.find({
                    "affiliate_id": affiliate_id,
                    "timestamp": {"$gte": start_date}
                }))
                
                # Get conversions in period
                conversions = list(self.ai_engine.db.affiliate_conversions.find({
                    "affiliate_id": affiliate_id,
                    "timestamp": {"$gte": start_date}
                }))
                
                analytics["total_clicks"] = len(clicks)
                analytics["total_conversions"] = len(conversions)
                analytics["total_earnings"] = sum(c.get("commission_amount", 0) for c in conversions)
                
                if analytics["total_clicks"] > 0:
                    analytics["conversion_rate"] = analytics["total_conversions"] / analytics["total_clicks"]
                
                # AI insights
                if self.ai_engine.agent_orchestrator:
                    ai_insights = await self._generate_ai_insights(affiliate_id, analytics)
                    analytics["ai_insights"] = ai_insights
            
            return {
                "success": True,
                "analytics": analytics
            }
            
        except Exception as e:
            logger.error(f"Error getting affiliate analytics: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _generate_ai_insights(self, affiliate_id: str, analytics: Dict) -> Dict:
        """Generate AI insights for affiliate performance"""
        try:
            context = {
                "affiliate_id": affiliate_id,
                "performance": analytics,
                "type": "affiliate_analytics"
            }
            
            query = f"Analyze affiliate performance: {analytics['total_clicks']} clicks, {analytics['total_conversions']} conversions, ${analytics['total_earnings']:.2f} earnings"
            
            result = await self.ai_engine.agent_orchestrator.process_request(
                query, f"affiliate_{affiliate_id}", context
            )
            
            return {
                "recommendations": result.get("recommendations", []),
                "insights": result.get("response", ""),
                "optimization_tips": result.get("items", [])
            }
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            return {}
    
    async def _get_affiliate(self, affiliate_id: str) -> Optional[Dict]:
        """Get affiliate by ID"""
        try:
            if self.ai_engine.db is not None:
                return self.ai_engine.db.affiliates.find_one({"affiliate_id": affiliate_id})
            return None
        except Exception as e:
            logger.error(f"Error getting affiliate: {e}")
            return None
    
    async def _get_affiliate_by_tracking_code(self, tracking_code: str) -> Optional[Dict]:
        """Get affiliate by tracking code"""
        try:
            if self.ai_engine.db is not None:
                return self.ai_engine.db.affiliates.find_one({"tracking_code": tracking_code})
            return None
        except Exception as e:
            logger.error(f"Error getting affiliate by tracking code: {e}")
            return None
    
    async def _get_product_url(self, link_id: str) -> str:
        """Get the actual product URL for redirect"""
        try:
            if self.ai_engine.db is not None:
                link = self.ai_engine.db.affiliate_links.find_one({"link_id": link_id})
                if link:
                    return link.get("base_url", "/")
            return "/"
        except Exception as e:
            logger.error(f"Error getting product URL: {e}")
            return "/"
    
    async def _update_conversion_rate(self, affiliate_id: str):
        """Update affiliate's conversion rate"""
        try:
            if self.ai_engine.db is not None:
                affiliate = self.ai_engine.db.affiliates.find_one({"affiliate_id": affiliate_id})
                if affiliate:
                    metrics = affiliate.get("performance_metrics", {})
                    clicks = metrics.get("clicks", 0)
                    conversions = metrics.get("conversions", 0)
                    
                    conversion_rate = conversions / clicks if clicks > 0 else 0.0
                    
                    self.ai_engine.db.affiliates.update_one(
                        {"affiliate_id": affiliate_id},
                        {"$set": {"performance_metrics.conversion_rate": conversion_rate}}
                    )
                    
        except Exception as e:
            logger.error(f"Error updating conversion rate: {e}")


# Factory function
def create_affiliate_system(ai_engine):
    """Create affiliate system instance"""
    return AffiliateSystem(ai_engine)
