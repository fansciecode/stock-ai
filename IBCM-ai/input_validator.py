#!/usr/bin/env python3
"""
Input Validation and Sanitization Module
Ensures all user input is properly cleaned before processing by LLM
"""

import re
import html
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Result of input validation"""
    is_valid: bool
    cleaned_input: str
    warnings: List[str]
    blocked_content: List[str]

class InputValidator:
    """
    Comprehensive input validation and sanitization for LLM processing
    """
    
    def __init__(self):
        # Dangerous patterns that should be blocked or sanitized
        self.dangerous_patterns = [
            # Prompt injection attempts
            r'(?i)(ignore|forget|disregard)\s+(previous|above|all)\s+(instructions|prompts|rules)',
            r'(?i)you\s+are\s+now\s+a\s+different\s+(bot|ai|assistant)',
            r'(?i)(pretend|act|behave)\s+like\s+you\s+are',
            r'(?i)new\s+instructions?:',
            r'(?i)system\s*:?\s*you\s+must',
            r'(?i)\[INST\]|\[/INST\]',  # LLaMA instruction tokens
            r'(?i)<\|system\|>|<\|user\|>|<\|assistant\|>',  # Chat template tokens
            
            # Code injection attempts
            r'(?i)<script[^>]*>.*?</script>',
            r'(?i)javascript:',
            r'(?i)eval\s*\(',
            r'(?i)exec\s*\(',
            
            # SQL injection patterns
            r'(?i)(union|select|insert|update|delete|drop)\s+.*\s+(from|into|table)',
            r'(?i);\s*(drop|delete|truncate)',
            
            # Command injection
            r'(?i)(\||&|;|\$\(|\`|<|>)',
            
            # Personal information patterns (basic)
            r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',  # Credit card pattern
            r'\b\d{3}-?\d{2}-?\d{4}\b',  # SSN pattern
        ]
        
        # Compile patterns for efficiency
        self.compiled_patterns = [re.compile(pattern) for pattern in self.dangerous_patterns]
        
        # Maximum lengths for different input types
        self.max_lengths = {
            'query': 500,
            'description': 1000,
            'title': 100,
            'username': 50,
            'email': 100,
            'message': 2000
        }
        
        # Allowed characters pattern (alphanumeric + basic punctuation + unicode letters)
        self.allowed_chars = re.compile(r'^[\w\s\-.,!?\'\"();:@#$%&*+=\[\]{}/\\<>|~`\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF]+$')
        
    def validate_and_clean(self, user_input: str, input_type: str = 'query') -> ValidationResult:
        """
        Main validation and cleaning function
        
        Args:
            user_input: Raw user input
            input_type: Type of input (query, description, etc.)
            
        Returns:
            ValidationResult with cleaned input and validation status
        """
        warnings = []
        blocked_content = []
        
        if not user_input or not isinstance(user_input, str):
            return ValidationResult(
                is_valid=False,
                cleaned_input="",
                warnings=["Empty or invalid input"],
                blocked_content=[]
            )
        
        # Step 1: Length validation
        max_length = self.max_lengths.get(input_type, 500)
        if len(user_input) > max_length:
            user_input = user_input[:max_length]
            warnings.append(f"Input truncated to {max_length} characters")
        
        # Step 2: HTML decode and basic sanitization
        cleaned_input = html.unescape(user_input)
        cleaned_input = self._remove_html_tags(cleaned_input)
        
        # Step 3: Check for dangerous patterns
        for pattern in self.compiled_patterns:
            matches = pattern.findall(cleaned_input)
            if matches:
                blocked_content.extend(matches)
                # Replace dangerous content with safe placeholder
                cleaned_input = pattern.sub('[FILTERED]', cleaned_input)
        
        # Step 4: Character filtering
        if not self.allowed_chars.match(cleaned_input):
            # Remove disallowed characters
            cleaned_input = re.sub(r'[^\w\s\-.,!?\'\"();:@#$%&*+=\[\]{}/\\<>|~`\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF]', '', cleaned_input)
            warnings.append("Some special characters were removed")
        
        # Step 5: Normalize whitespace
        cleaned_input = re.sub(r'\s+', ' ', cleaned_input).strip()
        
        # Step 6: Additional safety checks
        cleaned_input = self._additional_safety_checks(cleaned_input)
        
        # Determine if input is valid
        is_valid = (
            len(cleaned_input) > 0 and
            len(blocked_content) == 0 and
            not self._contains_only_filtered_content(cleaned_input)
        )
        
        if blocked_content:
            warnings.append(f"Blocked {len(blocked_content)} potentially dangerous patterns")
        
        return ValidationResult(
            is_valid=is_valid,
            cleaned_input=cleaned_input,
            warnings=warnings,
            blocked_content=blocked_content
        )
    
    def _remove_html_tags(self, text: str) -> str:
        """Remove HTML tags from text"""
        clean = re.compile('<.*?>')
        return re.sub(clean, '', text)
    
    def _additional_safety_checks(self, text: str) -> str:
        """Additional safety transformations"""
        # Escape potential template injection
        text = text.replace('{', '{{').replace('}', '}}')
        
        # Remove excessive repeated characters
        text = re.sub(r'(.)\1{10,}', r'\1\1\1', text)
        
        # Remove potential unicode attacks
        text = text.encode('ascii', 'ignore').decode('ascii')
        
        return text
    
    def _contains_only_filtered_content(self, text: str) -> bool:
        """Check if text contains only filtered placeholders"""
        return text.strip() == '[FILTERED]' or text.count('[FILTERED]') > len(text.replace('[FILTERED]', '')) / 2
    
    def validate_json_input(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate and clean JSON input data
        
        Args:
            data: Dictionary of input data
            
        Returns:
            Dictionary with cleaned data
        """
        cleaned_data = {}
        
        for key, value in data.items():
            if isinstance(value, str):
                # Validate the key name
                clean_key = re.sub(r'[^\w_]', '', key)[:50]
                
                # Determine input type based on key name
                input_type = self._determine_input_type(clean_key)
                
                # Validate and clean the value
                result = self.validate_and_clean(value, input_type)
                
                if result.is_valid:
                    cleaned_data[clean_key] = result.cleaned_input
                    if result.warnings:
                        logger.warning(f"Input validation warnings for {clean_key}: {result.warnings}")
                else:
                    logger.warning(f"Invalid input for {clean_key}: {result.blocked_content}")
                    # Use safe default
                    cleaned_data[clean_key] = "general inquiry"
                    
            elif isinstance(value, (int, float, bool)):
                # Numeric values - validate ranges
                clean_key = re.sub(r'[^\w_]', '', key)[:50]
                cleaned_data[clean_key] = self._validate_numeric(value, clean_key)
                
            elif isinstance(value, dict):
                # Recursive validation for nested objects
                clean_key = re.sub(r'[^\w_]', '', key)[:50]
                cleaned_data[clean_key] = self.validate_json_input(value)
                
            elif isinstance(value, list):
                # Validate lists
                clean_key = re.sub(r'[^\w_]', '', key)[:50]
                cleaned_data[clean_key] = self._validate_list(value)
        
        return cleaned_data
    
    def _determine_input_type(self, key: str) -> str:
        """Determine input type based on key name"""
        key_lower = key.lower()
        
        if 'query' in key_lower or 'search' in key_lower or 'question' in key_lower:
            return 'query'
        elif 'description' in key_lower or 'content' in key_lower:
            return 'description'
        elif 'title' in key_lower or 'name' in key_lower:
            return 'title'
        elif 'email' in key_lower:
            return 'email'
        elif 'message' in key_lower or 'comment' in key_lower:
            return 'message'
        else:
            return 'query'  # Default
    
    def _validate_numeric(self, value: Any, key: str) -> Any:
        """Validate numeric inputs"""
        if isinstance(value, bool):
            return value
        
        if isinstance(value, (int, float)):
            # Apply reasonable bounds based on key name
            key_lower = key.lower()
            
            if 'lat' in key_lower or 'latitude' in key_lower:
                return max(-90, min(90, value))
            elif 'lon' in key_lower or 'longitude' in key_lower:
                return max(-180, min(180, value))
            elif 'radius' in key_lower or 'distance' in key_lower:
                return max(0, min(1000, value))  # Max 1000km radius
            elif 'price' in key_lower or 'amount' in key_lower or 'budget' in key_lower:
                return max(0, min(1000000, value))  # Max 1M
            elif 'age' in key_lower:
                return max(0, min(150, value))
            else:
                # General numeric bounds
                return max(-1000000, min(1000000, value))
        
        return 0  # Default for invalid numeric
    
    def _validate_list(self, items: List[Any]) -> List[Any]:
        """Validate list inputs"""
        if not isinstance(items, list):
            return []
        
        # Limit list size
        items = items[:50]
        
        validated_items = []
        for item in items:
            if isinstance(item, str):
                result = self.validate_and_clean(item, 'query')
                if result.is_valid:
                    validated_items.append(result.cleaned_input)
            elif isinstance(item, (int, float, bool)):
                validated_items.append(self._validate_numeric(item, 'list_item'))
            elif isinstance(item, dict):
                validated_items.append(self.validate_json_input(item))
        
        return validated_items
    
    def create_safe_prompt(self, user_query: str, context: str = "", system_instruction: str = "") -> str:
        """
        Create a safe prompt for LLM processing
        
        Args:
            user_query: Validated user query
            context: Additional context
            system_instruction: System instruction
            
        Returns:
            Safe prompt string
        """
        # Ensure all inputs are validated
        query_result = self.validate_and_clean(user_query, 'query')
        context_result = self.validate_and_clean(context, 'description')
        
        if not query_result.is_valid:
            user_query = "general inquiry about services"
            logger.warning(f"Invalid query replaced with default: {query_result.blocked_content}")
        else:
            user_query = query_result.cleaned_input
        
        if not context_result.is_valid:
            context = ""
        else:
            context = context_result.cleaned_input
        
        # Construct safe prompt with clear delimiters
        prompt_parts = []
        
        if system_instruction:
            prompt_parts.append(f"System: {system_instruction}")
        
        prompt_parts.append("User Query: " + user_query)
        
        if context:
            prompt_parts.append("Context: " + context)
        
        prompt_parts.append("Assistant:")
        
        return "\n\n".join(prompt_parts)

# Global validator instance
input_validator = InputValidator()

def validate_user_input(user_input: str, input_type: str = 'query') -> ValidationResult:
    """Convenience function for input validation"""
    return input_validator.validate_and_clean(user_input, input_type)

def validate_json_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function for JSON validation"""
    return input_validator.validate_json_input(data)

def create_safe_llm_prompt(user_query: str, context: str = "", system_instruction: str = "") -> str:
    """Convenience function for creating safe LLM prompts"""
    return input_validator.create_safe_prompt(user_query, context, system_instruction)
