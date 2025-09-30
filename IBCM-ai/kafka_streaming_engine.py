#!/usr/bin/env python3
"""
IBCM AI - Kafka Real-time Streaming Engine
Real-time data processing and event streaming
"""

import os
import json
import logging
import asyncio
import time
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable
import threading
from concurrent.futures import ThreadPoolExecutor

import kafka
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError
import redis
import pymongo

logger = logging.getLogger(__name__)

class IBCMKafkaStreamer:
    """Real-time streaming engine for IBCM AI"""
    
    def __init__(self, kafka_url: str, redis_client, db):
        self.kafka_url = kafka_url.replace('kafka://', '')  # Remove protocol
        self.redis_client = redis_client
        self.db = db
        self.producer = None
        self.consumers = {}
        self.running = False
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.message_handlers = {}
        
    async def initialize(self):
        """Initialize Kafka streaming system"""
        try:
            logger.info("🌊 Initializing Kafka Streaming Engine...")
            
            # Initialize producer
            self.producer = KafkaProducer(
                bootstrap_servers=[self.kafka_url],
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                key_serializer=lambda k: str(k).encode('utf-8') if k else None,
                retries=3,
                acks='all'
            )
            
            # Register default message handlers
            await self._register_default_handlers()
            
            # Start consuming from key topics
            await self._start_consumers()
            
            self.running = True
            logger.info("✅ Kafka Streaming Engine ready")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Kafka streaming: {e}")
            return False
    
    async def _register_default_handlers(self):
        """Register default message handlers"""
        
        # User activity handler
        self.message_handlers['user_activity'] = self._handle_user_activity
        
        # Business events handler
        self.message_handlers['business_events'] = self._handle_business_events
        
        # AI predictions handler
        self.message_handlers['ai_predictions'] = self._handle_ai_predictions
        
        # Real-time recommendations handler
        self.message_handlers['recommendations'] = self._handle_recommendations
        
        # Analytics events handler
        self.message_handlers['analytics'] = self._handle_analytics
        
        logger.info("📝 Registered default message handlers")
    
    async def _start_consumers(self):
        """Start Kafka consumers for different topics"""
        topics = [
            'user_activity',
            'business_events', 
            'ai_predictions',
            'recommendations',
            'analytics'
        ]
        
        for topic in topics:
            try:
                consumer = KafkaConsumer(
                    topic,
                    bootstrap_servers=[self.kafka_url],
                    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                    group_id=f'ibcm_ai_{topic}_consumer',
                    auto_offset_reset='latest',
                    enable_auto_commit=True
                )
                
                self.consumers[topic] = consumer
                
                # Start consumer in background thread
                self.executor.submit(self._consume_messages, topic, consumer)
                
                logger.info(f"✅ Started consumer for topic: {topic}")
                
            except Exception as e:
                logger.warning(f"Failed to start consumer for {topic}: {e}")
    
    def _consume_messages(self, topic: str, consumer: KafkaConsumer):
        """Consume messages from Kafka topic"""
        logger.info(f"🔄 Starting message consumption for topic: {topic}")
        
        try:
            for message in consumer:
                if not self.running:
                    break
                
                try:
                    # Get handler for this topic
                    handler = self.message_handlers.get(topic)
                    if handler:
                        # Process message asynchronously
                        asyncio.create_task(handler(message.value))
                    else:
                        logger.warning(f"No handler for topic: {topic}")
                        
                except Exception as e:
                    logger.error(f"Error processing message from {topic}: {e}")
                    
        except Exception as e:
            logger.error(f"Consumer error for {topic}: {e}")
        finally:
            consumer.close()
    
    async def _handle_user_activity(self, message: Dict):
        """Handle user activity events"""
        try:
            user_id = message.get('user_id')
            activity_type = message.get('activity_type')
            timestamp = message.get('timestamp', time.time())
            
            logger.info(f"👤 Processing user activity: {activity_type} for user {user_id}")
            
            # Update user embeddings in real-time
            if self.redis_client:
                key = f"user_activity:{user_id}"
                self.redis_client.lpush(key, json.dumps(message))
                self.redis_client.ltrim(key, 0, 99)  # Keep last 100 activities
                self.redis_client.expire(key, 86400)  # 24 hour expiry
            
            # Update user behavior model
            await self._update_user_behavior_model(user_id, message)
            
            # Trigger real-time recommendations if needed
            if activity_type in ['search', 'view', 'bookmark']:
                await self._trigger_real_time_recommendations(user_id, message)
            
        except Exception as e:
            logger.error(f"Error handling user activity: {e}")
    
    async def _handle_business_events(self, message: Dict):
        """Handle business events"""
        try:
            business_id = message.get('business_id')
            event_type = message.get('event_type')
            
            logger.info(f"🏢 Processing business event: {event_type} for business {business_id}")
            
            # Update business embeddings
            if self.redis_client:
                key = f"business_events:{business_id}"
                self.redis_client.lpush(key, json.dumps(message))
                self.redis_client.ltrim(key, 0, 50)
                self.redis_client.expire(key, 86400)
            
            # Update availability and pricing in real-time
            if event_type in ['availability_change', 'price_update']:
                await self._update_business_availability(business_id, message)
            
            # Trigger demand forecasting updates
            if event_type in ['booking', 'cancellation']:
                await self._update_demand_forecast(business_id, message)
                
        except Exception as e:
            logger.error(f"Error handling business event: {e}")
    
    async def _handle_ai_predictions(self, message: Dict):
        """Handle AI prediction results"""
        try:
            prediction_type = message.get('prediction_type')
            user_id = message.get('user_id')
            
            logger.info(f"🤖 Processing AI prediction: {prediction_type} for user {user_id}")
            
            # Store prediction results
            if self.redis_client:
                key = f"ai_predictions:{user_id}:{prediction_type}"
                self.redis_client.setex(key, 3600, json.dumps(message))  # 1 hour expiry
            
            # Update user preference model
            await self._update_user_preferences(user_id, message)
            
        except Exception as e:
            logger.error(f"Error handling AI prediction: {e}")
    
    async def _handle_recommendations(self, message: Dict):
        """Handle recommendation events"""
        try:
            user_id = message.get('user_id')
            recommendations = message.get('recommendations', [])
            
            logger.info(f"💡 Processing recommendations for user {user_id}")
            
            # Cache recommendations
            if self.redis_client:
                key = f"recommendations:{user_id}"
                self.redis_client.setex(key, 1800, json.dumps(message))  # 30 min expiry
            
            # Track recommendation performance
            await self._track_recommendation_performance(user_id, recommendations)
            
        except Exception as e:
            logger.error(f"Error handling recommendations: {e}")
    
    async def _handle_analytics(self, message: Dict):
        """Handle analytics events"""
        try:
            metric_type = message.get('metric_type')
            value = message.get('value')
            
            logger.info(f"📊 Processing analytics: {metric_type} = {value}")
            
            # Update real-time analytics
            if self.redis_client:
                timestamp = int(time.time())
                key = f"analytics:{metric_type}:{timestamp // 300}"  # 5-minute buckets
                self.redis_client.incr(key)
                self.redis_client.expire(key, 86400)
            
            # Store in database for historical analysis
            await self._store_analytics_data(message)
            
        except Exception as e:
            logger.error(f"Error handling analytics: {e}")
    
    async def _update_user_behavior_model(self, user_id: str, activity: Dict):
        """Update user behavior model in real-time"""
        try:
            # Update user activity patterns
            activity_type = activity.get('activity_type')
            category = activity.get('category')
            
            if self.redis_client and category:
                # Update category preferences
                key = f"user_preferences:{user_id}"
                self.redis_client.hincrby(key, category, 1)
                self.redis_client.expire(key, 604800)  # 1 week expiry
                
                # Update activity patterns
                hour = datetime.now().hour
                day = datetime.now().weekday()
                pattern_key = f"user_patterns:{user_id}"
                self.redis_client.hincrby(pattern_key, f"hour_{hour}", 1)
                self.redis_client.hincrby(pattern_key, f"day_{day}", 1)
                self.redis_client.expire(pattern_key, 604800)
            
        except Exception as e:
            logger.error(f"Error updating user behavior model: {e}")
    
    async def _trigger_real_time_recommendations(self, user_id: str, activity: Dict):
        """Trigger real-time recommendations based on user activity"""
        try:
            # Send recommendation request
            recommendation_request = {
                'user_id': user_id,
                'trigger_activity': activity,
                'timestamp': time.time(),
                'request_type': 'real_time'
            }
            
            await self.publish_message('recommendation_requests', recommendation_request)
            
        except Exception as e:
            logger.error(f"Error triggering real-time recommendations: {e}")
    
    async def _update_business_availability(self, business_id: str, event: Dict):
        """Update business availability in real-time"""
        try:
            if self.db is not None:
                # Update availability in database
                update_data = {
                    'last_updated': datetime.now(),
                    'availability_status': event.get('availability_status', 'available')
                }
                
                if 'new_price' in event:
                    update_data['pricing.amount'] = event['new_price']
                
                self.db.events.update_many(
                    {'business_id': business_id},
                    {'$set': update_data}
                )
                
                logger.info(f"Updated availability for business {business_id}")
                
        except Exception as e:
            logger.error(f"Error updating business availability: {e}")
    
    async def _update_demand_forecast(self, business_id: str, event: Dict):
        """Update demand forecasting model"""
        try:
            event_type = event.get('event_type')
            timestamp = event.get('timestamp', time.time())
            
            if self.redis_client:
                # Update demand metrics
                hour = datetime.fromtimestamp(timestamp).hour
                day = datetime.fromtimestamp(timestamp).weekday()
                
                demand_key = f"demand:{business_id}"
                self.redis_client.hincrby(demand_key, f"{event_type}_{hour}_{day}", 1)
                self.redis_client.expire(demand_key, 2592000)  # 30 days
                
        except Exception as e:
            logger.error(f"Error updating demand forecast: {e}")
    
    async def _update_user_preferences(self, user_id: str, prediction: Dict):
        """Update user preferences based on AI predictions"""
        try:
            predicted_categories = prediction.get('predicted_categories', [])
            confidence_scores = prediction.get('confidence_scores', {})
            
            if self.redis_client:
                pref_key = f"ai_preferences:{user_id}"
                for category in predicted_categories:
                    confidence = confidence_scores.get(category, 0.5)
                    self.redis_client.hset(pref_key, category, confidence)
                self.redis_client.expire(pref_key, 604800)  # 1 week
                
        except Exception as e:
            logger.error(f"Error updating user preferences: {e}")
    
    async def _track_recommendation_performance(self, user_id: str, recommendations: List[Dict]):
        """Track recommendation performance metrics"""
        try:
            if self.redis_client:
                for rec in recommendations:
                    rec_id = rec.get('id', 'unknown')
                    category = rec.get('category', 'general')
                    
                    # Track recommendation delivery
                    perf_key = f"rec_performance:{category}"
                    self.redis_client.hincrby(perf_key, 'delivered', 1)
                    self.redis_client.expire(perf_key, 86400)
                    
        except Exception as e:
            logger.error(f"Error tracking recommendation performance: {e}")
    
    async def _store_analytics_data(self, analytics: Dict):
        """Store analytics data in database"""
        try:
            if self.db is not None:
                analytics['stored_at'] = datetime.now()
                self.db.analytics.insert_one(analytics)
                
        except Exception as e:
            logger.error(f"Error storing analytics data: {e}")
    
    async def publish_message(self, topic: str, message: Dict, key: str = None):
        """Publish message to Kafka topic"""
        try:
            if not self.producer:
                logger.warning("Producer not initialized")
                return False
            
            # Add timestamp if not present
            if 'timestamp' not in message:
                message['timestamp'] = time.time()
            
            # Send message
            future = self.producer.send(topic, value=message, key=key)
            result = future.get(timeout=10)
            
            logger.debug(f"Published message to {topic}: {result}")
            return True
            
        except Exception as e:
            logger.error(f"Error publishing message to {topic}: {e}")
            return False
    
    async def publish_user_activity(self, user_id: str, activity_type: str, data: Dict):
        """Publish user activity event"""
        message = {
            'user_id': user_id,
            'activity_type': activity_type,
            'data': data,
            'timestamp': time.time()
        }
        
        return await self.publish_message('user_activity', message, key=user_id)
    
    async def publish_business_event(self, business_id: str, event_type: str, data: Dict):
        """Publish business event"""
        message = {
            'business_id': business_id,
            'event_type': event_type,
            'data': data,
            'timestamp': time.time()
        }
        
        return await self.publish_message('business_events', message, key=business_id)
    
    async def publish_ai_prediction(self, user_id: str, prediction_type: str, predictions: Dict):
        """Publish AI prediction results"""
        message = {
            'user_id': user_id,
            'prediction_type': prediction_type,
            'predictions': predictions,
            'timestamp': time.time()
        }
        
        return await self.publish_message('ai_predictions', message, key=user_id)
    
    async def get_real_time_user_data(self, user_id: str) -> Dict:
        """Get real-time user data from Redis"""
        try:
            if not self.redis_client:
                return {}
            
            # Get recent activities
            activities_key = f"user_activity:{user_id}"
            activities = self.redis_client.lrange(activities_key, 0, 9)  # Last 10 activities
            activities = [json.loads(a) for a in activities]
            
            # Get preferences
            prefs_key = f"user_preferences:{user_id}"
            preferences = self.redis_client.hgetall(prefs_key)
            
            # Get AI predictions
            ai_prefs_key = f"ai_preferences:{user_id}"
            ai_preferences = self.redis_client.hgetall(ai_prefs_key)
            
            # Get recent recommendations
            rec_key = f"recommendations:{user_id}"
            recommendations = self.redis_client.get(rec_key)
            if recommendations:
                recommendations = json.loads(recommendations)
            
            return {
                'user_id': user_id,
                'recent_activities': activities,
                'preferences': preferences,
                'ai_preferences': ai_preferences,
                'recent_recommendations': recommendations,
                'last_updated': time.time()
            }
            
        except Exception as e:
            logger.error(f"Error getting real-time user data: {e}")
            return {}
    
    async def get_streaming_status(self) -> Dict:
        """Get streaming system status"""
        return {
            'running': self.running,
            'producer_ready': self.producer is not None,
            'active_consumers': len(self.consumers),
            'topics': list(self.consumers.keys()),
            'message_handlers': len(self.message_handlers),
            'kafka_url': self.kafka_url
        }
    
    async def stop(self):
        """Stop streaming system"""
        self.running = False
        
        if self.producer:
            self.producer.close()
        
        for consumer in self.consumers.values():
            consumer.close()
        
        self.executor.shutdown(wait=True)
        logger.info("🛑 Kafka streaming system stopped")

# Factory function
async def create_kafka_streamer(kafka_url: str, redis_client, db) -> IBCMKafkaStreamer:
    """Create and initialize Kafka streamer"""
    streamer = IBCMKafkaStreamer(kafka_url, redis_client, db)
    await streamer.initialize()
    return streamer
