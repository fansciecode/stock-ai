#!/usr/bin/env python3
"""
IBCM AI - Social Features Module
Implements social domain features as described in the document
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import numpy as np
from math import radians, sin, cos, sqrt, atan2

logger = logging.getLogger(__name__)

class SocialFeaturesEngine:
    """
    Social domain features for IBCM platform
    - User feeds and posts
    - Community interactions
    - Social recommendations
    - Engagement analytics
    """
    
    def __init__(self, ai_engine):
        self.ai_engine = ai_engine
        
    async def generate_personalized_feed(self, user_id: str, limit: int = 20) -> List[Dict]:
        """Generate personalized social feed for user"""
        try:
            # Get user preferences and social graph
            user_data = await self._get_user_social_data(user_id)
            
            # Generate AI-powered feed items
            feed_items = []
            
            # 1. Friend activity
            friend_posts = await self._get_friend_activity(user_id, user_data.get('friends', []))
            
            # 2. Recommended events based on interests
            event_recommendations = await self._get_event_recommendations(user_id, user_data)
            
            # 3. Business promotional content (AI-optimized)
            business_content = await self._get_business_content(user_id, user_data)
            
            # 4. Community posts in user's interests
            community_content = await self._get_community_content(user_id, user_data)
            
            # Combine and score with AI
            all_content = friend_posts + event_recommendations + business_content + community_content
            
            # AI scoring for personalization
            scored_content = await self._ai_score_content(user_id, all_content, user_data)
            
            # Sort by AI score and return top items
            feed_items = sorted(scored_content, key=lambda x: x.get('ai_score', 0), reverse=True)[:limit]
            
            return feed_items
            
        except Exception as e:
            logger.error(f"Error generating feed for user {user_id}: {e}")
            return []
    
    async def _get_user_social_data(self, user_id: str) -> Dict:
        """Get user's social profile and preferences"""
        try:
            if self.ai_engine.db is not None:
                user = self.ai_engine.db.users.find_one({"_id": user_id})
                if user:
                    return {
                        "interests": user.get("interests", []),
                        "location": user.get("location", {}),
                        "friends": user.get("friends", []),
                        "activity_history": user.get("activity_history", []),
                        "preferences": user.get("social_preferences", {})
                    }
            
            # Fallback to synthetic data
            return {
                "interests": ["food", "events", "technology"],
                "location": {"city": "NYC", "lat": 40.7128, "lon": -74.0060},
                "friends": [],
                "activity_history": [],
                "preferences": {"content_types": ["events", "offers", "social"]}
            }
            
        except Exception as e:
            logger.error(f"Error getting social data for user {user_id}: {e}")
            return {}
    
    async def _get_friend_activity(self, user_id: str, friends: List[str]) -> List[Dict]:
        """Get recent activity from user's friends"""
        friend_activity = []
        
        try:
            if self.ai_engine.db is not None and friends:
                # Get recent posts from friends
                recent_posts = list(self.ai_engine.db.social_posts.find({
                    "user_id": {"$in": friends},
                    "timestamp": {"$gte": datetime.now() - timedelta(days=7)}
                }).limit(10))
                
                for post in recent_posts:
                    friend_activity.append({
                        "type": "friend_post",
                        "content": post.get("content", ""),
                        "user_id": post.get("user_id"),
                        "timestamp": post.get("timestamp"),
                        "media": post.get("media", []),
                        "engagement": post.get("engagement", {}),
                        "ai_score": 0.8  # Base score for friend content
                    })
            
            # Add synthetic friend activity if no real data
            if not friend_activity:
                friend_activity = [
                    {
                        "type": "friend_post",
                        "content": "Just discovered an amazing new restaurant in the city!",
                        "user_id": "friend_1",
                        "timestamp": datetime.now() - timedelta(hours=2),
                        "media": ["restaurant_image.jpg"],
                        "engagement": {"likes": 15, "comments": 3},
                        "ai_score": 0.7
                    }
                ]
                
        except Exception as e:
            logger.error(f"Error getting friend activity: {e}")
            
        return friend_activity
    
    async def _get_event_recommendations(self, user_id: str, user_data: Dict) -> List[Dict]:
        """Get AI-powered event recommendations"""
        event_recommendations = []
        
        try:
            # Use AI agent system for event recommendations
            if self.ai_engine.agent_orchestrator:
                interests = user_data.get("interests", [])
                location = user_data.get("location", {})
                
                query = f"Recommend events for user interested in {', '.join(interests)} in {location.get('city', 'their area')}"
                
                result = await self.ai_engine.agent_orchestrator.process_request(
                    query, user_id, {"type": "social_feed_events", "user_data": user_data}
                )
                
                # Convert agent result to feed format
                for item in result.get("items", [])[:5]:  # Top 5 events
                    event_recommendations.append({
                        "type": "event_recommendation",
                        "content": f"🎉 {item.get('title', 'Recommended Event')}",
                        "description": item.get('description', ''),
                        "event_data": item,
                        "ai_score": 0.9,  # High score for AI recommendations
                        "timestamp": datetime.now(),
                        "source": "ai_recommendation"
                    })
            
            # Fallback synthetic recommendations
            if not event_recommendations:
                event_recommendations = [
                    {
                        "type": "event_recommendation", 
                        "content": "🎵 Jazz Night at Blue Note - Perfect for music lovers!",
                        "description": "Live jazz performance tonight",
                        "ai_score": 0.8,
                        "timestamp": datetime.now(),
                        "source": "ai_recommendation"
                    }
                ]
                
        except Exception as e:
            logger.error(f"Error getting event recommendations: {e}")
            
        return event_recommendations
    
    async def _get_business_content(self, user_id: str, user_data: Dict) -> List[Dict]:
        """Get AI-optimized business promotional content"""
        business_content = []
        
        try:
            # Get businesses relevant to user
            interests = user_data.get("interests", [])
            location = user_data.get("location", {})
            
            if self.ai_engine.db is not None:
                # Find businesses matching user interests and location
                business_posts = list(self.ai_engine.db.business_posts.find({
                    "category": {"$in": interests},
                    "active": True,
                    "timestamp": {"$gte": datetime.now() - timedelta(days=3)}
                }).limit(5))
                
                for post in business_posts:
                    business_content.append({
                        "type": "business_promotion",
                        "content": post.get("content", ""),
                        "business_id": post.get("business_id"),
                        "offer": post.get("offer", {}),
                        "ai_score": 0.6,  # Lower score for promotional content
                        "timestamp": post.get("timestamp"),
                        "sponsored": True
                    })
            
            # Synthetic business content
            if not business_content:
                business_content = [
                    {
                        "type": "business_promotion",
                        "content": "🍕 20% off at Tony's Pizza - Limited time offer!",
                        "business_id": "tonys_pizza",
                        "offer": {"discount": "20%", "valid_until": "2025-09-30"},
                        "ai_score": 0.5,
                        "timestamp": datetime.now(),
                        "sponsored": True
                    }
                ]
                
        except Exception as e:
            logger.error(f"Error getting business content: {e}")
            
        return business_content
    
    async def _get_community_content(self, user_id: str, user_data: Dict) -> List[Dict]:
        """Get content from communities user is interested in"""
        community_content = []
        
        try:
            interests = user_data.get("interests", [])
            
            if self.ai_engine.db is not None:
                # Find community posts in user's interest areas
                posts = list(self.ai_engine.db.community_posts.find({
                    "tags": {"$in": interests},
                    "timestamp": {"$gte": datetime.now() - timedelta(days=5)}
                }).limit(5))
                
                for post in posts:
                    community_content.append({
                        "type": "community_post",
                        "content": post.get("content", ""),
                        "community": post.get("community", ""),
                        "tags": post.get("tags", []),
                        "engagement": post.get("engagement", {}),
                        "ai_score": 0.7,
                        "timestamp": post.get("timestamp")
                    })
            
            # Synthetic community content
            if not community_content:
                community_content = [
                    {
                        "type": "community_post",
                        "content": "💡 Tech Community: Best practices for AI in business",
                        "community": "Tech Innovators",
                        "tags": ["technology", "ai", "business"],
                        "engagement": {"likes": 25, "comments": 8},
                        "ai_score": 0.7,
                        "timestamp": datetime.now() - timedelta(hours=4)
                    }
                ]
                
        except Exception as e:
            logger.error(f"Error getting community content: {e}")
            
        return community_content
    
    async def _ai_score_content(self, user_id: str, content_items: List[Dict], user_data: Dict) -> List[Dict]:
        """Use AI to score and personalize content"""
        try:
            for item in content_items:
                # Base scoring factors
                base_score = item.get("ai_score", 0.5)
                
                # Interest alignment
                user_interests = set(user_data.get("interests", []))
                item_tags = set(item.get("tags", []))
                item_category = item.get("category", "")
                
                interest_score = 0.3
                if user_interests & item_tags:  # Intersection
                    interest_score = 0.8
                elif item_category in user_interests:
                    interest_score = 0.7
                
                # Recency factor
                timestamp = item.get("timestamp", datetime.now())
                age_hours = (datetime.now() - timestamp).total_seconds() / 3600
                recency_score = max(0.1, 1.0 - (age_hours / 24))  # Decay over 24 hours
                
                # Engagement factor
                engagement = item.get("engagement", {})
                likes = engagement.get("likes", 0)
                comments = engagement.get("comments", 0)
                engagement_score = min(1.0, (likes + comments * 2) / 50)  # Normalize
                
                # Type-specific bonuses
                type_bonus = {
                    "friend_post": 0.3,
                    "event_recommendation": 0.2, 
                    "community_post": 0.1,
                    "business_promotion": 0.0
                }.get(item.get("type", ""), 0.0)
                
                # Final AI score
                final_score = (
                    base_score * 0.4 +
                    interest_score * 0.3 +
                    recency_score * 0.2 +
                    engagement_score * 0.1 +
                    type_bonus
                )
                
                item["ai_score"] = min(1.0, final_score)
                
        except Exception as e:
            logger.error(f"Error in AI scoring: {e}")
            
        return content_items
    
    async def create_social_post(self, user_id: str, content: str, media: List[str] = None, tags: List[str] = None) -> Dict:
        """Create a new social post with AI enhancement"""
        try:
            # AI content enhancement
            if self.ai_engine.agent_orchestrator:
                enhanced_content = await self._enhance_post_content(content)
            else:
                enhanced_content = content
            
            post_data = {
                "user_id": user_id,
                "content": enhanced_content,
                "original_content": content,
                "media": media or [],
                "tags": tags or [],
                "timestamp": datetime.now(),
                "engagement": {"likes": 0, "comments": 0, "shares": 0},
                "ai_enhanced": True if enhanced_content != content else False
            }
            
            # Save to database if available
            if self.ai_engine.db is not None:
                result = self.ai_engine.db.social_posts.insert_one(post_data)
                post_data["_id"] = result.inserted_id
            
            return {
                "success": True,
                "post": post_data,
                "message": "Post created successfully"
            }
            
        except Exception as e:
            logger.error(f"Error creating social post: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _enhance_post_content(self, content: str) -> str:
        """Use AI to enhance post content"""
        try:
            # Use AI to make content more engaging
            enhancement_prompt = f"Make this social media post more engaging while keeping the original meaning: {content}"
            enhanced = await self.ai_engine.generate_response(enhancement_prompt)
            
            # Return enhanced version if reasonable, otherwise original
            if enhanced and len(enhanced) < len(content) * 2:  # Reasonable length
                return enhanced.strip()
            else:
                return content
                
        except Exception as e:
            logger.error(f"Error enhancing content: {e}")
            return content


# Factory function
def create_social_features_engine(ai_engine):
    """Create social features engine instance"""
    return SocialFeaturesEngine(ai_engine)
