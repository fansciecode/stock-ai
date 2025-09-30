#!/usr/bin/env python3
"""
IBCM AI - Spatio-Temporal Intelligence Engine
Real-time location + time awareness for dynamic opportunity discovery
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import math
import random
from dataclasses import dataclass
import json
import redis
from pymongo import MongoClient

logger = logging.getLogger(__name__)

@dataclass
class LiveOpportunity:
    """Real-time opportunity within user's vicinity"""
    opportunity_id: str
    title: str
    category: str
    subcategory: str
    description: str
    business_name: str
    location: Dict[str, float]  # lat, lon
    distance_meters: float
    current_offer: str
    original_price: float
    discounted_price: float
    discount_percentage: float
    valid_until: datetime
    urgency_score: float  # 0-1
    availability: str  # "high", "medium", "low", "last_chance"
    time_sensitive: bool
    booking_required: bool
    contact_info: Dict[str, str]
    live_status: str  # "active", "ending_soon", "fully_booked"

@dataclass  
class UserContext:
    """User's current spatio-temporal context"""
    user_id: str
    current_location: Dict[str, float]
    current_time: datetime
    day_of_week: str
    time_of_day: str  # morning, afternoon, evening, night
    weather: Optional[str]
    user_behavior_pattern: Dict[str, Any]
    recent_searches: List[str]
    preferences: List[str]
    budget_range: Dict[str, float]

