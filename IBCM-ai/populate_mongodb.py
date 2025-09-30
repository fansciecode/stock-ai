#!/usr/bin/env python3
"""
MongoDB Sample Data Population Script
Creates comprehensive sample data for IBCM-AI service testing
Includes: Users, Businesses, Events, Products, Reviews, Locations, and more
"""

import pymongo
from datetime import datetime, timedelta
import random
from bson import ObjectId
import json

# MongoDB connection
try:
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["ibcm_ai_db"]
    print("✅ Connected to MongoDB")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
    exit(1)

def clear_existing_data():
    """Clear existing collections"""
    collections = ['users', 'businesses', 'events', 'products', 'reviews', 'locations', 'services', 'recommendations']
    for collection_name in collections:
        db[collection_name].drop()
    print("🗑️ Cleared existing data")

def create_users():
    """Create sample users with diverse profiles"""
    users = [
        {
            "_id": ObjectId(),
            "user_id": "user_001",
            "name": "Rahul Sharma",
            "email": "rahul.sharma@example.com",
            "age": 28,
            "location": {
                "city": "Bangalore",
                "coordinates": {"lat": 12.9716, "lon": 77.5946},
                "address": "Koramangala, Bangalore"
            },
            "interests": ["food", "technology", "travel", "fitness"],
            "preferences": {
                "budget_range": {"min": 500, "max": 3000},
                "cuisine": ["Indian", "Italian", "Chinese"],
                "activity_level": "active",
                "social_style": "outgoing"
            },
            "behavior_pattern": {
                "favorite_time": "evening",
                "weekend_activities": ["dining", "shopping", "movies"],
                "spending_habit": "moderate"
            },
            "created_at": datetime.now() - timedelta(days=30),
            "last_active": datetime.now() - timedelta(hours=2)
        },
        {
            "_id": ObjectId(),
            "user_id": "user_002", 
            "name": "Priya Patel",
            "email": "priya.patel@example.com",
            "age": 24,
            "location": {
                "city": "Mumbai",
                "coordinates": {"lat": 19.0760, "lon": 72.8777},
                "address": "Bandra, Mumbai"
            },
            "interests": ["fashion", "art", "culture", "photography"],
            "preferences": {
                "budget_range": {"min": 800, "max": 5000},
                "cuisine": ["Continental", "Japanese", "Mediterranean"],
                "activity_level": "moderate",
                "social_style": "selective"
            },
            "behavior_pattern": {
                "favorite_time": "afternoon",
                "weekend_activities": ["art galleries", "cafes", "exhibitions"],
                "spending_habit": "premium"
            },
            "created_at": datetime.now() - timedelta(days=45),
            "last_active": datetime.now() - timedelta(minutes=30)
        },
        {
            "_id": ObjectId(),
            "user_id": "user_003",
            "name": "Arjun Singh",
            "email": "arjun.singh@example.com", 
            "age": 32,
            "location": {
                "city": "Delhi",
                "coordinates": {"lat": 28.6139, "lon": 77.2090},
                "address": "Connaught Place, Delhi"
            },
            "interests": ["business", "networking", "sports", "music"],
            "preferences": {
                "budget_range": {"min": 1000, "max": 8000},
                "cuisine": ["North Indian", "Continental", "Thai"],
                "activity_level": "high",
                "social_style": "professional"
            },
            "behavior_pattern": {
                "favorite_time": "morning",
                "weekend_activities": ["golf", "business meets", "fine dining"],
                "spending_habit": "luxury"
            },
            "created_at": datetime.now() - timedelta(days=60),
            "last_active": datetime.now() - timedelta(hours=1)
        },
        {
            "_id": ObjectId(),
            "user_id": "user_004",
            "name": "Sneha Reddy",
            "email": "sneha.reddy@example.com",
            "age": 26,
            "location": {
                "city": "Hyderabad", 
                "coordinates": {"lat": 17.3850, "lon": 78.4867},
                "address": "Jubilee Hills, Hyderabad"
            },
            "interests": ["health", "wellness", "organic food", "yoga"],
            "preferences": {
                "budget_range": {"min": 300, "max": 2000},
                "cuisine": ["Healthy", "Organic", "South Indian"],
                "activity_level": "very high",
                "social_style": "health-conscious"
            },
            "behavior_pattern": {
                "favorite_time": "morning",
                "weekend_activities": ["yoga", "organic markets", "wellness centers"],
                "spending_habit": "conscious"
            },
            "created_at": datetime.now() - timedelta(days=20),
            "last_active": datetime.now() - timedelta(minutes=15)
        },
        {
            "_id": ObjectId(),
            "user_id": "user_005",
            "name": "Vikram Malhotra",
            "email": "vikram.malhotra@example.com",
            "age": 35,
            "location": {
                "city": "Pune",
                "coordinates": {"lat": 18.5204, "lon": 73.8567},
                "address": "Koregaon Park, Pune"
            },
            "interests": ["family", "education", "entertainment", "shopping"],
            "preferences": {
                "budget_range": {"min": 600, "max": 4000},
                "cuisine": ["Family-friendly", "Punjabi", "Italian"],
                "activity_level": "moderate",
                "social_style": "family-oriented"
            },
            "behavior_pattern": {
                "favorite_time": "weekend",
                "weekend_activities": ["family outings", "shopping malls", "parks"],
                "spending_habit": "family-focused"
            },
            "created_at": datetime.now() - timedelta(days=90),
            "last_active": datetime.now() - timedelta(hours=3)
        }
    ]
    
    db.users.insert_many(users)
    print(f"✅ Created {len(users)} users")

