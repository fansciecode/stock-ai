#!/usr/bin/env python3

# Test the new place guide endpoint logic independently
import sys
from datetime import datetime

# Mock request data
request = {
    "location": "Delhi",
    "user_preferences": {
        "interests": ["food", "culture"]
    }
}

print("🔍 Testing our logic step by step...")

# Step 1: Extract location
location = request.get("location", {"lat": 12.9716, "lon": 77.5946})
print(f"1. Location extracted: {location} (type: {type(location)})")

# Step 2: Handle location format
if isinstance(location, str):
    city_name = location
    location = {"lat": 12.9716, "lon": 77.5946}  # Default coordinates
    print(f"2a. Location is string, city_name: {city_name}, location: {location}")
else:
    city_name = request.get("city_name", "Unknown City")
    print(f"2b. Location is dict, city_name: {city_name}")

# Step 3: Extract user interests
user_preferences = request.get("user_preferences", {})
print(f"3. User preferences: {user_preferences} (type: {type(user_preferences)})")

if isinstance(user_preferences, dict):
    user_interests = user_preferences.get("interests", ["food", "entertainment", "shopping"])
    print(f"4a. Interests from dict: {user_interests}")
else:
    user_interests = request.get("interests", ["food", "entertainment", "shopping"])
    print(f"4b. Interests from request: {user_interests}")

# Step 4: Duration
duration_days = request.get("duration_days", 1)
print(f"5. Duration: {duration_days}")

print("✅ All steps completed successfully!")
print("🎯 The issue must be elsewhere in the actual endpoint...")
