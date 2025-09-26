#!/usr/bin/env python3
"""
🔧 SHARED UTILITIES
Common utilities used across all microservices
"""

import os
import logging
import json
import yaml
from pathlib import Path
from typing import Dict, Any

def setup_logging(service_name: str) -> logging.Logger:
    """Setup logging for a service"""
    
    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
        format=f'%(asctime)s - {service_name} - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_dir / f"{service_name}.log"),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger(service_name)
    logger.info(f"📋 Logging initialized for {service_name}")
    
    return logger

def get_config(service_name: str) -> Dict[str, Any]:
    """Get configuration for a service"""
    
    # Configuration paths
    config_paths = [
        f"config/{os.getenv('ENVIRONMENT', 'development')}/{service_name}.yaml",
        f"config/{service_name}.yaml",
        f"../../config/{service_name}.yaml"
    ]
    
    config = {}
    
    # Try to load config file
    for config_path in config_paths:
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    config = yaml.safe_load(f)
                break
            except Exception as e:
                logging.warning(f"Failed to load config from {config_path}: {e}")
    
    # Environment variable overrides
    env_config = {
        "port": int(os.getenv("PORT", 8000)),
        "environment": os.getenv("ENVIRONMENT", "development"),
        "log_level": os.getenv("LOG_LEVEL", "INFO"),
        "database_url": os.getenv("DATABASE_URL"),
        "redis_url": os.getenv("REDIS_URL")
    }
    
    # Merge configurations
    config.update(env_config)
    
    return config

def validate_environment():
    """Validate required environment variables"""
    
    required_vars = [
        "ENVIRONMENT"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise EnvironmentError(f"Missing required environment variables: {missing_vars}")

def get_service_urls() -> Dict[str, str]:
    """Get URLs for all services"""
    
    base_url = os.getenv("BASE_URL", "http://localhost")
    
    return {
        "client": f"{base_url}:8000",
        "server": f"{base_url}:8001", 
        "ai_model": f"{base_url}:8002"
    }

class HealthChecker:
    """Health check utility for services"""
    
    @staticmethod
    async def check_service_health(service_url: str) -> Dict[str, Any]:
        """Check health of a service"""
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{service_url}/health", timeout=5) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return {"status": "unhealthy", "error": f"HTTP {response.status}"}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}
    
    @staticmethod
    async def check_all_services() -> Dict[str, Any]:
        """Check health of all services"""
        service_urls = get_service_urls()
        
        health_status = {}
        for service_name, service_url in service_urls.items():
            health_status[service_name] = await HealthChecker.check_service_health(service_url)
        
        return health_status
