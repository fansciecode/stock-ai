#!/usr/bin/env python3
"""
IBCM AI - Real-Time Price Exchange System
Stock Exchange Model for Dynamic Pricing of Products & Services
"""

import asyncio
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import random
import time
from dataclasses import dataclass
import redis
from pymongo import MongoClient

logger = logging.getLogger(__name__)

@dataclass
class PriceOffer:
    """Real-time price offer from a provider"""
    provider_id: str
    provider_name: str
    service_type: str  # pub, restaurant, hotel, service, product
    original_price: float
    current_price: float
    discount_percentage: float
    available_until: datetime
    location: Dict[str, float]  # lat, lon
    city: str
    deal_type: str  # last_minute, flash_sale, price_drop, limited_time
    capacity_remaining: int
    urgency_score: float  # 0-1, higher = more urgent
    quality_rating: float  # 1-5 stars
    
class RealTimePriceExchange:
    """
    Real-time stock exchange model for all products and services
    - Pubs offering different prices at specific times
    - Restaurants with last-minute deals
    - Hotels with price drops
    - Services with flash sales
    - Products with dynamic pricing
    """
    
    def __init__(self, config):
        self.config = config
        
        # Redis for real-time price updates
        try:
            self.redis_client = redis.Redis.from_url(config.REDIS_URL)
            self.redis_client.ping()
            self.redis_available = True
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
            self.redis_client = None
            self.redis_available = False
        
        # MongoDB for historical data
        try:
            self.mongo_client = MongoClient(config.MONGO_URI)
            self.db = self.mongo_client[config.DB_NAME]
            self.mongo_client.admin.command('ping')
            self.mongo_available = True
        except Exception as e:
            logger.warning(f"MongoDB not available: {e}")
            self.mongo_client = None
            self.db = None
            self.mongo_available = False
        
        # Price exchange channels
        self.price_channels = {
            "pubs": "price_exchange:pubs",
            "restaurants": "price_exchange:restaurants", 
            "hotels": "price_exchange:hotels",
            "services": "price_exchange:services",
            "products": "price_exchange:products",
            "events": "price_exchange:events",
            "transport": "price_exchange:transport"
        }
        
        # Simulated providers for demo
        self.demo_providers = self._initialize_demo_providers()
        
        # Start real-time price updates
        asyncio.create_task(self._start_price_updates())
    
    def _initialize_demo_providers(self) -> Dict[str, List[Dict]]:
        """Initialize demo providers for different cities and services"""
        return {
            "pubs": [
                {"id": "pub_001", "name": "The Golden Lion", "city": "London", "base_price": 45.0, "location": {"lat": 51.5074, "lon": -0.1278}},
                {"id": "pub_002", "name": "Murphy's Irish Pub", "city": "London", "base_price": 38.0, "location": {"lat": 51.5145, "lon": -0.1270}},
                {"id": "pub_003", "name": "The Red Dragon", "city": "London", "base_price": 52.0, "location": {"lat": 51.5033, "lon": -0.1195}},
                {"id": "pub_004", "name": "Craft Beer House", "city": "New York", "base_price": 55.0, "location": {"lat": 40.7128, "lon": -74.0060}},
                {"id": "pub_005", "name": "Brooklyn Tavern", "city": "New York", "base_price": 48.0, "location": {"lat": 40.6782, "lon": -73.9442}},
            ],
            "restaurants": [
                {"id": "rest_001", "name": "Bella Italia", "city": "Paris", "base_price": 85.0, "location": {"lat": 48.8566, "lon": 2.3522}},
                {"id": "rest_002", "name": "Sushi Master", "city": "Tokyo", "base_price": 120.0, "location": {"lat": 35.6762, "lon": 139.6503}},
                {"id": "rest_003", "name": "Steakhouse Prime", "city": "Chicago", "base_price": 95.0, "location": {"lat": 41.8781, "lon": -87.6298}},
                {"id": "rest_004", "name": "Café Montmartre", "city": "Paris", "base_price": 65.0, "location": {"lat": 48.8864, "lon": 2.3434}},
            ],
            "hotels": [
                {"id": "hotel_001", "name": "Grand Plaza Hotel", "city": "London", "base_price": 250.0, "location": {"lat": 51.5074, "lon": -0.1278}},
                {"id": "hotel_002", "name": "Boutique Stay", "city": "Paris", "base_price": 180.0, "location": {"lat": 48.8566, "lon": 2.3522}},
                {"id": "hotel_003", "name": "Business Inn", "city": "New York", "base_price": 320.0, "location": {"lat": 40.7589, "lon": -73.9851}},
            ],
            "services": [
                {"id": "serv_001", "name": "City Spa & Wellness", "city": "Miami", "base_price": 150.0, "location": {"lat": 25.7617, "lon": -80.1918}},
                {"id": "serv_002", "name": "Personal Training Pro", "city": "Los Angeles", "base_price": 80.0, "location": {"lat": 34.0522, "lon": -118.2437}},
                {"id": "serv_003", "name": "Home Cleaning Express", "city": "Seattle", "base_price": 120.0, "location": {"lat": 47.6062, "lon": -122.3321}},
            ]
        }
    
    async def get_real_time_offers(self, query: str, user_location: Dict, service_types: List[str] = None) -> List[PriceOffer]:
        """Get real-time price offers based on user query and location"""
        try:
            city = self._detect_city_from_query_or_location(query, user_location)
            
            if service_types is None:
                service_types = self._detect_service_types_from_query(query)
            
            all_offers = []
            
            for service_type in service_types:
                offers = await self._get_service_offers(service_type, city, user_location)
                all_offers.extend(offers)
            
            # Sort by urgency score and discount
            sorted_offers = sorted(all_offers, 
                                 key=lambda x: (x.urgency_score, x.discount_percentage), 
                                 reverse=True)
            
            return sorted_offers[:20]  # Return top 20 offers
            
        except Exception as e:
            logger.error(f"Error getting real-time offers: {e}")
            return []
    
    async def _get_service_offers(self, service_type: str, city: str, user_location: Dict) -> List[PriceOffer]:
        """Get offers for specific service type in city"""
        offers = []
        
        providers = self.demo_providers.get(service_type, [])
        city_providers = [p for p in providers if p["city"].lower() == city.lower()]
        
        if not city_providers:
            # If no exact city match, use all providers as examples
            city_providers = providers[:3]
        
        current_time = datetime.now()
        
        for provider in city_providers:
            # Generate dynamic pricing based on time, demand, etc.
            price_variations = self._calculate_dynamic_pricing(provider, current_time, service_type)
            
            for variation in price_variations:
                offer = PriceOffer(
                    provider_id=provider["id"],
                    provider_name=provider["name"],
                    service_type=service_type,
                    original_price=provider["base_price"],
                    current_price=variation["current_price"],
                    discount_percentage=variation["discount_percentage"],
                    available_until=variation["available_until"],
                    location=provider["location"],
                    city=provider["city"],
                    deal_type=variation["deal_type"],
                    capacity_remaining=variation["capacity_remaining"],
                    urgency_score=variation["urgency_score"],
                    quality_rating=random.uniform(4.0, 5.0)
                )
                offers.append(offer)
        
        return offers
    
    def _calculate_dynamic_pricing(self, provider: Dict, current_time: datetime, service_type: str) -> List[Dict]:
        """Calculate dynamic pricing variations based on real-time factors"""
        base_price = provider["base_price"]
        variations = []
        
        # Time-based pricing (happy hour, off-peak, etc.)
        hour = current_time.hour
        
        if service_type == "pubs":
            if 17 <= hour <= 19:  # Happy hour
                variations.append({
                    "current_price": base_price * 0.7,
                    "discount_percentage": 30,
                    "deal_type": "happy_hour",
                    "available_until": current_time + timedelta(hours=2),
                    "capacity_remaining": random.randint(5, 15),
                    "urgency_score": 0.8
                })
            elif 21 <= hour <= 23:  # Late night deals
                variations.append({
                    "current_price": base_price * 0.8,
                    "discount_percentage": 20,
                    "deal_type": "late_night_special",
                    "available_until": current_time + timedelta(hours=1),
                    "capacity_remaining": random.randint(3, 10),
                    "urgency_score": 0.9
                })
        
        elif service_type == "restaurants":
            if 14 <= hour <= 16:  # Lunch deals
                variations.append({
                    "current_price": base_price * 0.75,
                    "discount_percentage": 25,
                    "deal_type": "lunch_special",
                    "available_until": current_time + timedelta(hours=2),
                    "capacity_remaining": random.randint(8, 20),
                    "urgency_score": 0.7
                })
            elif hour >= 21:  # Last-minute dinner
                variations.append({
                    "current_price": base_price * 0.65,
                    "discount_percentage": 35,
                    "deal_type": "last_minute_dinner",
                    "available_until": current_time + timedelta(minutes=30),
                    "capacity_remaining": random.randint(2, 6),
                    "urgency_score": 0.95
                })
        
        elif service_type == "hotels":
            # Same-day booking deals
            variations.append({
                "current_price": base_price * 0.6,
                "discount_percentage": 40,
                "deal_type": "same_day_booking",
                "available_until": current_time + timedelta(hours=6),
                "capacity_remaining": random.randint(1, 4),
                "urgency_score": 0.85
            })
            
            # Weekly deals
            if current_time.weekday() in [0, 1, 2]:  # Monday-Wednesday
                variations.append({
                    "current_price": base_price * 0.75,
                    "discount_percentage": 25,
                    "deal_type": "weekday_special",
                    "available_until": current_time + timedelta(days=1),
                    "capacity_remaining": random.randint(5, 12),
                    "urgency_score": 0.6
                })
        
        elif service_type == "services":
            # Flash sales for services
            variations.append({
                "current_price": base_price * 0.5,
                "discount_percentage": 50,
                "deal_type": "flash_sale",
                "available_until": current_time + timedelta(hours=2),
                "capacity_remaining": random.randint(1, 3),
                "urgency_score": 0.95
            })
        
        # Always add regular pricing
        variations.append({
            "current_price": base_price,
            "discount_percentage": 0,
            "deal_type": "regular_pricing",
            "available_until": current_time + timedelta(days=1),
            "capacity_remaining": random.randint(10, 50),
            "urgency_score": 0.3
        })
        
        return variations
    
    def _detect_city_from_query_or_location(self, query: str, user_location: Dict) -> str:
        """Detect city from query or user location"""
        cities = ["London", "Paris", "New York", "Tokyo", "Chicago", "Miami", "Los Angeles", "Seattle"]
        
        query_lower = query.lower()
        for city in cities:
            if city.lower() in query_lower:
                return city
        
        # Default based on user preference or location
        return user_location.get("city", "London")
    
    def _detect_service_types_from_query(self, query: str) -> List[str]:
        """Detect service types from user query"""
        query_lower = query.lower()
        detected_types = []
        
        if any(word in query_lower for word in ["pub", "bar", "drink", "beer", "alcohol"]):
            detected_types.append("pubs")
        
        if any(word in query_lower for word in ["restaurant", "food", "eat", "dinner", "lunch", "meal"]):
            detected_types.append("restaurants")
        
        if any(word in query_lower for word in ["hotel", "stay", "accommodation", "room", "booking"]):
            detected_types.append("hotels")
        
        if any(word in query_lower for word in ["service", "spa", "massage", "cleaning", "training"]):
            detected_types.append("services")
        
        # If no specific type detected, return all
        if not detected_types:
            detected_types = ["pubs", "restaurants", "hotels", "services"]
        
        return detected_types
    
    async def _start_price_updates(self):
        """Start background task for real-time price updates"""
        if not self.redis_available:
            return
        
        try:
            while True:
                await self._update_all_prices()
                await asyncio.sleep(30)  # Update every 30 seconds
        except Exception as e:
            logger.error(f"Price update task error: {e}")
    
    async def _update_all_prices(self):
        """Update all prices in real-time"""
        try:
            current_time = datetime.now()
            
            for service_type in self.price_channels.keys():
                providers = self.demo_providers.get(service_type, [])
                
                for provider in providers:
                    # Simulate price fluctuations
                    variations = self._calculate_dynamic_pricing(provider, current_time, service_type)
                    
                    # Store in Redis for real-time access
                    for variation in variations:
                        price_key = f"{self.price_channels[service_type]}:{provider['id']}:{variation['deal_type']}"
                        price_data = {
                            "provider_id": provider["id"],
                            "provider_name": provider["name"],
                            "current_price": variation["current_price"],
                            "discount_percentage": variation["discount_percentage"],
                            "deal_type": variation["deal_type"],
                            "available_until": variation["available_until"].isoformat(),
                            "capacity_remaining": variation["capacity_remaining"],
                            "urgency_score": variation["urgency_score"],
                            "updated_at": current_time.isoformat()
                        }
                        
                        if self.redis_available:
                            self.redis_client.setex(
                                price_key,
                                3600,  # Expire in 1 hour
                                json.dumps(price_data)
                            )
                            
        except Exception as e:
            logger.error(f"Error updating prices: {e}")
    
    async def get_flash_deals(self, service_type: str = None, city: str = None) -> List[PriceOffer]:
        """Get current flash deals and last-minute offers"""
        try:
            all_deals = []
            current_time = datetime.now()
            
            service_types = [service_type] if service_type else list(self.demo_providers.keys())
            
            for stype in service_types:
                providers = self.demo_providers.get(stype, [])
                
                if city:
                    providers = [p for p in providers if p["city"].lower() == city.lower()]
                
                for provider in providers:
                    variations = self._calculate_dynamic_pricing(provider, current_time, stype)
                    
                    # Only include high-urgency deals
                    flash_deals = [v for v in variations if v["urgency_score"] > 0.8]
                    
                    for deal in flash_deals:
                        offer = PriceOffer(
                            provider_id=provider["id"],
                            provider_name=provider["name"],
                            service_type=stype,
                            original_price=provider["base_price"],
                            current_price=deal["current_price"],
                            discount_percentage=deal["discount_percentage"],
                            available_until=deal["available_until"],
                            location=provider["location"],
                            city=provider["city"],
                            deal_type=deal["deal_type"],
                            capacity_remaining=deal["capacity_remaining"],
                            urgency_score=deal["urgency_score"],
                            quality_rating=random.uniform(4.0, 5.0)
                        )
                        all_deals.append(offer)
            
            # Sort by urgency and discount
            return sorted(all_deals, key=lambda x: (x.urgency_score, x.discount_percentage), reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting flash deals: {e}")
            return []
    
    async def track_price_changes(self, provider_id: str, service_type: str) -> Dict[str, Any]:
        """Track price changes for a specific provider"""
        try:
            if not self.mongo_available:
                return {"error": "Historical data not available"}
            
            # Get historical pricing data
            collection = self.db.price_history
            history = list(collection.find(
                {"provider_id": provider_id, "service_type": service_type}
            ).sort("timestamp", -1).limit(24))  # Last 24 data points
            
            if not history:
                return {"message": "No historical data available"}
            
            # Calculate trends
            prices = [h["current_price"] for h in history]
            avg_price = sum(prices) / len(prices)
            min_price = min(prices)
            max_price = max(prices)
            current_price = prices[0] if prices else 0
            
            return {
                "provider_id": provider_id,
                "service_type": service_type,
                "current_price": current_price,
                "average_price_24h": avg_price,
                "min_price_24h": min_price,
                "max_price_24h": max_price,
                "price_trend": "up" if current_price > avg_price else "down",
                "volatility": max_price - min_price,
                "data_points": len(history)
            }
            
        except Exception as e:
            logger.error(f"Error tracking price changes: {e}")
            return {"error": str(e)}

def create_real_time_price_exchange(config):
    """Factory function to create price exchange"""
    return RealTimePriceExchange(config)
