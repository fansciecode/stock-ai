#!/usr/bin/env python3
"""
IBCM AI - Realistic Dummy Training Data Generator
Creates accurate training data simulating real user interactions
"""

import random
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any
import json

logger = logging.getLogger(__name__)

class DummyTrainingDataGenerator:
    """
    Generate realistic dummy training data for IBCM AI
    Simulates accurate user interactions with the platform
    """
    
    def __init__(self):
        # Realistic user personas
        self.user_personas = [
            {
                "type": "young_professional",
                "age_range": "25-35",
                "interests": ["technology", "networking", "food", "fitness", "career"],
                "location_preferences": ["downtown", "business district", "trendy areas"],
                "price_sensitivity": "medium",
                "time_preferences": ["evening", "weekend"]
            },
            {
                "type": "family_oriented",
                "age_range": "30-45", 
                "interests": ["family_events", "education", "outdoor", "entertainment", "health"],
                "location_preferences": ["suburbs", "family-friendly areas", "parks"],
                "price_sensitivity": "high",
                "time_preferences": ["weekend", "afternoon"]
            },
            {
                "type": "student",
                "age_range": "18-25",
                "interests": ["entertainment", "social", "cheap_eats", "study_groups", "sports"],
                "location_preferences": ["campus", "student areas", "budget-friendly"],
                "price_sensitivity": "very_high",
                "time_preferences": ["evening", "late_night", "weekend"]
            },
            {
                "type": "senior",
                "age_range": "55+",
                "interests": ["culture", "arts", "health", "leisure", "community"],
                "location_preferences": ["accessible areas", "quiet neighborhoods", "cultural districts"],
                "price_sensitivity": "low",
                "time_preferences": ["morning", "afternoon"]
            },
            {
                "type": "entrepreneur",
                "age_range": "28-40",
                "interests": ["business", "networking", "innovation", "investment", "leadership"],
                "location_preferences": ["business centers", "coworking spaces", "upscale areas"],
                "price_sensitivity": "low",
                "time_preferences": ["flexible", "early_morning", "evening"]
            }
        ]
        
        # Realistic event categories and scenarios
        self.event_scenarios = {
            "food": [
                "Looking for authentic Italian restaurants near me",
                "Best brunch spots for weekend family meal",
                "Late night food delivery options",
                "Vegetarian-friendly restaurants in downtown",
                "Cheap eats for students under $15"
            ],
            "entertainment": [
                "Live music venues this weekend",
                "Comedy shows for date night",
                "Family-friendly movie theaters",
                "Gaming cafes and arcades nearby",
                "Art galleries with current exhibitions"
            ],
            "fitness": [
                "Yoga classes for beginners",
                "Personal training gyms in my area",
                "Outdoor fitness groups and activities",
                "Swimming pools and aquatic centers",
                "Rock climbing and adventure sports"
            ],
            "business": [
                "Networking events for entrepreneurs", 
                "Professional development workshops",
                "Business conferences and seminars",
                "Coworking spaces with meeting rooms",
                "Industry-specific meetups"
            ],
            "education": [
                "Adult learning classes and workshops",
                "Language exchange groups",
                "Professional certification courses",
                "Skill-building seminars",
                "Academic lectures and talks"
            ]
        }
        
        # Business response templates
        self.business_responses = {
            "food": [
                "I recommend {name} - {description}. They specialize in {specialty} with {rating}/5 rating. Price range: {price}. Open {hours}.",
                "Perfect choice: {name}! {description} Located in {location}, known for {specialty}. Average cost: {price} per person.",
                "You'll love {name} - {description} Their {specialty} is highly rated ({rating}/5). {location} location, {price} price range."
            ],
            "entertainment": [
                "Check out {name} - {description} Upcoming shows: {events}. Tickets from {price}. Located in {location}.",
                "Great option: {name}! {description} {events} available. {location} venue, tickets {price}.",
                "I suggest {name} - {description} Current lineup: {events}. Price: {price}, Location: {location}."
            ],
            "fitness": [
                "Try {name} - {description} They offer {services} with {rating}/5 rating. Membership: {price}/month. Location: {location}.",
                "Perfect fit: {name}! {description} Services include {services}. {location} location, {price}/month.",
                "I recommend {name} - {description} Specializing in {services}. Rated {rating}/5, {price}/month membership."
            ],
            "business": [
                "Attend {name} - {description} Topics: {topics}. Date: {date}, Location: {location}. Registration: {price}.",
                "Great opportunity: {name}! {description} Focus areas: {topics}. {location}, {date}. Cost: {price}.",
                "Don't miss {name} - {description} Covering {topics}. {date} at {location}. Price: {price}."
            ]
        }
        
    def generate_comprehensive_training_data(self, num_examples: int = 500) -> List[Dict]:
        """Generate comprehensive realistic training data"""
        logger.info(f"🎯 Generating {num_examples} realistic training examples...")
        
        training_data = []
        
        for i in range(num_examples):
            try:
                # Select random persona and scenario
                persona = random.choice(self.user_personas)
                category = random.choice(list(self.event_scenarios.keys()))
                scenario = random.choice(self.event_scenarios[category])
                
                # Generate realistic interaction
                training_example = self._generate_interaction(persona, category, scenario)
                
                if training_example:
                    training_data.append(training_example)
                    
            except Exception as e:
                logger.warning(f"Error generating training example {i}: {e}")
                continue
        
        logger.info(f"✅ Generated {len(training_data)} realistic training examples")
        return training_data
    
    def _generate_interaction(self, persona: Dict, category: str, scenario: str) -> Dict:
        """Generate a realistic user-AI interaction"""
        try:
            # Create contextual user query
            user_context = self._create_user_context(persona)
            enhanced_scenario = self._enhance_scenario_with_context(scenario, persona)
            
            # Generate realistic AI response
            ai_response = self._generate_ai_response(category, persona, enhanced_scenario)
            
            # Create training example
            training_example = {
                "input": f"User context: {user_context}\nQuery: {enhanced_scenario}",
                "output": ai_response,
                "persona_type": persona["type"],
                "category": category,
                "interaction_type": "recommendation",
                "quality_score": self._calculate_interaction_quality(enhanced_scenario, ai_response),
                "generated_at": datetime.now().isoformat(),
                "source": "dummy_realistic"
            }
            
            return training_example
            
        except Exception as e:
            logger.error(f"Error generating interaction: {e}")
            return None
    
    def _create_user_context(self, persona: Dict) -> str:
        """Create realistic user context"""
        age = persona["age_range"]
        interests = ", ".join(random.sample(persona["interests"], min(3, len(persona["interests"]))))
        location_pref = random.choice(persona["location_preferences"])
        price_sensitivity = persona["price_sensitivity"]
        time_pref = random.choice(persona["time_preferences"])
        
        return f"User profile: {persona['type']}, age {age}, interests in {interests}, prefers {location_pref} locations, {price_sensitivity} price sensitivity, typically active during {time_pref}"
    
    def _enhance_scenario_with_context(self, scenario: str, persona: Dict) -> str:
        """Add persona-specific context to scenario"""
        enhancements = []
        
        # Add location preference
        location_pref = random.choice(persona["location_preferences"])
        enhancements.append(f"in {location_pref}")
        
        # Add time preference
        time_pref = random.choice(persona["time_preferences"])
        enhancements.append(f"for {time_pref}")
        
        # Add price consideration for price-sensitive personas
        if persona["price_sensitivity"] in ["high", "very_high"]:
            enhancements.append("within budget")
        
        enhanced_scenario = scenario
        if enhancements:
            enhanced_scenario += f" ({', '.join(enhancements)})"
            
        return enhanced_scenario
    
    def _generate_ai_response(self, category: str, persona: Dict, scenario: str) -> str:
        """Generate realistic AI response"""
        try:
            # Get response template for category
            templates = self.business_responses.get(category, self.business_responses["food"])
            template = random.choice(templates)
            
            # Generate realistic business data
            business_data = self._generate_business_data(category, persona)
            
            # Fill template with data
            response = template.format(**business_data)
            
            # Add personalization based on persona
            personalization = self._add_personalization(response, persona)
            
            return personalization
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return f"I found some great {category} options that match your preferences. Let me help you find the perfect choice!"
    
    def _generate_business_data(self, category: str, persona: Dict) -> Dict:
        """Generate realistic business data"""
        business_names = {
            "food": ["Bella Vista", "The Corner Bistro", "Spice Garden", "Ocean's Table", "Mountain View Cafe"],
            "entertainment": ["The Spotlight", "Galaxy Theater", "Rhythm & Blues", "Comedy Central", "Art House"],
            "fitness": ["FitLife Studio", "PowerHouse Gym", "Zen Wellness", "Active Zone", "Summit Sports"],
            "business": ["Innovation Hub", "Leadership Summit", "Entrepreneur's Circle", "Business Nexus", "Growth Academy"]
        }
        
        descriptions = {
            "food": ["Cozy family restaurant", "Modern dining experience", "Authentic cuisine", "Farm-to-table concept", "Casual neighborhood spot"],
            "entertainment": ["Premier entertainment venue", "Intimate performance space", "Multi-screen complex", "Live music venue", "Cultural center"],
            "fitness": ["Full-service fitness center", "Boutique wellness studio", "Community fitness hub", "Personal training facility", "Holistic health center"],
            "business": ["Professional development center", "Networking and events space", "Business education institute", "Innovation workspace", "Leadership training facility"]
        }
        
        # Generate data based on persona price sensitivity
        price_ranges = {
            "very_high": ["$", "$$", "Free"],
            "high": ["$", "$$"],
            "medium": ["$$", "$$$"],
            "low": ["$$$", "$$$$"]
        }
        
        name = random.choice(business_names.get(category, business_names["food"]))
        description = random.choice(descriptions.get(category, descriptions["food"]))
        price = random.choice(price_ranges.get(persona["price_sensitivity"], ["$$"]))
        rating = round(random.uniform(3.5, 5.0), 1)
        location = random.choice(persona["location_preferences"])
        
        # Category-specific data
        if category == "food":
            specialty = random.choice(["Italian pasta", "Fresh seafood", "Craft burgers", "Vegan options", "BBQ classics"])
            hours = random.choice(["11am-10pm", "12pm-11pm", "10am-9pm"])
            return {
                "name": name, "description": description, "specialty": specialty,
                "rating": rating, "price": price, "location": location, "hours": hours
            }
        elif category == "entertainment":
            events = random.choice(["Live jazz tonight", "Comedy show Friday", "Art exhibition", "Movie premiere", "Concert series"])
            return {
                "name": name, "description": description, "events": events,
                "price": price, "location": location, "rating": rating
            }
        elif category == "fitness":
            services = random.choice(["yoga and pilates", "weight training", "group classes", "personal training", "aquatic programs"])
            return {
                "name": name, "description": description, "services": services,
                "rating": rating, "price": price, "location": location
            }
        else:  # business
            topics = random.choice(["leadership skills", "digital marketing", "financial planning", "team building", "innovation strategies"])
            date = random.choice(["next Friday", "this weekend", "March 15th", "every Tuesday"])
            return {
                "name": name, "description": description, "topics": topics,
                "date": date, "location": location, "price": price
            }
    
    def _add_personalization(self, response: str, persona: Dict) -> str:
        """Add persona-specific personalization to response"""
        personalizations = {
            "young_professional": "This is perfect for your busy lifestyle and networking goals.",
            "family_oriented": "Great for the whole family with kid-friendly options.",
            "student": "Budget-friendly and popular with students in your area.",
            "senior": "Comfortable, accessible, and well-reviewed by your demographic.",
            "entrepreneur": "Excellent for business networking and professional development."
        }
        
        personalization = personalizations.get(persona["type"], "This matches your preferences perfectly.")
        return f"{response} {personalization}"
    
    def _calculate_interaction_quality(self, scenario: str, response: str) -> float:
        """Calculate quality score for the interaction"""
        score = 0.0
        
        # Length and detail factors
        if 20 <= len(scenario) <= 150:
            score += 0.2
        if 100 <= len(response) <= 400:
            score += 0.3
            
        # Keyword relevance
        relevant_keywords = ["recommend", "rating", "price", "location", "perfect", "great"]
        response_lower = response.lower()
        keyword_matches = sum(1 for keyword in relevant_keywords if keyword in response_lower)
        score += (keyword_matches / len(relevant_keywords)) * 0.3
        
        # Specificity (numbers, names, details)
        import re
        has_numbers = bool(re.search(r'\d+', response))
        has_names = bool(re.search(r'[A-Z][a-z]+', response))
        if has_numbers:
            score += 0.1
        if has_names:
            score += 0.1
            
        return min(1.0, score)
    
    def generate_user_behavior_scenarios(self) -> List[Dict]:
        """Generate realistic user behavior tracking data"""
        logger.info("🎭 Generating user behavior scenarios...")
        
        behavior_scenarios = []
        
        # Common user interaction patterns
        interaction_patterns = [
            {
                "pattern": "search_then_book",
                "steps": ["search", "view_details", "compare_options", "book"],
                "conversion_rate": 0.15
            },
            {
                "pattern": "browse_then_leave",
                "steps": ["browse", "view_few_items", "leave"],
                "conversion_rate": 0.0
            },
            {
                "pattern": "social_discovery",
                "steps": ["social_feed", "friend_recommendation", "view_details", "book"],
                "conversion_rate": 0.25
            },
            {
                "pattern": "repeat_customer",
                "steps": ["direct_access", "quick_book"],
                "conversion_rate": 0.8
            }
        ]
        
        for pattern_data in interaction_patterns:
            for i in range(50):  # 50 examples per pattern
                persona = random.choice(self.user_personas)
                
                behavior_scenario = {
                    "user_type": persona["type"],
                    "interaction_pattern": pattern_data["pattern"],
                    "steps": pattern_data["steps"],
                    "converted": random.random() < pattern_data["conversion_rate"],
                    "session_duration": random.randint(30, 1800),  # 30 seconds to 30 minutes
                    "pages_viewed": len(pattern_data["steps"]) + random.randint(-1, 3),
                    "timestamp": datetime.now() - timedelta(days=random.randint(0, 30)),
                    "source": "dummy_behavior"
                }
                
                behavior_scenarios.append(behavior_scenario)
        
        return behavior_scenarios


# Factory function
def create_dummy_training_data_generator():
    """Create dummy training data generator instance"""
    return DummyTrainingDataGenerator()
