"""
Clean IBCM AI Configuration - Environment-Based URLs
All service URLs loaded from environment variables
"""

import os
from typing import Dict, List, Optional
from dataclasses import dataclass
import redis
from pymongo import MongoClient
import torch

@dataclass
class AIConfig:
    """Clean AI Configuration with environment-based URLs"""
    
    # Environment Detection
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # =====================
    # Core Service URLs (Environment-Based)
    # =====================
    
    # Database URLs
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME: str = os.getenv("DB_NAME", "ibcm_ai")
    
    # Cache URLs  
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Message Queue URLs
    KAFKA_URL: str = os.getenv("KAFKA_URL", "kafka://localhost:9092")
    
    # Search Engine URLs
    ELASTICSEARCH_URL: str = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")
    
    # Web Training Sources - Environment based
    WEB_SCRAPING_ENABLED: bool = os.getenv("WEB_SCRAPING_ENABLED", "true").lower() == "true"
    EVENT_SITE_1: str = os.getenv("EVENT_SITE_1", "https://www.eventbrite.com")
    EVENT_SITE_2: str = os.getenv("EVENT_SITE_2", "https://www.meetup.com")
    BUSINESS_SITE_1: str = os.getenv("BUSINESS_SITE_1", "https://www.yelp.com")
    BUSINESS_SITE_2: str = os.getenv("BUSINESS_SITE_2", "https://foursquare.com")
    NEWS_FEED_1: str = os.getenv("NEWS_FEED_1", "https://feeds.feedburner.com/TechCrunch")
    NEWS_FEED_2: str = os.getenv("NEWS_FEED_2", "https://rss.cnn.com/rss/edition.rss")
    
    # Backend Integration URLs
    BACKEND_API_URL: str = os.getenv("BACKEND_API_URL", "http://localhost:5001/api")
    
    # Backend API Endpoints
    EVENTS_API: str = f"{BACKEND_API_URL}/events"
    PRODUCTS_API: str = f"{BACKEND_API_URL}/products"
    BOOKINGS_API: str = f"{BACKEND_API_URL}/bookings"
    CHAT_API: str = f"{BACKEND_API_URL}/chat"
    NOTIFICATIONS_API: str = f"{BACKEND_API_URL}/notifications"
    SEARCH_API: str = f"{BACKEND_API_URL}/search"
    USERS_API: str = f"{BACKEND_API_URL}/users"
    ANALYTICS_API: str = f"{BACKEND_API_URL}/analytics"
    DELIVERY_API: str = f"{BACKEND_API_URL}/delivery"
    ORDERS_API: str = f"{BACKEND_API_URL}/orders"
    
    # =====================
    # API Configuration
    # =====================
    
    API_HOST: str = os.getenv("AI_API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("AI_API_PORT", "8001"))
    
    # Security
    API_KEY_HEADER: str = "X-API-Key"
    INTERNAL_API_KEY: str = os.getenv("INTERNAL_API_KEY", "ibcm_internal_ai_key_2024")
    EXTERNAL_API_KEYS: str = os.getenv("EXTERNAL_API_KEYS", "")
    
    # =====================
    # LLaMA Configuration
    # =====================
    
    USE_LLAMA: bool = os.getenv("USE_LLAMA", "true").lower() == "true"
    LLAMA_MODEL: str = os.getenv("LLAMA_MODEL", "meta-llama/Llama-2-7b-chat-hf")
    MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "./models")
    
    # Fine-tuning
    ENABLE_FINE_TUNING: bool = os.getenv("ENABLE_FINE_TUNING", "true").lower() == "true"
    FINE_TUNING_OUTPUT_DIR: str = os.getenv("FINE_TUNING_OUTPUT_DIR", "./fine_tuned_models")
    
    # =====================
    # Features
    # =====================
    
    # Content Generation
    ENABLE_CONTENT_GENERATION: bool = os.getenv("ENABLE_CONTENT_GENERATION", "true").lower() == "true"
    ENABLE_IMAGE_PROMPTS: bool = os.getenv("ENABLE_IMAGE_PROMPTS", "true").lower() == "true"
    ENABLE_VIDEO_PROMPTS: bool = os.getenv("ENABLE_VIDEO_PROMPTS", "true").lower() == "true"
    
    # Web Training - Environment based
    ENABLE_WEB_TRAINING: bool = os.getenv("ENABLE_WEB_TRAINING", "true").lower() == "true"
    USE_MONGODB_TRAINING: bool = os.getenv("USE_MONGODB_TRAINING", "true").lower() == "true"
    USE_WEB_SCRAPING: bool = os.getenv("USE_WEB_SCRAPING", "true").lower() == "true"
    USE_DUMMY_DATA: bool = os.getenv("USE_DUMMY_DATA", "true").lower() == "true"
    
    # Model Names - Environment based
    BASE_MODEL_NAME: str = os.getenv("BASE_MODEL_NAME", "microsoft/DialoGPT-medium")
    EMBEDDING_MODEL_NAME: str = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    IMAGE_MODEL_NAME: str = os.getenv("IMAGE_MODEL_NAME", "runwayml/stable-diffusion-v1-5")
    
    # Training Parameters
    MAX_TRAINING_EXAMPLES: int = int(os.getenv("MAX_TRAINING_EXAMPLES", "1000"))
    WEB_SCRAPING_TIMEOUT: int = int(os.getenv("WEB_SCRAPING_TIMEOUT", "30"))
    DUMMY_DATA_COUNT: int = int(os.getenv("DUMMY_DATA_COUNT", "300"))
    
    # Hardware
    GPU_ENABLED: bool = os.getenv("GPU_ENABLED", "false").lower() == "true"
    DEVICE: str = os.getenv("DEVICE", "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu")
    
    # Dependencies
    AUTO_INSTALL_DEPENDENCIES: bool = os.getenv("AUTO_INSTALL_DEPENDENCIES", "false").lower() == "true"
    
    # =====================
    # Model Parameters
    # =====================
    
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "4"))
    MAX_SEQUENCE_LENGTH: int = int(os.getenv("MAX_SEQUENCE_LENGTH", "512"))
    LEARNING_RATE: float = float(os.getenv("LEARNING_RATE", "2e-4"))
    
    # =====================
    # External Service APIs (Optional)
    # =====================
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    
    # =====================
    # Logging
    # =====================
    
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    def __post_init__(self):
        """Validate required configuration"""
        if not self.INTERNAL_API_KEY:
            raise ValueError("INTERNAL_API_KEY must be set")
        
        if self.USE_LLAMA and not self.LLAMA_MODEL:
            raise ValueError("LLAMA_MODEL must be set when USE_LLAMA=true")