def create_businesses():
    """Create sample businesses across different categories"""
    businesses = [
        {
            "_id": ObjectId(),
            "business_id": "biz_001",
            "name": "Spice Route Restaurant",
            "category": "restaurant",
            "subcategory": "fine_dining",
            "location": {
                "city": "Bangalore",
                "coordinates": {"lat": 12.9721, "lon": 77.5933},
                "address": "100 Feet Road, Indiranagar, Bangalore",
                "area": "Indiranagar"
            },
            "details": {
                "cuisine": ["Indian", "Continental", "Asian"],
                "price_range": {"min": 800, "max": 2500},
                "rating": 4.5,
                "reviews_count": 1247,
                "capacity": 120,
                "features": ["AC", "Parking", "Live Music", "Bar"],
                "timings": {
                    "open": "11:00",
                    "close": "23:30",
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                }
            },
            "contact": {
                "phone": "+91-80-4567-8901",
                "email": "info@spiceroute.com",
                "website": "www.spiceroute.com"
            },
            "offers": [
                {
                    "title": "Weekend Special",
                    "description": "20% off on weekends",
                    "valid_until": datetime.now() + timedelta(days=30),
                    "conditions": "Valid for groups of 4+"
                }
            ],
            "popular_items": ["Butter Chicken", "Biryani", "Paneer Tikka"],
            "created_at": datetime.now() - timedelta(days=180),
            "last_updated": datetime.now() - timedelta(days=2)
        },
        {
            "_id": ObjectId(),
            "business_id": "biz_002",
            "name": "Tech Hub Cafe",
            "category": "cafe",
            "subcategory": "work_friendly",
            "location": {
                "city": "Bangalore",
                "coordinates": {"lat": 12.9698, "lon": 77.6059},
                "address": "5th Block, Koramangala, Bangalore",
                "area": "Koramangala"
            },
            "details": {
                "cuisine": ["Coffee", "Sandwiches", "Pasta", "Desserts"],
                "price_range": {"min": 150, "max": 800},
                "rating": 4.2,
                "reviews_count": 892,
                "capacity": 60,
                "features": ["WiFi", "Power Outlets", "Quiet Zone", "Meeting Rooms"],
                "timings": {
                    "open": "07:00",
                    "close": "22:00",
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                }
            },
            "contact": {
                "phone": "+91-80-9876-5432",
                "email": "hello@techhubcafe.com",
                "website": "www.techhubcafe.com"
            },
            "offers": [
                {
                    "title": "Work From Cafe",
                    "description": "Free WiFi + 2 hours free workspace with any order",
                    "valid_until": datetime.now() + timedelta(days=60),
                    "conditions": "Valid on weekdays 9 AM - 6 PM"
                }
            ],
            "popular_items": ["Cappuccino", "Avocado Toast", "Chocolate Brownie"],
            "created_at": datetime.now() - timedelta(days=120),
            "last_updated": datetime.now() - timedelta(days=1)
        },
        {
            "_id": ObjectId(),
            "business_id": "biz_003",
            "name": "Fitness First Gym",
            "category": "fitness",
            "subcategory": "gym",
            "location": {
                "city": "Mumbai",
                "coordinates": {"lat": 19.0596, "lon": 72.8295},
                "address": "Linking Road, Bandra West, Mumbai",
                "area": "Bandra"
            },
            "details": {
                "services": ["Cardio", "Weight Training", "Personal Training", "Group Classes"],
                "price_range": {"min": 2000, "max": 8000},
                "rating": 4.3,
                "reviews_count": 654,
                "capacity": 200,
                "features": ["AC", "Locker Rooms", "Parking", "Protein Bar", "Steam Room"],
                "timings": {
                    "open": "05:00",
                    "close": "23:00",
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                }
            },
            "contact": {
                "phone": "+91-22-2345-6789",
                "email": "info@fitnessfirst.com",
                "website": "www.fitnessfirst.com"
            },
            "offers": [
                {
                    "title": "New Member Special",
                    "description": "50% off first month + free personal training session",
                    "valid_until": datetime.now() + timedelta(days=15),
                    "conditions": "New members only"
                }
            ],
            "popular_services": ["Personal Training", "Zumba Classes", "Yoga"],
            "created_at": datetime.now() - timedelta(days=200),
            "last_updated": datetime.now() - timedelta(hours=12)
        },
        {
            "_id": ObjectId(),
            "business_id": "biz_004",
            "name": "Urban Outfitters",
            "category": "shopping",
            "subcategory": "fashion",
            "location": {
                "city": "Delhi",
                "coordinates": {"lat": 28.6304, "lon": 77.2177},
                "address": "Khan Market, New Delhi",
                "area": "Khan Market"
            },
            "details": {
                "products": ["Clothing", "Accessories", "Footwear", "Bags"],
                "price_range": {"min": 500, "max": 15000},
                "rating": 4.1,
                "reviews_count": 423,
                "features": ["Trial Rooms", "Personal Styling", "Gift Wrapping", "Alterations"],
                "timings": {
                    "open": "10:00",
                    "close": "21:00",
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                }
            },
            "contact": {
                "phone": "+91-11-4567-8901",
                "email": "store@urbanoutfitters.com",
                "website": "www.urbanoutfitters.com"
            },
            "offers": [
                {
                    "title": "Festive Sale",
                    "description": "Up to 40% off on entire collection",
                    "valid_until": datetime.now() + timedelta(days=10),
                    "conditions": "Minimum purchase ₹2000"
                }
            ],
            "popular_brands": ["Zara", "H&M", "Forever 21", "Local Designers"],
            "created_at": datetime.now() - timedelta(days=300),
            "last_updated": datetime.now() - timedelta(hours=6)
        },
        {
            "_id": ObjectId(),
            "business_id": "biz_005",
            "name": "Wellness Spa & Retreat",
            "category": "wellness",
            "subcategory": "spa",
            "location": {
                "city": "Hyderabad",
                "coordinates": {"lat": 17.4126, "lon": 78.4071},
                "address": "Banjara Hills, Hyderabad",
                "area": "Banjara Hills"
            },
            "details": {
                "services": ["Massage", "Facial", "Body Treatments", "Meditation", "Yoga"],
                "price_range": {"min": 1500, "max": 8000},
                "rating": 4.7,
                "reviews_count": 892,
                "features": ["Private Rooms", "Couple Packages", "Organic Products", "Relaxation Lounge"],
                "timings": {
                    "open": "09:00",
                    "close": "21:00",
                    "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                }
            },
            "contact": {
                "phone": "+91-40-6789-0123",
                "email": "booking@wellnessretreat.com",
                "website": "www.wellnessretreat.com"
            },
            "offers": [
                {
                    "title": "Couple's Special",
                    "description": "Book couple massage and get 30% off on facial",
                    "valid_until": datetime.now() + timedelta(days=20),
                    "conditions": "Advance booking required"
                }
            ],
            "popular_treatments": ["Deep Tissue Massage", "Aromatherapy", "Hot Stone Therapy"],
            "created_at": datetime.now() - timedelta(days=150),
            "last_updated": datetime.now() - timedelta(hours=8)
        }
    ]
    
    db.businesses.insert_many(businesses)
    print(f"✅ Created {len(businesses)} businesses")

def create_events():
    """Create sample events across different categories"""
    events = [
        {
            "_id": ObjectId(),
            "event_id": "evt_001",
            "title": "Tech Conference 2024",
            "category": "technology",
            "subcategory": "conference",
            "description": "Annual technology conference featuring AI, blockchain, and future tech trends",
            "location": {
                "city": "Bangalore",
                "coordinates": {"lat": 12.9279, "lon": 77.6271},
                "venue": "KTPO Convention Center",
                "address": "Whitefield, Bangalore"
            },
            "datetime": {
                "start": datetime.now() + timedelta(days=15, hours=9),
                "end": datetime.now() + timedelta(days=15, hours=18),
                "duration_hours": 9
            },
            "pricing": {
                "general": 2500,
                "student": 1000,
                "vip": 5000,
                "group_discount": "20% off for 5+ tickets"
            },
            "details": {
                "speakers": ["Dr. AI Expert", "Blockchain Guru", "Future Tech Visionary"],
                "capacity": 500,
                "registered": 387,
                "rating": 4.6,
                "tags": ["AI", "Technology", "Innovation", "Networking"],
                "requirements": ["Laptop recommended", "Business attire"],
                "includes": ["Lunch", "Networking Session", "Certificate"]
            },
            "organizer": {
                "name": "Tech Events India",
                "contact": "+91-80-1234-5678",
                "email": "info@techevents.in"
            },
            "status": "open_registration",
            "created_at": datetime.now() - timedelta(days=45),
            "last_updated": datetime.now() - timedelta(hours=4)
        },
        {
            "_id": ObjectId(),
            "event_id": "evt_002",
            "title": "Food Festival Extravaganza",
            "category": "food",
            "subcategory": "festival",
            "description": "A celebration of diverse cuisines with 50+ food stalls and live cooking demos",
            "location": {
                "city": "Mumbai",
                "coordinates": {"lat": 19.0330, "lon": 72.8697},
                "venue": "Juhu Beach Ground",
                "address": "Juhu, Mumbai"
            },
            "datetime": {
                "start": datetime.now() + timedelta(days=8, hours=16),
                "end": datetime.now() + timedelta(days=10, hours=23),
                "duration_hours": 55
            },
            "pricing": {
                "entry": 200,
                "family_pack": 500,
                "food_vouchers": "₹50-500 per stall"
            },
            "details": {
                "stalls": 50,
                "cuisines": ["Indian", "Chinese", "Italian", "Mexican", "Thai", "Continental"],
                "capacity": 5000,
                "daily_visitors": 1500,
                "rating": 4.4,
                "tags": ["Food", "Festival", "Family", "Outdoor"],
                "features": ["Live Music", "Cooking Demos", "Kids Zone", "Cultural Programs"],
                "includes": ["Entry", "Entertainment", "Parking"]
            },
            "organizer": {
                "name": "Mumbai Food Events",
                "contact": "+91-22-9876-5432",
                "email": "hello@foodfest.mumbai"
            },
            "status": "selling_fast",
            "created_at": datetime.now() - timedelta(days=30),
            "last_updated": datetime.now() - timedelta(hours=2)
        },
        {
            "_id": ObjectId(),
            "event_id": "evt_003",
            "title": "Yoga & Wellness Retreat",
            "category": "wellness",
            "subcategory": "retreat",
            "description": "3-day wellness retreat focusing on yoga, meditation, and holistic health",
            "location": {
                "city": "Rishikesh",
                "coordinates": {"lat": 30.0869, "lon": 78.2676},
                "venue": "Himalayan Wellness Resort",
                "address": "Rishikesh, Uttarakhand"
            },
            "datetime": {
                "start": datetime.now() + timedelta(days=25, hours=15),
                "end": datetime.now() + timedelta(days=27, hours=12),
                "duration_hours": 69
            },
            "pricing": {
                "single_occupancy": 12000,
                "double_sharing": 9000,
                "early_bird": "20% off if booked 15 days in advance"
            },
            "details": {
                "instructors": ["Yoga Master Ravi", "Meditation Guru Priya"],
                "capacity": 40,
                "registered": 32,
                "rating": 4.8,
                "tags": ["Yoga", "Meditation", "Wellness", "Nature"],
                "includes": ["Accommodation", "Vegetarian Meals", "Yoga Sessions", "Meditation", "Nature Walks"],
                "requirements": ["Yoga Mat", "Comfortable Clothes", "Water Bottle"]
            },
            "organizer": {
                "name": "Spiritual Journeys",
                "contact": "+91-135-234-5678",
                "email": "retreats@spiritualjourneys.com"
            },
            "status": "limited_seats",
            "created_at": datetime.now() - timedelta(days=60),
            "last_updated": datetime.now() - timedelta(hours=1)
        },
        {
            "_id": ObjectId(),
            "event_id": "evt_004",
            "title": "Business Networking Mixer",
            "category": "business",
            "subcategory": "networking",
            "description": "Monthly networking event for entrepreneurs, professionals, and business leaders",
            "location": {
                "city": "Delhi",
                "coordinates": {"lat": 28.5562, "lon": 77.1000},
                "venue": "The Leela Palace",
                "address": "Diplomatic Enclave, New Delhi"
            },
            "datetime": {
                "start": datetime.now() + timedelta(days=5, hours=18, minutes=30),
                "end": datetime.now() + timedelta(days=5, hours=21, minutes=30),
                "duration_hours": 3
            },
            "pricing": {
                "general": 1500,
                "members": 1000,
                "students": 500
            },
            "details": {
                "speakers": ["CEO Panel", "Startup Pitch Session"],
                "capacity": 150,
                "registered": 127,
                "rating": 4.3,
                "tags": ["Business", "Networking", "Professional", "Leadership"],
                "includes": ["Welcome Drinks", "Networking Session", "Light Dinner"],
                "dress_code": "Business Formal"
            },
            "organizer": {
                "name": "Delhi Business Circle",
                "contact": "+91-11-3456-7890",
                "email": "events@delhibusiness.com"
            },
            "status": "open_registration",
            "created_at": datetime.now() - timedelta(days=20),
            "last_updated": datetime.now() - timedelta(hours=6)
        },
        {
            "_id": ObjectId(),
            "event_id": "evt_005",
            "title": "Art & Culture Exhibition",
            "category": "art",
            "subcategory": "exhibition",
            "description": "Contemporary art exhibition featuring local and international artists",
            "location": {
                "city": "Pune",
                "coordinates": {"lat": 18.5196, "lon": 73.8553},
                "venue": "Pune Art Gallery",
                "address": "Koregaon Park, Pune"
            },
            "datetime": {
                "start": datetime.now() + timedelta(days=3, hours=10),
                "end": datetime.now() + timedelta(days=17, hours=20),
                "duration_hours": 350
            },
            "pricing": {
                "weekday": 300,
                "weekend": 400,
                "student": 150,
                "family": 800
            },
            "details": {
                "artists": 25,
                "artworks": 120,
                "categories": ["Paintings", "Sculptures", "Digital Art", "Photography"],
                "rating": 4.5,
                "tags": ["Art", "Culture", "Contemporary", "Exhibition"],
                "features": ["Guided Tours", "Artist Interactions", "Workshop"],
                "special_events": ["Artist Talk on Day 5", "Workshop on Day 10"]
            },
            "organizer": {
                "name": "Pune Art Society",
                "contact": "+91-20-6543-2109",
                "email": "gallery@puneart.org"
            },
            "status": "ongoing",
            "created_at": datetime.now() - timedelta(days=40),
            "last_updated": datetime.now() - timedelta(hours=12)
        }
    ]
    
    db.events.insert_many(events)
    print(f"✅ Created {len(events)} events")

def create_products():
    """Create sample products for e-commerce scenarios"""
    products = [
        {
            "_id": ObjectId(),
            "product_id": "prod_001",
            "name": "Wireless Bluetooth Headphones",
            "category": "electronics",
            "subcategory": "audio",
            "brand": "SoundMax",
            "description": "Premium wireless headphones with noise cancellation and 30-hour battery life",
            "pricing": {
                "original_price": 8999,
                "current_price": 6999,
                "discount_percent": 22,
                "currency": "INR"
            },
            "specifications": {
                "battery_life": "30 hours",
                "connectivity": ["Bluetooth 5.0", "USB-C", "3.5mm Jack"],
                "features": ["Noise Cancellation", "Quick Charge", "Voice Assistant"],
                "weight": "250g",
                "colors": ["Black", "White", "Blue"]
            },
            "ratings": {
                "average": 4.3,
                "total_reviews": 1547,
                "five_star": 892,
                "four_star": 445,
                "three_star": 156,
                "two_star": 34,
                "one_star": 20
            },
            "availability": {
                "in_stock": True,
                "quantity": 45,
                "shipping": "1-2 days",
                "locations": ["Bangalore", "Mumbai", "Delhi", "Hyderabad"]
            },
            "created_at": datetime.now() - timedelta(days=90),
            "last_updated": datetime.now() - timedelta(days=3)
        },
        {
            "_id": ObjectId(),
            "product_id": "prod_002",
            "name": "Organic Green Tea Collection",
            "category": "food_beverage",
            "subcategory": "tea",
            "brand": "Nature's Best",
            "description": "Premium organic green tea collection with 6 different flavors",
            "pricing": {
                "original_price": 1299,
                "current_price": 999,
                "discount_percent": 23,
                "currency": "INR"
            },
            "specifications": {
                "quantity": "6 packs x 25 tea bags",
                "flavors": ["Classic Green", "Lemon", "Mint", "Jasmine", "Earl Grey", "Chamomile"],
                "organic": True,
                "caffeine": "Low",
                "shelf_life": "24 months"
            },
            "ratings": {
                "average": 4.6,
                "total_reviews": 892,
                "five_star": 634,
                "four_star": 189,
                "three_star": 45,
                "two_star": 18,
                "one_star": 6
            },
            "availability": {
                "in_stock": True,
                "quantity": 156,
                "shipping": "2-3 days",
                "locations": ["All major cities"]
            },
            "created_at": datetime.now() - timedelta(days=120),
            "last_updated": datetime.now() - timedelta(days=1)
        },
        {
            "_id": ObjectId(),
            "product_id": "prod_003",
            "name": "Yoga Mat Premium",
            "category": "fitness",
            "subcategory": "accessories",
            "brand": "FlexiFit",
            "description": "Eco-friendly premium yoga mat with superior grip and cushioning",
            "pricing": {
                "original_price": 2499,
                "current_price": 1899,
                "discount_percent": 24,
                "currency": "INR"
            },
            "specifications": {
                "material": "Natural Rubber",
                "dimensions": "183cm x 61cm x 6mm",
                "weight": "2.5kg",
                "eco_friendly": True,
                "features": ["Anti-slip", "Sweat-resistant", "Easy to clean"],
                "colors": ["Purple", "Blue", "Green", "Pink"]
            },
            "ratings": {
                "average": 4.4,
                "total_reviews": 567,
                "five_star": 345,
                "four_star": 156,
                "three_star": 45,
                "two_star": 15,
                "one_star": 6
            },
            "availability": {
                "in_stock": True,
                "quantity": 78,
                "shipping": "1-2 days",
                "locations": ["Bangalore", "Mumbai", "Delhi", "Pune", "Hyderabad"]
            },
            "created_at": datetime.now() - timedelta(days=75),
            "last_updated": datetime.now() - timedelta(hours=8)
        }
    ]
    
    db.products.insert_many(products)
    print(f"✅ Created {len(products)} products")

def create_reviews():
    """Create sample reviews for businesses and products"""
    reviews = [
        {
            "_id": ObjectId(),
            "review_id": "rev_001",
            "user_id": "user_001",
            "business_id": "biz_001",
            "type": "business",
            "rating": 5,
            "title": "Excellent dining experience!",
            "content": "Amazing food quality and great ambiance. The butter chicken was phenomenal and the service was top-notch. Definitely coming back!",
            "helpful_votes": 23,
            "visit_date": datetime.now() - timedelta(days=7),
            "created_at": datetime.now() - timedelta(days=5),
            "verified_purchase": True,
            "photos": ["review_photo_1.jpg", "review_photo_2.jpg"]
        },
        {
            "_id": ObjectId(),
            "review_id": "rev_002",
            "user_id": "user_002",
            "business_id": "biz_002",
            "type": "business",
            "rating": 4,
            "title": "Great place to work",
            "content": "Perfect cafe for remote work. Good WiFi, comfortable seating, and decent coffee. Can get a bit noisy during peak hours but overall recommended.",
            "helpful_votes": 15,
            "visit_date": datetime.now() - timedelta(days=12),
            "created_at": datetime.now() - timedelta(days=10),
            "verified_purchase": True,
            "photos": []
        },
        {
            "_id": ObjectId(),
            "review_id": "rev_003",
            "user_id": "user_003",
            "product_id": "prod_001",
            "type": "product",
            "rating": 4,
            "title": "Good value for money",
            "content": "Sound quality is impressive for the price point. Noise cancellation works well in most environments. Battery life is as advertised. Build quality could be better.",
            "helpful_votes": 42,
            "purchase_date": datetime.now() - timedelta(days=20),
            "created_at": datetime.now() - timedelta(days=18),
            "verified_purchase": True,
            "photos": ["headphones_review.jpg"]
        }
    ]
    
    db.reviews.insert_many(reviews)
    print(f"✅ Created {len(reviews)} reviews")

def create_locations():
    """Create sample location data for spatial queries"""
    locations = [
        {
            "_id": ObjectId(),
            "location_id": "loc_001",
            "name": "Indiranagar",
            "city": "Bangalore",
            "state": "Karnataka",
            "coordinates": {"lat": 12.9719, "lon": 77.5937},
            "type": "neighborhood",
            "characteristics": {
                "vibe": "trendy",
                "demographics": "young professionals",
                "price_level": "medium-high",
                "popular_for": ["dining", "nightlife", "shopping", "cafes"]
            },
            "nearby_landmarks": ["100 Feet Road", "Forum Mall", "CMH Road"],
            "transport": {
                "metro": "Purple Line - Indiranagar Station",
                "bus_routes": ["Big10", "500KB", "500DA"],
                "auto_availability": "high",
                "parking": "limited street parking"
            },
            "amenities": ["hospitals", "schools", "banks", "ATMs", "pharmacies"],
            "safety_rating": 4.2,
            "created_at": datetime.now() - timedelta(days=365)
        },
        {
            "_id": ObjectId(),
            "location_id": "loc_002",
            "name": "Bandra West",
            "city": "Mumbai",
            "state": "Maharashtra", 
            "coordinates": {"lat": 19.0596, "lon": 72.8295},
            "type": "neighborhood",
            "characteristics": {
                "vibe": "upscale",
                "demographics": "affluent families and young professionals",
                "price_level": "high",
                "popular_for": ["dining", "shopping", "entertainment", "beaches"]
            },
            "nearby_landmarks": ["Linking Road", "Hill Road", "Bandstand Promenade"],
            "transport": {
                "train": "Western Line - Bandra Station",
                "bus_routes": ["33", "56", "304"],
                "auto_availability": "medium",
                "parking": "paid parking available"
            },
            "amenities": ["hospitals", "schools", "malls", "banks", "pharmacies"],
            "safety_rating": 4.0,
            "created_at": datetime.now() - timedelta(days=365)
        },
        {
            "_id": ObjectId(),
            "location_id": "loc_003",
            "name": "Connaught Place",
            "city": "Delhi",
            "state": "Delhi",
            "coordinates": {"lat": 28.6304, "lon": 77.2177},
            "type": "commercial_center",
            "characteristics": {
                "vibe": "historic commercial hub",
                "demographics": "mixed - tourists and locals",
                "price_level": "medium",
                "popular_for": ["shopping", "dining", "business", "culture"]
            },
            "nearby_landmarks": ["Rajiv Chowk", "Janpath", "Palika Bazaar"],
            "transport": {
                "metro": "Blue/Yellow Line - Rajiv Chowk",
                "bus_routes": ["DTC Blue Line", "Cluster buses"],
                "auto_availability": "high",
                "parking": "underground parking available"
            },
            "amenities": ["banks", "restaurants", "shops", "hotels", "government offices"],
            "safety_rating": 3.8,
            "created_at": datetime.now() - timedelta(days=365)
        }
    ]
    
    db.locations.insert_many(locations)
    print(f"✅ Created {len(locations)} locations")

def create_services():
    """Create sample services for service-based queries"""
    services = [
        {
            "_id": ObjectId(),
            "service_id": "svc_001",
            "name": "Home Cleaning Service",
            "category": "home_services",
            "subcategory": "cleaning",
            "provider": "CleanPro Services",
            "description": "Professional home cleaning with eco-friendly products",
            "coverage_areas": ["Bangalore", "Mumbai", "Delhi", "Hyderabad"],
            "pricing": {
                "base_price": 500,
                "per_hour": 200,
                "packages": {
                    "basic": 800,
                    "standard": 1200, 
                    "premium": 1800
                }
            },
            "availability": {
                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                "hours": "08:00-18:00",
                "advance_booking": "2 hours minimum"
            },
            "ratings": {
                "average": 4.5,
                "total_reviews": 2341
            },
            "features": ["Eco-friendly products", "Trained professionals", "Insurance covered", "Equipment provided"],
            "contact": {
                "phone": "+91-80-1234-9876",
                "email": "book@cleanpro.in",
                "website": "www.cleanpro.in"
            }
        },
        {
            "_id": ObjectId(),
            "service_id": "svc_002",
            "name": "Personal Trainer",
            "category": "fitness",
            "subcategory": "training",
            "provider": "FitLife Personal Training",
            "description": "Certified personal trainers for home and gym sessions",
            "coverage_areas": ["Bangalore", "Mumbai", "Pune"],
            "pricing": {
                "per_session": 1500,
                "packages": {
                    "monthly_8_sessions": 10000,
                    "monthly_12_sessions": 14000,
                    "quarterly_36_sessions": 38000
                }
            },
            "availability": {
                "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "hours": "06:00-21:00",
                "advance_booking": "24 hours minimum"
            },
            "ratings": {
                "average": 4.7,
                "total_reviews": 1876
            },
            "features": ["Certified trainers", "Customized plans", "Nutrition guidance", "Progress tracking"],
            "specializations": ["Weight loss", "Muscle building", "Sports specific", "Rehabilitation"],
            "contact": {
                "phone": "+91-80-9876-1234",
                "email": "trainers@fitlife.in",
                "website": "www.fitlife.in"
            }
        }
    ]
    
    db.services.insert_many(services)
    print(f"✅ Created {len(services)} services")

def create_search_indexes():
    """Create indexes for better query performance"""
    try:
        # Text indexes for search
        db.businesses.create_index([("name", "text"), ("details.cuisine", "text"), ("category", "text")])
        db.events.create_index([("title", "text"), ("description", "text"), ("category", "text")])
        db.products.create_index([("name", "text"), ("description", "text"), ("category", "text")])
        
        # Geospatial indexes
        db.businesses.create_index([("location.coordinates", "2dsphere")])
        db.events.create_index([("location.coordinates", "2dsphere")])
        db.users.create_index([("location.coordinates", "2dsphere")])
        db.locations.create_index([("coordinates", "2dsphere")])
        
        # Regular indexes for common queries
        db.users.create_index([("user_id", 1)])
        db.businesses.create_index([("business_id", 1), ("category", 1), ("location.city", 1)])
        db.events.create_index([("event_id", 1), ("category", 1), ("datetime.start", 1)])
        db.products.create_index([("product_id", 1), ("category", 1)])
        db.reviews.create_index([("business_id", 1), ("product_id", 1), ("user_id", 1)])
        
        print("✅ Created database indexes for optimal performance")
    except Exception as e:
        print(f"⚠️ Index creation warning: {e}")

def main():
    """Main function to populate the database"""
    print("🚀 Starting MongoDB population with comprehensive sample data...")
    print("=" * 70)
    
    # Clear existing data
    clear_existing_data()
    
    # Create sample data
    create_users()
    create_businesses()
    create_events()
    create_products()
    create_reviews()
    create_locations()
    create_services()
    
    # Create indexes
    create_search_indexes()
    
    # Summary
    print("\n" + "=" * 70)
    print("🎉 DATABASE POPULATION COMPLETE!")
    print("=" * 70)
    
    collections_summary = {
        "users": db.users.count_documents({}),
        "businesses": db.businesses.count_documents({}),
        "events": db.events.count_documents({}),
        "products": db.products.count_documents({}),
        "reviews": db.reviews.count_documents({}),
        "locations": db.locations.count_documents({}),
        "services": db.services.count_documents({})
    }
    
    print("📊 COLLECTIONS SUMMARY:")
    for collection, count in collections_summary.items():
        print(f"   • {collection.capitalize()}: {count} documents")
    
    total_docs = sum(collections_summary.values())
    print(f"\n📈 Total Documents: {total_docs}")
    print(f"💾 Database: ibcm_ai_db")
    print(f"🔍 Text & Geospatial indexes created for optimal search performance")
    
    print("\n✅ Your AI service can now query rich, realistic data!")
    print("🎯 Data includes: Users, Businesses, Events, Products, Reviews, Locations & Services")
    print("🌍 Geographic coverage: Bangalore, Mumbai, Delhi, Hyderabad, Pune")
    print("🏷️ Categories: Food, Tech, Fitness, Shopping, Wellness, Business, Art & more")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    main()

