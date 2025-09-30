#!/usr/bin/env python3
"""
Production Model Loader for IBCM AI
Loads the pre-trained IBCM model for serving responses
"""

import os
import json
import logging
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
from typing import Optional

logger = logging.getLogger(__name__)

class ProductionIBCMModel:
    """
    Production model that serves the trained IBCM AI
    This is what actually powers all user responses
    """
    
    def __init__(self, model_path: str = "./trained_ibcm_model", device: str = "mps"):
        self.model_path = model_path
        self.device = device
        self.model = None
        self.tokenizer = None
        self.model_info = None
        self.loaded = False
        
    async def load_model(self) -> bool:
        """Load the trained IBCM model"""
        try:
            logger.info(f"🎯 Loading IBCM trained model from {self.model_path}")
            
            # Check if trained model exists
            if not os.path.exists(self.model_path):
                logger.warning(f"⚠️ Trained model not found at {self.model_path}")
                return await self._load_fallback_model()
            
            # Load deployment info
            info_path = os.path.join(self.model_path, "deployment_info.json")
            if os.path.exists(info_path):
                with open(info_path, 'r') as f:
                    self.model_info = json.load(f)
                logger.info(f"📊 Model info: {self.model_info}")
            
            # Load tokenizer
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            # Load base model
            base_model_name = self.model_info.get("base_model", "microsoft/DialoGPT-medium")
            # Load base model with device-specific configuration
            if self.device == "mps":
                # MPS configuration
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_name,
                    torch_dtype=torch.float16,
                    trust_remote_code=True
                ).to(self.device)
            elif self.device == "cuda":
                # CUDA configuration
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_name,
                    torch_dtype=torch.float16,
                    device_map="auto",
                    trust_remote_code=True
                )
            else:
                # CPU configuration
                base_model = AutoModelForCausalLM.from_pretrained(
                    base_model_name,
                    torch_dtype=torch.float32,
                    trust_remote_code=True
                )
            
            # Load the fine-tuned PEFT model
            self.model = PeftModel.from_pretrained(base_model, self.model_path)
            self.model.eval()
            
            self.loaded = True
            logger.info("✅ IBCM trained model loaded successfully!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load trained model: {e}")
            return await self._load_fallback_model()
    
    async def _load_fallback_model(self) -> bool:
        """Load fallback model if trained model fails"""
        try:
            logger.info("🔄 Loading fallback model...")
            
            base_model_name = "microsoft/DialoGPT-medium"
            self.tokenizer = AutoTokenizer.from_pretrained(base_model_name)
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                torch_dtype=torch.float16 if self.device != "cpu" else torch.float32,
                device_map="auto" if self.device != "cpu" else None
            )
            
            self.model_info = {
                "model_type": "fallback",
                "base_model": base_model_name,
                "version": "fallback-1.0"
            }
            
            self.loaded = True
            logger.info("✅ Fallback model loaded")
            return True
            
        except Exception as e:
            logger.error(f"❌ Even fallback model failed: {e}")
            return False
    
    async def generate_response(self, prompt: str, max_length: int = 150) -> str:
        """Generate response using the loaded IBCM model"""
        if not self.loaded or not self.model:
            return "IBCM AI is currently initializing. Please try again."
        
        try:
            # Format prompt for IBCM conversation style
            formatted_prompt = f"Human: {prompt}\n\nIBCM AI:"
            
            # Tokenize
            inputs = self.tokenizer(
                formatted_prompt,
                return_tensors="pt",
                truncation=True,
                max_length=400,
                padding=True
            )
            
            # Move to device
            if self.device != "cpu" and hasattr(self.model, 'device'):
                inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            # Generate response with improved error handling
            with torch.no_grad():
                # Add top_k and top_p for better stability, more conservative settings
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=min(max_length, 50),  # Reduce max tokens further
                    temperature=0.8,  # Slightly higher temperature
                    do_sample=True,
                    top_k=40,  # More conservative top_k
                    top_p=0.85,  # More conservative top_p
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.05,  # Lower repetition penalty
                    no_repeat_ngram_size=2,  # Smaller n-gram size
                    early_stopping=True,
                    use_cache=True  # Enable caching
                )
            
            # Decode response
            response = self.tokenizer.decode(
                outputs[0][inputs['input_ids'].shape[1]:],
                skip_special_tokens=True
            )
            
            # Clean up response
            response = response.strip()
            if not response:
                return self._get_default_response(prompt)
            
            return response
            
        except Exception as e:
            logger.error(f"❌ Generation error: {e}")
            return self._get_default_response(prompt)
    
    def _get_default_response(self, prompt: str) -> str:
        """Get default response when generation fails"""
        prompt_lower = prompt.lower()
        
        if any(word in prompt_lower for word in ['spa', 'wellness', 'massage']):
            return "I can help you find excellent spa and wellness services in your area. Let me search for the best options based on your preferences."
        elif any(word in prompt_lower for word in ['food', 'restaurant', 'eat', 'dinner']):
            return "I'd be happy to recommend great dining options near you. I can find restaurants that match your taste and budget."
        elif any(word in prompt_lower for word in ['event', 'activity', 'fun']):
            return "Let me help you discover exciting events and activities in your area. I'll find options that match your interests."
        else:
            return "I'm here to help you discover personalized recommendations for events, dining, wellness, and services in your area. What are you looking for?"
    
    def get_model_status(self) -> dict:
        """Get model status information"""
        return {
            "loaded": self.loaded,
            "model_path": self.model_path,
            "model_info": self.model_info,
            "device": self.device,
            "is_trained_model": os.path.exists(self.model_path) and self.model_info and self.model_info.get("model_type") != "fallback"
        }

# Factory function
async def load_trained_ibcm_model(device: str = "mps") -> ProductionIBCMModel:
    """Load the production IBCM model"""
    model = ProductionIBCMModel(device=device)
    await model.load_model()
    return model