# =====================
# Database Connections
# =====================

def get_mongo_client():
    """Get MongoDB client with environment-based URL"""
    try:
        client = MongoClient(config.MONGO_URI)
        return client
    except Exception as e:
        raise ConnectionError(f"Failed to connect to MongoDB at {config.MONGO_URI}: {e}")

def get_redis_client():
    """Get Redis client with environment-based URL"""
    try:
        return redis.from_url(config.REDIS_URL)
    except Exception as e:
        raise ConnectionError(f"Failed to connect to Redis at {config.REDIS_URL}: {e}")

# =====================
# Global Configuration
# =====================

config = AIConfig()

# Database connections
try:
    mongo_client = get_mongo_client()
    db = mongo_client[config.DB_NAME]
except Exception as e:
    print(f"Warning: MongoDB connection failed: {e}")
    db = None

try:
    redis_client = get_redis_client()
except Exception as e:
    print(f"Warning: Redis connection failed: {e}")
    redis_client = None

# =====================
# Environment Examples
# =====================

ENVIRONMENT_EXAMPLES = {
    "local": {
        "MONGO_URI": "mongodb://localhost:27017/",
        "REDIS_URL": "redis://localhost:6379/0", 
        "KAFKA_URL": "kafka://localhost:9092",
        "ELASTICSEARCH_URL": "http://localhost:9200",
        "BACKEND_API_URL": "http://localhost:5001/api"
    },
    "development": {
        "MONGO_URI": "mongodb://mongodb:27017/",
        "REDIS_URL": "redis://redis:6379/0",
        "KAFKA_URL": "kafka://kafka:9092", 
        "ELASTICSEARCH_URL": "http://elasticsearch:9200",
        "BACKEND_API_URL": "http://backend:5001/api"
    },
    "production": {
        "MONGO_URI": "mongodb://prod-mongodb-cluster:27017/",
        "REDIS_URL": "redis://prod-redis-cluster:6379/0",
        "KAFKA_URL": "kafka://prod-kafka-cluster:9092",
        "ELASTICSEARCH_URL": "http://prod-elasticsearch:9200", 
        "BACKEND_API_URL": "https://api.ibcm.app/backend"
    }
}
