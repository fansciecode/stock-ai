#!/usr/bin/env python3
"""
IBCM AI - IP (Intellectual Property) Management & Monetization
Handles content ownership, licensing, and revenue distribution
"""

import logging
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import hashlib
import uuid
from enum import Enum

logger = logging.getLogger(__name__)

class IPType(Enum):
    """Types of intellectual property"""
    TEXT_CONTENT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    CODE = "code"
    DESIGN = "design"
    BRAND = "brand"
    DATA = "data"

class LicenseType(Enum):
    """Types of licenses"""
    EXCLUSIVE = "exclusive"
    NON_EXCLUSIVE = "non_exclusive"
    ROYALTY_FREE = "royalty_free"
    CREATIVE_COMMONS = "creative_commons"
    CUSTOM = "custom"

class IPManagement:
    """Intellectual Property management and monetization system"""
    
    def __init__(self, config, db, redis_client):
        self.config = config
        self.db = db
        self.redis = redis_client
        self.ip_registry = {}
        self.licensing_contracts = {}
        self.revenue_tracking = {}
        
    async def initialize(self):
        """Initialize IP management system"""
        try:
            logger.info("⚖️ Initializing IP Management System...")
            
            # Initialize IP registry
            await self._initialize_ip_registry()
            
            # Initialize licensing system
            await self._initialize_licensing_system()
            
            # Initialize revenue tracking
            await self._initialize_revenue_tracking()
            
            logger.info("✅ IP Management System ready")
            return True
            
        except Exception as e:
            logger.error(f"❌ IP Management initialization failed: {e}")
            return False
    
    async def _initialize_ip_registry(self):
        """Initialize intellectual property registry"""
        self.ip_registry_config = {
            "hash_algorithm": "sha256",
            "timestamp_authority": "internal",
            "ownership_verification": True,
            "automatic_protection": True,
            "blockchain_integration": False  # Future feature
        }
        
    async def _initialize_licensing_system(self):
        """Initialize licensing and contracts system"""
        self.licensing_config = {
            "default_license_terms": {
                "duration_days": 365,
                "territory": "worldwide",
                "exclusivity": False,
                "attribution_required": True
            },
            "revenue_split_default": {
                "creator": 0.70,
                "platform": 0.25,
                "referrer": 0.05
            },
            "contract_templates": {
                "standard": "standard_licensing_template",
                "exclusive": "exclusive_licensing_template",
                "partnership": "partnership_template"
            }
        }
    
    async def _initialize_revenue_tracking(self):
        """Initialize revenue tracking and distribution"""
        self.revenue_config = {
            "payout_frequency": "monthly",
            "minimum_payout": 10.00,
            "currency_support": ["USD", "EUR", "GBP"],
            "payment_methods": ["bank_transfer", "paypal", "crypto"],
            "tax_handling": "creator_responsible"
        }
    
    async def register_ip(self, content_data: Dict, creator_id: str, ip_type: IPType) -> Dict:
        """Register intellectual property"""
        try:
            # Generate unique IP ID
            ip_id = str(uuid.uuid4())
            content_hash = await self._generate_content_hash(content_data)
            
            # Create IP record
            ip_record = {
                "ip_id": ip_id,
                "creator_id": creator_id,
                "ip_type": ip_type.value,
                "content_hash": content_hash,
                "title": content_data.get("title"),
                "description": content_data.get("description"),
                "tags": content_data.get("tags", []),
                "creation_date": datetime.now().isoformat(),
                "registration_date": datetime.now().isoformat(),
                "status": "registered",
                "metadata": {
                    "file_size": content_data.get("file_size"),
                    "format": content_data.get("format"),
                    "duration": content_data.get("duration"),  # For audio/video
                    "dimensions": content_data.get("dimensions"),  # For images/video
                    "quality": content_data.get("quality")
                },
                "protection": {
                    "automatic_watermark": True,
                    "usage_tracking": True,
                    "unauthorized_detection": True
                },
                "licensing": {
                    "available_for_licensing": content_data.get("allow_licensing", True),
                    "default_license_type": content_data.get("default_license", LicenseType.NON_EXCLUSIVE.value),
                    "base_price": content_data.get("base_price", 0.0),
                    "currency": content_data.get("currency", "USD")
                }
            }
            
            # Store in database
            if self.db is not None:
                await self._store_ip_record(ip_record)
            
            # Store in registry
            self.ip_registry[ip_id] = ip_record
            
            # Cache in Redis for fast access
            if self.redis:
                await self._cache_ip_record(ip_id, ip_record)
            
            logger.info(f"✅ IP registered: {ip_id} for creator {creator_id}")
            
            return {
                "success": True,
                "ip_id": ip_id,
                "content_hash": content_hash,
                "registration_info": {
                    "registered_at": ip_record["registration_date"],
                    "status": ip_record["status"],
                    "protection_enabled": True
                },
                "licensing_info": {
                    "available": ip_record["licensing"]["available_for_licensing"],
                    "base_price": ip_record["licensing"]["base_price"],
                    "currency": ip_record["licensing"]["currency"]
                }
            }
            
        except Exception as e:
            logger.error(f"IP registration failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def create_license(self, ip_id: str, licensee_id: str, license_terms: Dict) -> Dict:
        """Create licensing agreement"""
        try:
            # Verify IP exists
            ip_record = await self._get_ip_record(ip_id)
            if not ip_record:
                return {"success": False, "error": "IP not found"}
            
            # Generate license ID
            license_id = str(uuid.uuid4())
            
            # Create license agreement
            license_agreement = {
                "license_id": license_id,
                "ip_id": ip_id,
                "licensor_id": ip_record["creator_id"],
                "licensee_id": licensee_id,
                "license_type": license_terms.get("type", LicenseType.NON_EXCLUSIVE.value),
                "terms": {
                    "duration_days": license_terms.get("duration_days", 365),
                    "territory": license_terms.get("territory", "worldwide"),
                    "usage_rights": license_terms.get("usage_rights", ["commercial", "modification"]),
                    "attribution_required": license_terms.get("attribution_required", True),
                    "exclusivity": license_terms.get("exclusivity", False)
                },
                "pricing": {
                    "license_fee": license_terms.get("license_fee", 0.0),
                    "royalty_rate": license_terms.get("royalty_rate", 0.0),
                    "minimum_guarantee": license_terms.get("minimum_guarantee", 0.0),
                    "currency": license_terms.get("currency", "USD")
                },
                "revenue_split": license_terms.get("revenue_split", self.licensing_config["revenue_split_default"]),
                "created_date": datetime.now().isoformat(),
                "start_date": license_terms.get("start_date", datetime.now().isoformat()),
                "end_date": self._calculate_end_date(
                    license_terms.get("start_date", datetime.now().isoformat()),
                    license_terms.get("duration_days", 365)
                ),
                "status": "active",
                "usage_tracking": {
                    "enabled": True,
                    "metrics": ["views", "downloads", "revenue"],
                    "reporting_frequency": "monthly"
                }
            }
            
            # Store license agreement
            if self.db is not None:
                await self._store_license_agreement(license_agreement)
            
            self.licensing_contracts[license_id] = license_agreement
            
            # Initialize revenue tracking for this license
            await self._initialize_license_revenue_tracking(license_id)
            
            logger.info(f"✅ License created: {license_id} for IP {ip_id}")
            
            return {
                "success": True,
                "license_id": license_id,
                "license_agreement": license_agreement,
                "next_steps": {
                    "payment_due": license_agreement["pricing"]["license_fee"],
                    "contract_review_period": "7 days",
                    "usage_tracking_starts": license_agreement["start_date"]
                }
            }
            
        except Exception as e:
            logger.error(f"License creation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def track_usage(self, license_id: str, usage_data: Dict) -> Dict:
        """Track usage of licensed content"""
        try:
            license_agreement = await self._get_license_agreement(license_id)
            if not license_agreement:
                return {"success": False, "error": "License not found"}
            
            usage_record = {
                "usage_id": str(uuid.uuid4()),
                "license_id": license_id,
                "ip_id": license_agreement["ip_id"],
                "usage_type": usage_data.get("type", "view"),
                "quantity": usage_data.get("quantity", 1),
                "revenue_generated": usage_data.get("revenue", 0.0),
                "user_id": usage_data.get("user_id"),
                "platform": usage_data.get("platform", "web"),
                "location": usage_data.get("location"),
                "timestamp": datetime.now().isoformat(),
                "metadata": usage_data.get("metadata", {})
            }
            
            # Store usage record
            if self.db is not None:
                await self._store_usage_record(usage_record)
            
            # Update revenue tracking
            await self._update_revenue_tracking(license_id, usage_record)
            
            return {
                "success": True,
                "usage_id": usage_record["usage_id"],
                "tracked_at": usage_record["timestamp"]
            }
            
        except Exception as e:
            logger.error(f"Usage tracking failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def calculate_revenue_distribution(self, license_id: str, period_start: str, period_end: str) -> Dict:
        """Calculate revenue distribution for a licensing period"""
        try:
            license_agreement = await self._get_license_agreement(license_id)
            if not license_agreement:
                return {"success": False, "error": "License not found"}
            
            # Get usage records for period
            usage_records = await self._get_usage_records(license_id, period_start, period_end)
            
            # Calculate total revenue
            total_revenue = sum(record.get("revenue_generated", 0.0) for record in usage_records)
            
            # Apply revenue split
            revenue_split = license_agreement["revenue_split"]
            distribution = {
                "creator": total_revenue * revenue_split["creator"],
                "platform": total_revenue * revenue_split["platform"],
                "referrer": total_revenue * revenue_split.get("referrer", 0.0)
            }
            
            # Add royalty calculations if applicable
            royalty_rate = license_agreement["pricing"]["royalty_rate"]
            if royalty_rate > 0:
                royalty_amount = total_revenue * royalty_rate
                distribution["royalty"] = royalty_amount
            
            revenue_report = {
                "license_id": license_id,
                "period": {"start": period_start, "end": period_end},
                "total_revenue": total_revenue,
                "distribution": distribution,
                "usage_summary": {
                    "total_usage_events": len(usage_records),
                    "usage_types": self._summarize_usage_types(usage_records)
                },
                "payout_info": {
                    "creator_payout": distribution["creator"],
                    "next_payout_date": self._calculate_next_payout_date(),
                    "minimum_reached": distribution["creator"] >= self.revenue_config["minimum_payout"]
                }
            }
            
            return {
                "success": True,
                "revenue_report": revenue_report
            }
            
        except Exception as e:
            logger.error(f"Revenue calculation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_ip_analytics(self, creator_id: str) -> Dict:
        """Get analytics for creator's IP portfolio"""
        try:
            # Get all IP records for creator
            ip_records = await self._get_creator_ip_records(creator_id)
            
            analytics = {
                "portfolio_summary": {
                    "total_ip_count": len(ip_records),
                    "ip_by_type": self._count_ip_by_type(ip_records),
                    "total_portfolio_value": await self._calculate_portfolio_value(ip_records)
                },
                "licensing_performance": {
                    "active_licenses": await self._count_active_licenses(creator_id),
                    "total_revenue_ytd": await self._calculate_ytd_revenue(creator_id),
                    "average_license_value": await self._calculate_avg_license_value(creator_id)
                },
                "usage_insights": {
                    "most_popular_ip": await self._get_most_popular_ip(creator_id),
                    "usage_trends": await self._get_usage_trends(creator_id),
                    "geographic_distribution": await self._get_geographic_usage(creator_id)
                },
                "recommendations": await self._generate_creator_recommendations(creator_id)
            }
            
            return {
                "success": True,
                "creator_id": creator_id,
                "analytics": analytics,
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"IP analytics failed: {e}")
            return {"success": False, "error": str(e)}
    
    # Helper methods
    async def _generate_content_hash(self, content_data: Dict) -> str:
        """Generate hash for content identification"""
        content_string = json.dumps(content_data, sort_keys=True)
        return hashlib.sha256(content_string.encode()).hexdigest()
    
    async def _store_ip_record(self, ip_record: Dict):
        """Store IP record in database"""
        if self.db is not None:
            await self.db.ip_registry.insert_one(ip_record)
    
    async def _cache_ip_record(self, ip_id: str, ip_record: Dict):
        """Cache IP record in Redis"""
        if self.redis:
            await self.redis.setex(f"ip:{ip_id}", 3600, json.dumps(ip_record))
    
    async def _get_ip_record(self, ip_id: str) -> Optional[Dict]:
        """Get IP record by ID"""
        if ip_id in self.ip_registry:
            return self.ip_registry[ip_id]
        
        if self.redis:
            cached = await self.redis.get(f"ip:{ip_id}")
            if cached:
                return json.loads(cached)
        
        if self.db is not None:
            return await self.db.ip_registry.find_one({"ip_id": ip_id})
        
        return None
    
    def _calculate_end_date(self, start_date: str, duration_days: int) -> str:
        """Calculate license end date"""
        start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        end = start + timedelta(days=duration_days)
        return end.isoformat()
    
    async def _store_license_agreement(self, agreement: Dict):
        """Store license agreement"""
        if self.db is not None:
            await self.db.licensing_agreements.insert_one(agreement)
    
    async def _get_license_agreement(self, license_id: str) -> Optional[Dict]:
        """Get license agreement by ID"""
        if license_id in self.licensing_contracts:
            return self.licensing_contracts[license_id]
        
        if self.db is not None:
            return await self.db.licensing_agreements.find_one({"license_id": license_id})
        
        return None
    
    async def _initialize_license_revenue_tracking(self, license_id: str):
        """Initialize revenue tracking for license"""
        tracking_record = {
            "license_id": license_id,
            "total_revenue": 0.0,
            "total_usage": 0,
            "last_updated": datetime.now().isoformat()
        }
        self.revenue_tracking[license_id] = tracking_record
    
    # Placeholder methods for analytics (would be implemented with real data)
    async def _get_creator_ip_records(self, creator_id: str) -> List[Dict]:
        """Get all IP records for a creator"""
        return []  # Placeholder
    
    def _count_ip_by_type(self, ip_records: List[Dict]) -> Dict:
        """Count IP by type"""
        return {}  # Placeholder
    
    async def _calculate_portfolio_value(self, ip_records: List[Dict]) -> float:
        """Calculate total portfolio value"""
        return 0.0  # Placeholder
    
    # Additional placeholder methods...
    async def _count_active_licenses(self, creator_id: str) -> int:
        return 0
    
    async def _calculate_ytd_revenue(self, creator_id: str) -> float:
        return 0.0
    
    async def _calculate_avg_license_value(self, creator_id: str) -> float:
        return 0.0
    
    async def _get_most_popular_ip(self, creator_id: str) -> Dict:
        return {}
    
    async def _get_usage_trends(self, creator_id: str) -> Dict:
        return {}
    
    async def _get_geographic_usage(self, creator_id: str) -> Dict:
        return {}
    
    async def _generate_creator_recommendations(self, creator_id: str) -> List[str]:
        return []

def create_ip_management(config, db, redis_client) -> IPManagement:
    """Factory function to create IP management system"""
    return IPManagement(config, db, redis_client)
