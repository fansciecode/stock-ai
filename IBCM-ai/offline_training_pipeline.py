#!/usr/bin/env python3
"""
IBCM AI - Offline Training Pipeline
This is the CORRECT approach: Train the model offline, then serve it.

Flow: MongoDB Data → Training Dataset → Fine-tuned LLaMA → Production Model
"""

import os
import json
import logging
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any
import torch
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, 
    TrainingArguments, Trainer, DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset
from pymongo import MongoClient
import pandas as pd

# Import local modules
try:
    from web_data_trainer import create_web_data_trainer
    from dummy_training_data import create_dummy_training_data_generator
    WEB_TRAINING_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Web training modules not available: {e}")
    WEB_TRAINING_AVAILABLE = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OfflineTrainingPipeline:
    """
    Offline training pipeline that creates the IBCM-specific AI model
    Based on the document requirements: LLaMA + LoRA fine-tuning + MongoDB data
    This runs separately from the main API service
    """
    
    def __init__(self, config):
        self.config = config
        try:
            self.mongo_client = MongoClient(config.MONGO_URI)
            self.db = self.mongo_client[config.DB_NAME]
            # Test connection
            self.mongo_client.admin.command('ping')
            self.mongo_available = True
        except Exception as e:
            logger.warning(f"MongoDB not available: {e}")
            self.mongo_client = None
            self.db = None
            self.mongo_available = False
        
        # Model paths
        self.base_model = "microsoft/DialoGPT-medium"  # Base model - will be fine-tuned for IBCM
        self.output_dir = "./trained_ibcm_model"
        
        # Initialize web data trainer and dummy data generator
        if WEB_TRAINING_AVAILABLE:
            self.web_trainer = create_web_data_trainer(config)
            self.dummy_generator = create_dummy_training_data_generator()
        else:
            self.web_trainer = None
            self.dummy_generator = None
        
    async def extract_training_data(self) -> List[Dict]:
        """Extract comprehensive training data from MongoDB + Web + Dummy data"""
        logger.info("🔍 Extracting comprehensive training data...")
        
        # 1. Extract MongoDB data (internal knowledge)
        mongodb_examples = []
        if self.mongo_available:
            try:
                logger.info("📊 Extracting training data from MongoDB...")
                
                # Extract user behavior patterns
                users = list(self.db.users.find({}))
                events = list(self.db.events.find({}))
                
                # Create training examples from successful interactions
                for user in users:
                    user_context = self._build_user_context(user)
                
                    # Find events this user interacted with
                    interactions = list(self.db.user_behavior.find({
                        "user_id": user["_id"],
                        "type": {"$in": ["click", "purchase", "booking"]}
                    }))
                    
                    for interaction in interactions:
                        event = next((e for e in events if e["_id"] == interaction.get("event_id")), None)
                        if event:
                            mongodb_examples.append({
                                "input": f"User preferences: {user_context}\nLocation: {user.get('location', 'NYC')}\nTime: {interaction.get('timestamp', 'evening')}\nLooking for recommendations.",
                                "output": f"I recommend {event['title']} - {event.get('description', '')}. This matches your interests in {user.get('keywords', ['general'])} and is perfectly located for you.",
                                "source": "mongodb_internal"
                            })
            except Exception as e:
                logger.warning(f"MongoDB query failed: {e}")
                
        logger.info(f"📊 Extracted {len(mongodb_examples)} MongoDB examples")
        
        # 2. Generate realistic dummy data (user interaction scenarios)
        dummy_examples = []
        if self.dummy_generator:
            logger.info("🎭 Generating realistic dummy training data...")
            dummy_examples = self.dummy_generator.generate_comprehensive_training_data(300)
            logger.info(f"🎭 Generated {len(dummy_examples)} realistic dummy examples")
        else:
            logger.info("🔧 Dummy data generator not available, using basic synthetic data")
        
        # 3. Create comprehensive dataset (MongoDB + Web + Dummy)
        if self.web_trainer:
            logger.info("🌐 Creating comprehensive training dataset...")
            comprehensive_data = await self.web_trainer.create_comprehensive_training_dataset(
                mongodb_examples + dummy_examples
            )
        else:
            logger.info("🔧 Web trainer not available, using internal data only")
            comprehensive_data = mongodb_examples + dummy_examples
        
        # 4. Add spatio-temporal and business examples
        await self._add_spatiotemporal_examples(comprehensive_data)
        await self._add_business_examples(comprehensive_data)
        
        logger.info(f"✅ Created comprehensive dataset with {len(comprehensive_data)} examples")
        logger.info(f"📊 Data sources: MongoDB({len(mongodb_examples)}), Dummy({len(dummy_examples)}), Web+Enhanced({len(comprehensive_data) - len(mongodb_examples) - len(dummy_examples)})")
        
        return comprehensive_data
    
    def _build_user_context(self, user: Dict) -> str:
        """Build user context for training"""
        keywords = user.get('keywords', [])
        location = user.get('location', 'NYC')
        return f"interests: {', '.join(keywords[:5])}, location: {location}"
    
    async def _add_spatiotemporal_examples(self, examples: List[Dict]):
        """Add location and time-specific training examples"""
        spatiotemporal_examples = [
            {
                "input": "User in NYC, Friday evening, looking for entertainment",
                "output": "Based on NYC Friday evening patterns, I recommend live music venues, comedy shows, or rooftop bars. These are most popular during weekend evenings in Manhattan."
            },
            {
                "input": "User in NYC, lunch time, looking for quick food",
                "output": "For NYC lunch time, I suggest food trucks, quick-service restaurants, or grab-and-go spots within 5 minutes walk. Consider traffic and wait times."
            },
            {
                "input": "Spa services, weekend morning, NYC",
                "output": "Weekend mornings are perfect for spa services in NYC. Most spas offer special packages and are less crowded before 11 AM."
            },
            {
                "input": "Business optimization: low demand Thursday morning",
                "output": "For low demand periods like Thursday morning, consider offering 15-20% discounts, promoting via social media, or creating bundle deals to attract customers."
            }
        ]
        examples.extend(spatiotemporal_examples)
    
    async def _add_business_examples(self, examples: List[Dict]):
        """Add business intelligence training examples"""
        business_examples = [
            {
                "input": "Business analytics: predict demand for weekend spa services",
                "output": "Weekend spa demand typically increases 40-60% compared to weekdays. Peak hours are 10 AM - 2 PM. Recommend booking early or offering late afternoon slots at discount."
            },
            {
                "input": "Dynamic pricing: high demand Friday night restaurant",
                "output": "High demand Friday night suggests increasing prices by 10-15% or creating premium time slots. Consider surge pricing model with advance booking discounts."
            },
            {
                "input": "Inventory optimization: local cafe, morning rush",
                "output": "Morning rush requires 2.5x normal coffee inventory and 3x pastry stock. Have extra staff 7-9 AM. Consider pre-order system to reduce wait times."
            }
        ]
        examples.extend(business_examples)
    
    async def prepare_training_dataset(self, examples: List[Dict]) -> Dataset:
        """Prepare dataset for training"""
        logger.info("📝 Preparing training dataset...")
        
        # Format for conversation-style training
        formatted_examples = []
        for example in examples:
            formatted_text = f"Human: {example['input']}\n\nIBCM AI: {example['output']}<|endoftext|>"
            formatted_examples.append({"text": formatted_text})
        
        dataset = Dataset.from_list(formatted_examples)
        return dataset
    
    async def train_ibcm_model(self, dataset: Dataset):
        """Train the IBCM-specific model"""
        logger.info("🎯 Starting IBCM model training...")
        
        # Load base model and tokenizer
        tokenizer = AutoTokenizer.from_pretrained(self.base_model)
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load base model with device-specific configuration
        if self.config.DEVICE == "mps":
            # MPS doesn't support quantization
            model = AutoModelForCausalLM.from_pretrained(
                self.base_model,
                torch_dtype=torch.float16,
                trust_remote_code=True
            ).to(self.config.DEVICE)
        elif self.config.DEVICE == "cuda":
            # Use quantization for CUDA
            model = AutoModelForCausalLM.from_pretrained(
                self.base_model,
                torch_dtype=torch.float16,
                device_map="auto",
                load_in_8bit=True
            )
            # Prepare for training
            model = prepare_model_for_kbit_training(model)
        else:
            # CPU fallback
            model = AutoModelForCausalLM.from_pretrained(
                self.base_model,
                torch_dtype=torch.float32,
                trust_remote_code=True
            )
        
        # LoRA configuration
        lora_config = LoraConfig(
            r=16,
            lora_alpha=32,
            target_modules=["c_attn", "c_proj"],  # DialoGPT specific
            lora_dropout=0.1,
            bias="none",
            task_type="CAUSAL_LM"
        )
        
        model = get_peft_model(model, lora_config)
        
        # Tokenize dataset
        def tokenize_function(examples):
            # Handle batch of texts
            return tokenizer(
                examples["text"], 
                truncation=True, 
                padding=False,  # Don't pad in tokenization, let data collator handle it
                max_length=512
            )
        
        tokenized_dataset = dataset.map(tokenize_function, batched=True, remove_columns=["text"])
        
        # Training arguments with device-specific settings
        if self.config.DEVICE == "mps":
            # MPS doesn't support fp16 mixed precision
            training_args = TrainingArguments(
                output_dir=self.output_dir,
                overwrite_output_dir=True,
                num_train_epochs=1,  # Reduced for testing
                per_device_train_batch_size=1,
                gradient_accumulation_steps=4,
                warmup_steps=10,
                learning_rate=2e-4,
                fp16=False,  # Disable for MPS
                logging_steps=10,
                save_steps=500,
                eval_steps=500,
                save_total_limit=3,
                remove_unused_columns=False,
            )
        else:
            # CUDA and CPU can use fp16
            training_args = TrainingArguments(
                output_dir=self.output_dir,
                overwrite_output_dir=True,
                num_train_epochs=3,
                per_device_train_batch_size=2,
                gradient_accumulation_steps=4,
                warmup_steps=100,
                learning_rate=2e-4,
                fp16=True,
                logging_steps=10,
                save_steps=500,
                eval_steps=500,
                save_total_limit=3,
                remove_unused_columns=False,
            )
        
        # Data collator for causal language modeling
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=tokenizer, 
            mlm=False
        )
        
        # Trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=data_collator,
        )
        
        # Train the model
        logger.info("🏋️ Training in progress...")
        trainer.train()
        
        # Save the trained model
        trainer.save_model()
        tokenizer.save_pretrained(self.output_dir)
        
        logger.info(f"✅ IBCM model training completed! Saved to {self.output_dir}")
        
        return self.output_dir
    
    async def run_training(self):
        """Run the complete offline training pipeline"""
        logger.info("🚀 Starting IBCM AI Training Pipeline...")
        
        try:
            # 1. Extract training data from MongoDB
            training_data = await self.extract_training_data()
            
            if len(training_data) < 10:
                logger.warning("⚠️ Very few training examples found. Adding more synthetic examples...")
                await self._add_synthetic_examples(training_data)
            
            # 2. Prepare dataset
            dataset = await self.prepare_training_dataset(training_data)
            
            # 3. Train the model
            model_path = await self.train_ibcm_model(dataset)
            
            # 4. Create deployment info
            deployment_info = {
                "model_path": model_path,
                "training_date": datetime.now().isoformat(),
                "training_examples": len(training_data),
                "base_model": self.base_model,
                "version": "1.0.0"
            }
            
            with open(f"{model_path}/deployment_info.json", "w") as f:
                json.dump(deployment_info, f, indent=2)
            
            logger.info("🎉 IBCM AI Training Pipeline completed successfully!")
            logger.info(f"📁 Model ready for deployment at: {model_path}")
            
            return model_path
            
        except Exception as e:
            logger.error(f"❌ Training pipeline failed: {e}")
            raise
    
    async def _add_synthetic_examples(self, examples: List[Dict]):
        """Add synthetic training examples if not enough real data"""
        synthetic_examples = [
            {
                "input": "User in NYC interested in food, looking for dinner recommendations",
                "output": "For dinner in NYC, I recommend exploring Italian restaurants in Little Italy, trendy rooftop dining in Manhattan, or authentic food trucks in various neighborhoods. Consider your budget and preferred atmosphere."
            },
            {
                "input": "Business wants to increase weekend foot traffic",
                "output": "To increase weekend foot traffic, consider hosting special events, offering weekend-only promotions, extending hours, and leveraging social media with location-based targeting."
            },
            {
                "input": "User prefers wellness activities, Saturday morning, budget under $100",
                "output": "For wellness under $100 on Saturday morning, I suggest yoga classes ($25-40), spa day passes ($60-80), hiking groups (free), or meditation workshops ($30-50)."
            },
        ]
        examples.extend(synthetic_examples * 10)  # Repeat to get enough examples

# Factory function
async def run_offline_training(config):
    """Main function to run offline training"""
    pipeline = OfflineTrainingPipeline(config)
    return await pipeline.run_training()

if __name__ == "__main__":
    # This script runs offline to train the model
    from config import config
    
    asyncio.run(run_offline_training(config))
