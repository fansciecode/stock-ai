#!/usr/bin/env python3
"""
Text Preprocessing and Normalization Module
Cleans and formats user input into proper structured sentences for LLM processing
"""

import re
import string
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
import unicodedata

logger = logging.getLogger(__name__)

@dataclass
class PreprocessingResult:
    """Result of text preprocessing"""
    original_text: str
    cleaned_text: str
    formatted_text: str
    improvements: List[str]
    confidence_score: float

class TextPreprocessor:
    """
    Comprehensive text preprocessing for improving LLM input quality
    """
    
    def __init__(self):
        # Common abbreviations and their expansions
        self.abbreviations = {
            # Common texting abbreviations
            "u": "you", "ur": "your", "thx": "thanks", "pls": "please",
            "plz": "please", "txt": "text", "msg": "message", "tho": "though",
            "btw": "by the way", "fyi": "for your information", "asap": "as soon as possible",
            "lol": "", "lmao": "", "omg": "oh my god", "wtf": "what the",
            "brb": "be right back", "ttyl": "talk to you later", "g2g": "got to go",
            
            # Business abbreviations
            "asap": "as soon as possible", "fyi": "for your information",
            "etc": "and so on", "e.g.": "for example", "i.e.": "that is",
            "vs": "versus", "w/": "with", "w/o": "without",
            
            # Location abbreviations
            "st": "street", "ave": "avenue", "blvd": "boulevard", "rd": "road",
            "dr": "drive", "ln": "lane", "ct": "court", "pl": "place",
            
            # Time abbreviations
            "am": "AM", "pm": "PM", "min": "minutes", "hr": "hour", "hrs": "hours",
            "sec": "seconds", "mins": "minutes",
            
            # Common misspellings
            "teh": "the", "hte": "the", "adn": "and", "nad": "and",
            "recieve": "receive", "seperate": "separate", "definately": "definitely",
            "occured": "occurred", "begining": "beginning", "wierd": "weird",
            
            # Food-related common terms
            "resturant": "restaurant", "restraunt": "restaurant", "restaraunt": "restaurant",
            "cafe": "café", "restraunt": "restaurant"
        }
        
        # Common word corrections
        self.word_corrections = {
            "gonna": "going to", "wanna": "want to", "gotta": "got to",
            "shoulda": "should have", "coulda": "could have", "woulda": "would have",
            "ain't": "is not", "won't": "will not", "can't": "cannot",
            "don't": "do not", "doesn't": "does not", "didn't": "did not",
            "isn't": "is not", "aren't": "are not", "wasn't": "was not",
            "weren't": "were not", "haven't": "have not", "hasn't": "has not",
            "hadn't": "had not", "shouldn't": "should not", "couldn't": "could not",
            "wouldn't": "would not"
        }
        
        # Sentence starters for different query types
        self.sentence_templates = {
            'question': [
                "Could you help me find",
                "Can you recommend", 
                "I am looking for",
                "Please help me locate",
                "I need assistance finding"
            ],
            'request': [
                "I would like to",
                "Please help me",
                "I need to",
                "Could you assist me with"
            ],
            'search': [
                "I am searching for",
                "Please find",
                "Show me",
                "I need"
            ]
        }
        
        # Emotion words that should be preserved
        self.emotion_words = {
            'positive': ['great', 'awesome', 'amazing', 'fantastic', 'excellent', 'wonderful', 'perfect'],
            'negative': ['terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing'],
            'urgent': ['urgent', 'immediately', 'asap', 'quickly', 'fast', 'emergency']
        }
    
    def preprocess_text(self, text: str, context: str = "general") -> PreprocessingResult:
        """
        Main preprocessing function
        
        Args:
            text: Raw user input
            context: Context type (search, chat, query, etc.)
            
        Returns:
            PreprocessingResult with cleaned and formatted text
        """
        if not text or not isinstance(text, str):
            return PreprocessingResult(
                original_text=text or "",
                cleaned_text="",
                formatted_text="general inquiry",
                improvements=["Empty input replaced with default"],
                confidence_score=0.0
            )
        
        original_text = text
        improvements = []
        
        # Step 1: Basic cleaning
        cleaned_text = self._basic_cleaning(text)
        if cleaned_text != text:
            improvements.append("Basic cleaning applied")
        
        # Step 2: Normalize unicode and encoding
        cleaned_text = self._normalize_unicode(cleaned_text)
        
        # Step 3: Fix common misspellings and abbreviations
        cleaned_text, spelling_fixes = self._fix_spelling_and_abbreviations(cleaned_text)
        if spelling_fixes:
            improvements.extend(spelling_fixes)
        
        # Step 4: Grammar and sentence structure improvement
        formatted_text, grammar_fixes = self._improve_grammar(cleaned_text)
        if grammar_fixes:
            improvements.extend(grammar_fixes)
        
        # Step 5: Context-specific formatting
        formatted_text = self._context_formatting(formatted_text, context)
        
        # Step 6: Ensure proper sentence structure
        formatted_text = self._ensure_sentence_structure(formatted_text, context)
        if formatted_text != cleaned_text:
            improvements.append("Sentence structure improved")
        
        # Step 7: Calculate confidence score
        confidence_score = self._calculate_confidence(original_text, formatted_text)
        
        return PreprocessingResult(
            original_text=original_text,
            cleaned_text=cleaned_text,
            formatted_text=formatted_text,
            improvements=improvements,
            confidence_score=confidence_score
        )
    
    def _basic_cleaning(self, text: str) -> str:
        """Basic text cleaning"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Remove excessive punctuation
        text = re.sub(r'[!]{2,}', '!', text)
        text = re.sub(r'[?]{2,}', '?', text)
        text = re.sub(r'[.]{3,}', '...', text)
        
        # Remove excessive capitalization
        text = re.sub(r'([A-Z]){3,}', lambda m: m.group(0)[:2], text)
        
        # Remove non-printable characters
        text = ''.join(char for char in text if char.isprintable() or char.isspace())
        
        return text
    
    def _normalize_unicode(self, text: str) -> str:
        """Normalize unicode characters"""
        # Normalize unicode (NFD = decomposed form)
        text = unicodedata.normalize('NFD', text)
        
        # Convert smart quotes to regular quotes
        text = text.replace('"', '"').replace('"', '"')
        text = text.replace(''', "'").replace(''', "'")
        
        # Convert em dash and en dash to regular dash
        text = text.replace('—', '-').replace('–', '-')
        
        return text
    
    def _fix_spelling_and_abbreviations(self, text: str) -> Tuple[str, List[str]]:
        """Fix common misspellings and expand abbreviations"""
        fixes = []
        words = text.split()
        fixed_words = []
        
        for word in words:
            original_word = word
            # Remove punctuation for checking
            clean_word = word.lower().strip(string.punctuation)
            
            # Check abbreviations first
            if clean_word in self.abbreviations:
                replacement = self.abbreviations[clean_word]
                if replacement:  # Only replace if not empty (some abbreviations are removed)
                    # Preserve original punctuation
                    punctuation = ''.join(c for c in word if c in string.punctuation)
                    fixed_word = replacement + punctuation
                    fixed_words.append(fixed_word)
                    fixes.append(f"Expanded '{original_word}' to '{replacement}'")
                    continue
            
            # Check word corrections
            if clean_word in self.word_corrections:
                replacement = self.word_corrections[clean_word]
                punctuation = ''.join(c for c in word if c in string.punctuation)
                fixed_word = replacement + punctuation
                fixed_words.append(fixed_word)
                fixes.append(f"Corrected '{original_word}' to '{replacement}'")
                continue
            
            # Keep original word
            fixed_words.append(word)
        
        return ' '.join(fixed_words), fixes
    
    def _improve_grammar(self, text: str) -> Tuple[str, List[str]]:
        """Improve basic grammar issues"""
        fixes = []
        
        # Fix capitalization at sentence start
        sentences = re.split(r'([.!?]+)', text)
        fixed_sentences = []
        
        for i, sentence in enumerate(sentences):
            if i % 2 == 0 and sentence.strip():  # Actual sentence (not punctuation)
                # Capitalize first letter
                sentence = sentence.strip()
                if sentence and sentence[0].islower():
                    sentence = sentence[0].upper() + sentence[1:]
                    fixes.append("Capitalized sentence start")
                fixed_sentences.append(sentence)
            else:
                fixed_sentences.append(sentence)
        
        text = ''.join(fixed_sentences)
        
        # Fix common grammar patterns
        grammar_patterns = [
            (r'\bi\b', 'I'),  # Lowercase 'i' -> 'I'
            (r'\bim\b', "I'm"),  # 'im' -> "I'm"
            (r'\bive\b', "I've"),  # 'ive' -> "I've"
            (r'\bill\b', "I'll"),  # 'ill' -> "I'll"
            (r'\bid\b', "I'd"),  # 'id' -> "I'd"
        ]
        
        for pattern, replacement in grammar_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
                fixes.append(f"Grammar fix: {pattern} -> {replacement}")
        
        return text, fixes
    
    def _context_formatting(self, text: str, context: str) -> str:
        """Apply context-specific formatting"""
        text_lower = text.lower()
        
        # Add context-appropriate prefixes for very short inputs
        if len(text.split()) <= 2:
            if context == "search" or "find" in text_lower or "search" in text_lower:
                if not any(starter in text_lower for starter in ['find', 'search', 'show', 'look']):
                    text = f"I am looking for {text}"
            elif context == "question" or "?" in text:
                if not text_lower.startswith(('what', 'where', 'when', 'why', 'how', 'can', 'could', 'would')):
                    text = f"Can you help me with {text}"
        
        return text
    
    def _ensure_sentence_structure(self, text: str, context: str) -> str:
        """Ensure proper sentence structure"""
        if not text:
            return "I need assistance with a general inquiry."
        
        text = text.strip()
        
        # If text doesn't end with proper punctuation, add period
        if text and text[-1] not in '.!?':
            text += '.'
        
        # For very short queries, enhance them
        words = text.split()
        if len(words) == 1:
            word = words[0].rstrip('.')
            text = f"I need information about {word}."
        elif len(words) == 2:
            if not any(word.lower() in ['find', 'get', 'need', 'want', 'show', 'help'] for word in words):
                text = f"Please help me find {text}"
        
        # Ensure queries are in a helpful format
        if not self._is_well_formed_query(text):
            text = self._convert_to_well_formed_query(text, context)
        
        return text
    
    def _is_well_formed_query(self, text: str) -> bool:
        """Check if text is a well-formed query"""
        text_lower = text.lower()
        
        # Check for question words or helpful starts
        good_starts = [
            'i need', 'i want', 'i am looking', 'i would like', 'please',
            'can you', 'could you', 'would you', 'help me', 'show me',
            'find me', 'what', 'where', 'when', 'why', 'how'
        ]
        
        return any(text_lower.startswith(start) for start in good_starts)
    
    def _convert_to_well_formed_query(self, text: str, context: str) -> str:
        """Convert fragment to well-formed query"""
        text_lower = text.lower()
        
        # Determine query type
        if '?' in text or any(word in text_lower for word in ['what', 'where', 'when', 'why', 'how']):
            query_type = 'question'
        elif any(word in text_lower for word in ['find', 'search', 'show', 'get', 'locate']):
            query_type = 'search'
        else:
            query_type = 'request'
        
        # Choose appropriate template
        if query_type in self.sentence_templates:
            templates = self.sentence_templates[query_type]
            # Choose template based on text content
            if any(word in text_lower for word in ['restaurant', 'food', 'eat', 'meal']):
                template = "I am looking for"
            elif any(word in text_lower for word in ['help', 'assist', 'support']):
                template = "Please help me with"
            else:
                template = templates[0]  # Default to first template
            
            # Remove period from text if present for reconstruction
            clean_text = text.rstrip('.')
            return f"{template} {clean_text}."
        
        return text
    
    def _calculate_confidence(self, original: str, formatted: str) -> float:
        """Calculate confidence score for the preprocessing"""
        if not original:
            return 0.0
        
        # Base score
        score = 0.7
        
        # Length check
        if len(formatted.split()) >= 3:
            score += 0.1
        
        # Proper capitalization
        if formatted and formatted[0].isupper():
            score += 0.05
        
        # Proper punctuation
        if formatted.endswith(('.', '!', '?')):
            score += 0.05
        
        # Contains verbs or action words
        action_words = ['find', 'get', 'need', 'want', 'help', 'show', 'search', 'locate']
        if any(word in formatted.lower() for word in action_words):
            score += 0.1
        
        return min(score, 1.0)
    
    def get_preprocessing_stats(self, text: str) -> Dict:
        """Get detailed preprocessing statistics"""
        result = self.preprocess_text(text)
        
        return {
            'original_length': len(result.original_text),
            'final_length': len(result.formatted_text),
            'word_count_original': len(result.original_text.split()),
            'word_count_final': len(result.formatted_text.split()),
            'improvements_count': len(result.improvements),
            'confidence_score': result.confidence_score,
            'readability_improved': result.confidence_score > 0.8
        }

# Global preprocessor instance
text_preprocessor = TextPreprocessor()

def preprocess_user_text(text: str, context: str = "general") -> PreprocessingResult:
    """Convenience function for text preprocessing"""
    return text_preprocessor.preprocess_text(text, context)

def clean_and_format_for_llm(text: str, context: str = "query") -> str:
    """Convenience function to get formatted text for LLM"""
    result = text_preprocessor.preprocess_text(text, context)
    return result.formatted_text
