#!/usr/bin/env python3
"""
IBCM Model Training Script
Run this script offline to train your IBCM-specific AI model

Usage:
    python train_ibcm_model.py

This creates a trained model that main.py will then load and serve.
"""

import asyncio
import logging
import sys
import os
from config import config
from offline_training_pipeline import run_offline_training

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main():
    """Main training function"""
    logger.info("🚀 Starting IBCM AI Model Training")
    logger.info("=" * 60)
    
    try:
        # Check dependencies
        try:
            import torch
            import transformers
            import peft
            logger.info(f"✅ Dependencies check passed")
            logger.info(f"   - PyTorch: {torch.__version__}")
            logger.info(f"   - Transformers: {transformers.__version__}")
            logger.info(f"   - Device: {config.DEVICE}")
        except ImportError as e:
            logger.error(f"❌ Missing dependency: {e}")
            logger.error("Please install: pip install torch transformers peft datasets")
            return False
        
        # Check MongoDB connection
        try:
            from pymongo import MongoClient
            client = MongoClient(config.MONGO_URI)
            client.admin.command('ping')
            db = client[config.DB_NAME]
            
            # Count available data
            user_count = db.users.count_documents({})
            event_count = db.events.count_documents({})
            behavior_count = db.user_behavior.count_documents({})
            
            logger.info(f"✅ MongoDB connection successful")
            logger.info(f"   - Users: {user_count}")
            logger.info(f"   - Events: {event_count}")
            logger.info(f"   - Behaviors: {behavior_count}")
            
            if user_count == 0 and event_count == 0:
                logger.warning("⚠️ No training data found in MongoDB")
                logger.info("💡 Training will use synthetic examples instead")
            
        except Exception as e:
            logger.warning(f"⚠️ MongoDB connection failed: {e}")
            logger.info("💡 Training will use synthetic examples only")
            user_count = event_count = behavior_count = 0
        
        # Run training pipeline
        logger.info("🎯 Starting training pipeline...")
        from offline_training_pipeline import OfflineTrainingPipeline
        
        pipeline = OfflineTrainingPipeline(config)
        model_path = await pipeline.run_training()
        
        if model_path:
            logger.info("=" * 60)
            logger.info("🎉 TRAINING COMPLETED SUCCESSFULLY!")
            logger.info(f"📁 Trained model saved to: {model_path}")
            logger.info("🚀 You can now run main.py to serve the trained model")
            logger.info("=" * 60)
            return True
        else:
            logger.error("❌ Training failed")
            return False
            
    except KeyboardInterrupt:
        logger.info("⏹️ Training interrupted by user")
        return False
    except Exception as e:
        logger.error(f"❌ Training failed with error: {e}")
        return False

if __name__ == "__main__":
    print("🦙 IBCM AI Model Training")
    print("This script trains your custom IBCM AI model using your MongoDB data")
    print()
    
    # Check if trained model already exists
    if os.path.exists("./trained_ibcm_model"):
        response = input("⚠️ Trained model already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print("Training cancelled.")
            sys.exit(0)
    
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
