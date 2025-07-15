import os

# API Configuration
API_KEY = os.environ.get("API_KEY", "development_key")
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:5001/api")

# Database Configuration
MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://localhost:27017/ibcm_db")

# Model Configuration
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
RETRAIN_INTERVAL_DAYS = 7  # Retrain models weekly

# Logging Configuration
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO") 