#!/usr/bin/env python3
"""
IBCM AI - Backend Integration Module
Connects AI to the IBCM backend services for real-time data
"""

import asyncio
import aiohttp
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class BackendIntegration:
    """
    Integrates AI with IBCM backend services
    Handles events, products, bookings, chat, notifications, etc.
    """
    
    def __init__(self, config):
        self.config = config
        self.session = None
        
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers={"Content-Type": "application/json"},
            timeout=aiohttp.ClientTimeout(total=10)
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    # ==========================================
    # Events Integration (Core IBCM Feature)
    # ==========================================
    
    async def get_events(self, filters: Dict = None) -> List[Dict]:
        """Get events from backend"""
        try:
            url = self.config.EVENTS_API
            params = filters or {}
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('events', [])
                else:
                    logger.warning(f"Failed to get events: {response.status}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting events: {e}")
            return []
    
    async def create_event(self, event_data: Dict) -> Optional[Dict]:
        """Create new event via backend"""
        try:
            url = self.config.EVENTS_API
            
            async with self.session.post(url, json=event_data) as response:
                if response.status in [200, 201]:
                    return await response.json()
                else:
                    logger.warning(f"Failed to create event: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            return None
    
    # ==========================================
    # User Behavior & Analytics
    # ==========================================
    
    async def get_user_activity(self, user_id: str) -> Dict:
        """Get user activity data for personalization"""
        try:
            url = f"{self.config.USERS_API}/{user_id}/activity"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"searches": [], "bookings": [], "preferences": {}}
                    
        except Exception as e:
            logger.error(f"Error getting user activity: {e}")
            return {"searches": [], "bookings": [], "preferences": {}}
    
    async def track_user_interaction(self, user_id: str, interaction: Dict):
        """Track user interaction for learning"""
        try:
            url = f"{self.config.ANALYTICS_API}/interactions"
            data = {
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
                **interaction
            }
            
            async with self.session.post(url, json=data) as response:
                if response.status not in [200, 201]:
                    logger.warning(f"Failed to track interaction: {response.status}")
                    
        except Exception as e:
            logger.error(f"Error tracking interaction: {e}")
    
    # ==========================================
    # Search Integration
    # ==========================================
    
    async def enhanced_search(self, query: str, user_id: str, filters: Dict = None) -> Dict:
        """Enhanced search via backend with AI personalization"""
        try:
            url = f"{self.config.SEARCH_API}/enhanced"
            data = {
                "query": query,
                "user_id": user_id,
                "filters": filters or {},
                "ai_enhanced": True
            }
            
            async with self.session.post(url, json=data) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"results": [], "total": 0}
                    
        except Exception as e:
            logger.error(f"Error in enhanced search: {e}")
            return {"results": [], "total": 0}
    
    # ==========================================
    # Bookings & Orders Integration
    # ==========================================
    
    async def get_user_bookings(self, user_id: str) -> List[Dict]:
        """Get user's booking history"""
        try:
            url = f"{self.config.BOOKINGS_API}/user/{user_id}"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('bookings', [])
                else:
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting bookings: {e}")
            return []
    
    async def create_booking(self, booking_data: Dict) -> Optional[Dict]:
        """Create booking via backend"""
        try:
            url = self.config.BOOKINGS_API
            
            async with self.session.post(url, json=booking_data) as response:
                if response.status in [200, 201]:
                    return await response.json()
                else:
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating booking: {e}")
            return None
    
    # ==========================================
    # Products Integration (E-commerce)
    # ==========================================
    
    async def get_products(self, filters: Dict = None) -> List[Dict]:
        """Get products from backend"""
        try:
            url = self.config.PRODUCTS_API
            params = filters or {}
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('products', [])
                else:
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting products: {e}")
            return []
    
    # ==========================================
    # Notifications Integration
    # ==========================================
    
    async def send_notification(self, notification_data: Dict):
        """Send notification via backend"""
        try:
            url = self.config.NOTIFICATIONS_API
            
            async with self.session.post(url, json=notification_data) as response:
                if response.status not in [200, 201]:
                    logger.warning(f"Failed to send notification: {response.status}")
                    
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
    
    # ==========================================
    # Chat Integration
    # ==========================================
    
    async def get_chat_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's chat history for context"""
        try:
            url = f"{self.config.CHAT_API}/history/{user_id}"
            params = {"limit": limit}
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('messages', [])
                else:
                    return []
                    
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []
    
    # ==========================================
    # Analytics & Business Intelligence
    # ==========================================
    
    async def get_business_analytics(self, business_id: str = None) -> Dict:
        """Get business analytics for AI insights"""
        try:
            url = f"{self.config.ANALYTICS_API}/business"
            params = {"business_id": business_id} if business_id else {}
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    return {"metrics": {}, "trends": [], "insights": []}
                    
        except Exception as e:
            logger.error(f"Error getting business analytics: {e}")
            return {"metrics": {}, "trends": [], "insights": []}
    
    async def submit_ai_insights(self, insights: Dict):
        """Submit AI-generated insights to backend"""
        try:
            url = f"{self.config.ANALYTICS_API}/ai-insights"
            data = {
                "timestamp": datetime.now().isoformat(),
                "source": "ibcm_ai",
                **insights
            }
            
            async with self.session.post(url, json=data) as response:
                if response.status not in [200, 201]:
                    logger.warning(f"Failed to submit AI insights: {response.status}")
                    
        except Exception as e:
            logger.error(f"Error submitting AI insights: {e}")


# Factory function
def create_backend_integration(config):
    """Create backend integration instance"""
    return BackendIntegration(config)
