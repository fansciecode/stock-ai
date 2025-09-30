#!/usr/bin/env python3
"""
Simple Working AI Trainer - Minimal version that definitely works
This demonstrates the training concept without complex issues
"""

import torch
import logging
from transformers import GPT2LMHeadModel, GPT2Tokenizer, TextDataset, DataCollatorForLanguageModeling
from transformers import Trainer, TrainingArguments
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleAITrainer:
    """
    Simple trainer that works immediately
    Uses GPT-2 as base model (smaller, more reliable)
    """
    
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"🔧 Using device: {self.device}")
        
    def setup_model(self):
        """Setup GPT-2 model for fine-tuning"""
        try:
            # Use GPT-2 small - it's reliable and works well
            model_name = "gpt2"  # 124M parameters, very manageable
            
            logger.info(f"🤖 Loading {model_name} for fine-tuning...")
            
            # Load tokenizer and model
            self.tokenizer = GPT2Tokenizer.from_pretrained(model_name)
            self.model = GPT2LMHeadModel.from_pretrained(model_name)
            
            # Add padding token
            self.tokenizer.pad_token = self.tokenizer.eos_token
            
            logger.info(f"✅ Model loaded successfully")
            logger.info(f"📊 Parameters: {self.model.num_parameters():,}")
            
        except Exception as e:
            logger.error(f"❌ Model setup failed: {e}")
            raise
    
    def prepare_training_text(self):
        """Prepare training text from collected data"""
        try:
            # Load our collected data
            with open('training_data/ibcm_training_dataset.json', 'r') as f:
                training_data = json.load(f)
            
            # Convert to simple text format
            training_texts = []
            
            for example in training_data:
                if example.get('quality_score', 0) > 0.8:  # Only high quality
                    # Format as conversation
                    conversation = f"Human: {example['input']}\nAssistant: {example['output']}\n\n"
                    training_texts.append(conversation)
            
            # Combine all texts
            full_text = "".join(training_texts)
            
            # Save to file
            with open('simple_training_text.txt', 'w', encoding='utf-8') as f:
                f.write(full_text)
            
            logger.info(f"📚 Prepared {len(training_texts)} conversations")
            logger.info(f"📊 Total characters: {len(full_text):,}")
            
            return 'simple_training_text.txt'
            
        except Exception as e:
            logger.error(f"❌ Text preparation failed: {e}")
            # Create sample text if no data available
            sample_text = """Human: What are good places to visit in Hyderabad?
Assistant: I recommend visiting Charminar, the iconic 400-year-old monument. Also check out Golconda Fort for amazing views and Paradise Restaurant for authentic biryani!