class SpatioTemporalEngine:
    """
    Real-time spatio-temporal intelligence for opportunity discovery
    - Captures live activities happening RIGHT NOW
    - Provides hyper-local recommendations within immediate vicinity  
    - Learns user behavior patterns for predictive suggestions
    - Handles time-sensitive offers and dynamic pricing
    """
    
    def __init__(self, config):
        self.config = config
        
        # Database connections
        try:
            self.redis_client = redis.Redis.from_url(config.REDIS_URL)
            self.redis_client.ping()
            self.redis_available = True
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
            self.redis_client = None
            self.redis_available = False
            
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
        
        # Categories from your schema
        self.categories = self._load_categories()
        
        # Demo live opportunities
        self.live_opportunities = self._initialize_live_opportunities()
        
        # Start real-time opportunity updates
        asyncio.create_task(self._start_opportunity_updates())
    
    def _load_categories(self) -> Dict[str, List[str]]:
        """Load the comprehensive category schema you provided"""
        return {
            "Sports & Activities": [
                "Racing", "Badminton", "Horse Riding", "Cycling", "Online Gaming",
                "Football", "Basketball", "Swimming", "Cricket", "Tennis",
                "Adventure Sports (Paragliding, Bungee Jumping, Skydiving)"
            ],
            "Cultural & Arts": [
                "Visual Arts (Painting, Sculpting)",
                "Dance Performances (Ballet, Hip-Hop, Traditional)",
                "Music Concerts & Live Bands", "Literature & Poetry Readings",
                "Traditional & Folk Events", "Exhibitions & Art Galleries"
            ],
            "Entertainment & Nightlife": [
                "Comedy Shows", "Movie Screenings", "Theatre & Drama",
                "Music Festivals", "Clubbing & Nightlife Events",
                "Stand-up Comedy", "DJ Nights & Parties"
            ],
            "Health & Fitness": [
                "Gym & Personal Training", "Yoga & Meditation Classes",
                "Martial Arts & Self-Defense", "CrossFit & HIIT",
                "Diet & Nutrition Consultation", "Alternative Healing (Reiki, Ayurveda)"
            ],
            "Fashion & Beauty": [
                "Salons & Haircuts", "Spa & Wellness Centers",
                "Clothing & Fashion Exhibitions", "Makeup & Beauty Services",
                "Jewellery Stores & Fashion Accessories",
                "Individual Beauticians & Home Beauty Services"
            ],
            "Hospitality & Tourism": [
                "Hotels & Resorts", "Guest Houses & PGs",
                "Hostels & Backpacker Lodges", "Travel Agencies & Tour Packages",
                "Airport & Local Transport Services"
            ],
            "Food & Beverages": [
                "Restaurants & New Menu Launches", "Food Festivals & Tasting Events",
                "Cooking & Baking Classes", "Local Food Stalls & Desserts",
                "Wine & Beer Tasting", "Breakfast & Brunch Deals",
                "Meat & Fresh Grocery Stores"
            ],
            "Cargo, Transport & Logistics": [
                "Courier & Delivery Services", "Transport & Moving Services",
                "Cargo & Freight Management", "Bike & Car Rentals"
            ],
            "Retail & Shopping": [
                "Household Needs & Daily Essentials", "Electronics & Gadgets",
                "Home Decor & Interiors", "Real Estate & Property Deals",
                "Kitchen Appliances & Utensils", "Gardening & Outdoor Supplies",
                "Furniture & Custom Interiors", "Marble & Construction Materials"
            ],
            "Education & Courses": [
                "Schools & College Events", "Online & Offline Courses",
                "Skill Development Workshops", "Competitive Exam Coaching",
                "Coding & Tech Training", "Language Learning Programs"
            ],
            "Corporate & Professional Services": [
                "Business Conferences & Networking", "Digital Marketing & Advertising Services",
                "Startup Incubators & Fundraising Events", "Professional Training & Certifications",
                "Legal & Consultancy Services"
            ],
            "Virtual Events & Online Services": [
                "Online Webinars & Workshops", "Virtual Meetups & Conferences",
                "Digital Networking Events", "E-commerce & Dropshipping Promotions"
            ],
            "Buy & Rentals (E-commerce & Marketplace)": [
                "House Rentals & Real Estate", "Car & Bike Rentals",
                "Pre-owned Goods (Mobiles, Furniture, Electronics)",
                "Property Listings & PG Rentals"
            ],
            "Social Services & Community Support": [
                "Charity Drives & Fundraisers", "NGO & Community Events",
                "Blood Donation Camps", "Welfare & Social Work Events"
            ],
            "Pets & Animal Services": [
                "Pet Adoption & Rescue Events", "Pet Grooming & Veterinary Services",
                "Pet Training & Boarding Services"
            ],
            "Individual & Home Services": [
                "House Cleaning & Maintenance", "Electrician & Plumbing Services",
                "Carpentry & Home Repairs", "Daycare & Babysitting Services",
                "Personal Drivers & Chauffeurs"
            ],
            "Virtual Events & Online Services": [
                "Online Webinars & Workshops", "Virtual Meetups & Conferences",
                "Digital Networking Events", "E-commerce & Dropshipping Promotions",
                "Online Lectures & Educational Sessions", "Virtual Training Programs",
                "Remote Consultations & Advisory", "Live Streaming Events",
                "Virtual Reality Experiences", "Online Gaming Tournaments",
                "Digital Art & Design Workshops", "Coding Bootcamps & Tech Sessions",
                "Virtual Fitness & Yoga Classes", "Online Music Lessons",
                "Remote Language Learning", "Virtual Career Counseling",
                "Online Investment & Trading Sessions", "Digital Marketing Masterclasses",
                "Virtual Book Clubs & Reading Sessions", "Online Meditation & Wellness"
            ]
        }
    
    def _initialize_live_opportunities(self) -> List[LiveOpportunity]:
        """Initialize demo live opportunities for all categories"""
        opportunities = []
        current_time = datetime.now()
        
        # Sample opportunities across all your categories
        sample_opportunities = [
            # Individual & Home Services
            {
                "title": "Emergency Plumber Available Now",
                "category": "Individual & Home Services",
                "subcategory": "Electrician & Plumbing Services",
                "description": "Emergency plumber available for immediate service call",
                "business_name": "QuickFix Plumbing",
                "location": {"lat": 12.9716, "lon": 77.5946},  # Bangalore
                "current_offer": "No extra charges for emergency call",
                "original_price": 500.0,
                "discounted_price": 500.0,
                "discount_percentage": 0,
                "valid_until": current_time + timedelta(hours=2),
                "urgency_score": 0.9,
                "availability": "high",
                "time_sensitive": True,
                "booking_required": True
            },
            {
                "title": "House Cleaning Service - Today Only 20% Off",
                "category": "Individual & Home Services", 
                "subcategory": "House Cleaning & Maintenance",
                "description": "Professional house cleaning service with 20% discount for today",
                "business_name": "CleanPro Services",
                "location": {"lat": 12.9716, "lon": 77.5946},
                "current_offer": "20% off on full house cleaning",
                "original_price": 1500.0,
                "discounted_price": 1200.0,
                "discount_percentage": 20,
                "valid_until": current_time + timedelta(hours=8),
                "urgency_score": 0.7,
                "availability": "medium",
                "time_sensitive": True,
                "booking_required": True
            },
            
            # Transport & Logistics
            {
                "title": "Bike Rental - 2 Available Nearby",
                "category": "Cargo, Transport & Logistics",
                "subcategory": "Bike & Car Rentals", 
                "description": "Royal Enfield available for hourly rental",
                "business_name": "RideEasy Rentals",
                "location": {"lat": 12.9716, "lon": 77.5946},
                "current_offer": "₹50/hour, 2 bikes available",
                "original_price": 60.0,
                "discounted_price": 50.0,
                "discount_percentage": 17,
                "valid_until": current_time + timedelta(hours=6),
                "urgency_score": 0.6,
                "availability": "low",
                "time_sensitive": False,
                "booking_required": True
            },
            
            # Retail & Shopping
            {
                "title": "Electronics Store - 30% Off Laptops Today",
                "category": "Retail & Shopping",
                "subcategory": "Electronics & Gadgets",
                "description": "Flash sale on all laptops, today only",
                "business_name": "TechZone Electronics",
                "location": {"lat": 12.9716, "lon": 77.5946},
                "current_offer": "30% off all laptops",
                "original_price": 50000.0,
                "discounted_price": 35000.0,
                "discount_percentage": 30,
                "valid_until": current_time + timedelta(hours=10),
                "urgency_score": 0.8,
                "availability": "medium",
                "time_sensitive": True,
                "booking_required": False
            },
            
            # Food & Beverages
            {
                "title": "Happy Hour Started - 50% Off Drinks",
                "category": "Food & Beverages",
                "subcategory": "Wine & Beer Tasting",
                "description": "Happy hour at rooftop bar with 50% off all drinks",
                "business_name": "SkyLounge Bar",
                "location": {"lat": 12.9716, "lon": 77.5946},
                "current_offer": "50% off all drinks until 7 PM",
                "original_price": 300.0,
                "discounted_price": 150.0,
                "discount_percentage": 50,
                "valid_until": current_time + timedelta(hours=3),
                "urgency_score": 0.95,
                "availability": "high",
                "time_sensitive": True,
                "booking_required": False
            },
            
            # Pets & Animal Services
            {
                "title": "Pet Grooming Walk-in Available",
                "category": "Pets & Animal Services",
                "subcategory": "Pet Grooming & Veterinary Services",
                "description": "Pet grooming service with immediate availability",
                "business_name": "PetCare Grooming",
                "location": {"lat": 12.9716, "lon": 77.5946},
                "current_offer": "Walk-in grooming service available",
                "original_price": 800.0,
                "discounted_price": 600.0,
                "discount_percentage": 25,
                "valid_until": current_time + timedelta(hours=4),
                "urgency_score": 0.5,
                "availability": "high",
                "time_sensitive": False,
                "booking_required": False
            },
            
            # Virtual Events & Online Services
            {
                "title": "Live Coding Bootcamp - Starting in 30 minutes",
                "category": "Virtual Events & Online Services",
                "subcategory": "Coding Bootcamps & Tech Sessions",
                "description": "Interactive Python programming bootcamp with live instructor",
                "business_name": "TechMaster Academy",
                "location": {"lat": 0.0, "lon": 0.0},  # Virtual/online
                "current_offer": "Join live session - 50% off today only",
                "original_price": 2000.0,
                "discounted_price": 1000.0,
                "discount_percentage": 50,
                "valid_until": current_time + timedelta(minutes=30),
                "urgency_score": 0.95,
                "availability": "high",
                "time_sensitive": True,
                "booking_required": True
            },
            {
                "title": "Investment Masterclass - Live Q&A Session",
                "category": "Virtual Events & Online Services", 
                "subcategory": "Online Investment & Trading Sessions",
                "description": "Live masterclass on stock market investing with expert trader",
                "business_name": "WealthBuilder Institute",
                "location": {"lat": 0.0, "lon": 0.0},  # Virtual/online
                "current_offer": "Free live session - limited seats",
                "original_price": 500.0,
                "discounted_price": 0.0,
                "discount_percentage": 100,
                "valid_until": current_time + timedelta(hours=2),
                "urgency_score": 0.8,
                "availability": "medium",
                "time_sensitive": True,
                "booking_required": True
            },
            {
                "title": "Online Yoga & Meditation - Morning Session",
                "category": "Virtual Events & Online Services",
                "subcategory": "Virtual Fitness & Yoga Classes",
                "description": "Guided morning yoga and meditation session via video call",
                "business_name": "ZenLife Wellness",
                "location": {"lat": 0.0, "lon": 0.0},  # Virtual/online
                "current_offer": "First session free for new members",
                "original_price": 300.0,
                "discounted_price": 0.0,
                "discount_percentage": 100,
                "valid_until": current_time + timedelta(hours=1),
                "urgency_score": 0.7,
                "availability": "high",
                "time_sensitive": True,
                "booking_required": True
            },
            {
                "title": "Digital Marketing Workshop - Starting Now",
                "category": "Virtual Events & Online Services",
                "subcategory": "Digital Marketing Masterclasses",
                "description": "Live workshop on social media marketing strategies",
                "business_name": "MarketPro Academy",
                "location": {"lat": 0.0, "lon": 0.0},  # Virtual/online
                "current_offer": "Early bird pricing - 30% off",
                "original_price": 1500.0,
                "discounted_price": 1050.0,
                "discount_percentage": 30,
                "valid_until": current_time + timedelta(minutes=15),
                "urgency_score": 0.9,
                "availability": "low",
                "time_sensitive": True,
                "booking_required": True
            }
        ]
        
        for opp_data in sample_opportunities:
            opportunity = LiveOpportunity(
                opportunity_id=f"opp_{random.randint(1000, 9999)}",
                title=opp_data["title"],
                category=opp_data["category"],
                subcategory=opp_data["subcategory"],
                description=opp_data["description"],
                business_name=opp_data["business_name"],
                location=opp_data["location"],
                distance_meters=random.randint(100, 2000),
                current_offer=opp_data["current_offer"],
                original_price=opp_data["original_price"],
                discounted_price=opp_data["discounted_price"],
                discount_percentage=opp_data["discount_percentage"],
                valid_until=opp_data["valid_until"],
                urgency_score=opp_data["urgency_score"],
                availability=opp_data["availability"],
                time_sensitive=opp_data["time_sensitive"],
                booking_required=opp_data["booking_required"],
                contact_info={"phone": "+91-9999999999", "whatsapp": "+91-9999999999"},
                live_status="active"
            )
            opportunities.append(opportunity)
        
        return opportunities
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        R = 6371000  # Earth's radius in meters
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    async def discover_live_opportunities(self, user_context: UserContext, radius_km: float = 5.0) -> List[LiveOpportunity]:
        """
        Discover live opportunities within user's vicinity
        This is the core of your vision - real-time opportunity discovery
        """
        user_lat = user_context.current_location["lat"]
        user_lon = user_context.current_location["lon"]
        radius_meters = radius_km * 1000
        
        nearby_opportunities = []
        
        for opportunity in self.live_opportunities:
            # Handle virtual events (no physical location)
            if opportunity.location["lat"] == 0.0 and opportunity.location["lon"] == 0.0:
                # Virtual event - always "nearby" regardless of user location
                opportunity.distance_meters = 0.0
                
                # Check if still valid
                if opportunity.valid_until > user_context.current_time:
                    nearby_opportunities.append(opportunity)
            else:
                # Physical location - calculate distance
                distance = self.calculate_distance(
                    user_lat, user_lon,
                    opportunity.location["lat"], opportunity.location["lon"]
                )
                
                # Filter by radius
                if distance <= radius_meters:
                    opportunity.distance_meters = distance
                    
                    # Check if still valid
                    if opportunity.valid_until > user_context.current_time:
                        nearby_opportunities.append(opportunity)
        
        # Sort by relevance (urgency + proximity + time sensitivity)
        nearby_opportunities.sort(
            key=lambda x: (
                x.urgency_score * 0.4 +
                (1 - x.distance_meters / radius_meters) * 0.3 +
                (1 if x.time_sensitive else 0) * 0.3
            ),
            reverse=True
        )
        
        return nearby_opportunities[:20]  # Return top 20 opportunities
    
    async def get_context_aware_recommendations(self, user_context: UserContext) -> Dict[str, Any]:
        """
        Get recommendations based on user's current spatio-temporal context
        This addresses your core use case - awareness of surroundings
        """
        current_time = user_context.current_time
        time_of_day = self._get_time_of_day(current_time)
        day_of_week = current_time.strftime("%A")
        
        # Discover live opportunities
        opportunities = await self.discover_live_opportunities(user_context)
        
        # Context-specific insights
        context_insights = []
        
        if time_of_day == "afternoon" and day_of_week == "Friday":
            context_insights.append("Friday afternoon is perfect for planning weekend activities!")
        
        if time_of_day == "evening":
            context_insights.append("Evening is great for dining and entertainment options.")
        
        if opportunities:
            urgent_opportunities = [opp for opp in opportunities if opp.urgency_score > 0.8]
            if urgent_opportunities:
                context_insights.append(f"🚨 {len(urgent_opportunities)} time-sensitive opportunities ending soon!")
        
        # Behavioral predictions
        predictions = await self._predict_user_interests(user_context, opportunities)
        
        return {
            "current_context": {
                "location": f"📍 {user_context.current_location}",
                "time": f"⏰ {current_time.strftime('%I:%M %p')}",
                "day": f"📅 {day_of_week}",
                "time_of_day": time_of_day
            },
            "live_opportunities": [
                {
                    "opportunity_id": opp.opportunity_id,
                    "title": opp.title,
                    "category": opp.category,
                    "subcategory": opp.subcategory,
                    "business_name": opp.business_name,
                    "distance": f"{int(opp.distance_meters)}m away",
                    "current_offer": opp.current_offer,
                    "savings": f"Save ₹{int(opp.original_price - opp.discounted_price)}",
                    "urgency": "🔥 Ending soon!" if opp.urgency_score > 0.8 else "⏰ Limited time",
                    "time_remaining": str(opp.valid_until - current_time),
                    "can_book_now": opp.booking_required,
                    "contact": opp.contact_info
                } for opp in opportunities
            ],
            "context_insights": context_insights,
            "behavioral_predictions": predictions,
            "total_opportunities": len(opportunities),
            "urgent_count": len([opp for opp in opportunities if opp.urgency_score > 0.8]),
            "categories_available": list(set([opp.category for opp in opportunities]))
        }
    
    def _get_time_of_day(self, current_time: datetime) -> str:
        """Determine time of day category"""
        hour = current_time.hour
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"
    
    async def _predict_user_interests(self, user_context: UserContext, opportunities: List[LiveOpportunity]) -> List[str]:
        """Predict what user might be interested in based on context and behavior"""
        predictions = []
        
        time_of_day = self._get_time_of_day(user_context.current_time)
        day_of_week = user_context.current_time.strftime("%A")
        
        # Time-based predictions
        if time_of_day == "morning":
            predictions.append("You might be looking for breakfast or gym sessions")
        elif time_of_day == "afternoon":
            predictions.append("Lunch deals or shopping opportunities might interest you")
        elif time_of_day == "evening":
            predictions.append("Dinner, entertainment, or relaxation services might be perfect")
        
        # Day-based predictions
        if day_of_week in ["Friday", "Saturday"]:
            predictions.append("Weekend activities and nightlife options are popular now")
        
        # Opportunity-based predictions
        urgent_opportunities = [opp for opp in opportunities if opp.urgency_score > 0.8]
        if urgent_opportunities:
            predictions.append(f"Consider booking {urgent_opportunities[0].title} - offer ending soon!")
        
        return predictions
    
    async def _start_opportunity_updates(self):
        """Background task to update live opportunities"""
        if not self.redis_available:
            return
        
        try:
            while True:
                await self._refresh_opportunities()
                await asyncio.sleep(60)  # Update every minute
        except Exception as e:
            logger.error(f"Opportunity update task error: {e}")
    
    async def _refresh_opportunities(self):
        """Refresh live opportunities with new data"""
        try:
            current_time = datetime.now()
            
            # Remove expired opportunities
            self.live_opportunities = [
                opp for opp in self.live_opportunities 
                if opp.valid_until > current_time
            ]
            
            # Update availability and pricing
            for opportunity in self.live_opportunities:
                # Simulate dynamic availability
                if random.random() < 0.1:  # 10% chance to update
                    if opportunity.availability == "high":
                        opportunity.availability = "medium"
                    elif opportunity.availability == "medium":
                        opportunity.availability = "low"
                
                # Update urgency score as time approaches expiry
                time_remaining = opportunity.valid_until - current_time
                if time_remaining < timedelta(hours=1):
                    opportunity.urgency_score = min(0.95, opportunity.urgency_score + 0.1)
                    opportunity.live_status = "ending_soon"
            
            # Cache updated opportunities
            if self.redis_available:
                opportunities_data = [
                    {
                        "opportunity_id": opp.opportunity_id,
                        "title": opp.title,
                        "category": opp.category,
                        "current_offer": opp.current_offer,
                        "urgency_score": opp.urgency_score,
                        "valid_until": opp.valid_until.isoformat(),
                        "live_status": opp.live_status
                    } for opp in self.live_opportunities
                ]
                
                self.redis_client.setex(
                    "live_opportunities",
                    300,  # 5 minutes cache
                    json.dumps(opportunities_data)
                )
                
        except Exception as e:
            logger.error(f"Error refreshing opportunities: {e}")

def create_spatio_temporal_engine(config):
    """Factory function to create spatio-temporal engine"""
    return SpatioTemporalEngine(config)
