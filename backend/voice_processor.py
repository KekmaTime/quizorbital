import logging
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
import torch
from sentence_transformers import SentenceTransformer, util
import re
import json
import os
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import nltk
from difflib import SequenceMatcher

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download NLTK resources if needed
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class VoiceProcessor:
    """
    Processes voice input responses and matches them against expected answers
    using semantic similarity and other NLP techniques.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the voice processor.
        
        Args:
            model_name: Name of the sentence-transformers model to use
        """
        self.model_name = model_name
        
        # Load the embedding model
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        
        # Load stopwords
        self.stop_words = set(stopwords.words('english'))
        
        # Similarity thresholds
        self.high_confidence_threshold = 0.85
        self.medium_confidence_threshold = 0.70
        self.low_confidence_threshold = 0.50
        
        logger.info("Voice processor initialized")
    
    def process_voice_response(self, 
                              voice_text: str, 
                              expected_answer: Any, 
                              question_type: str) -> Dict[str, Any]:
        """
        Process a voice response and match it against the expected answer.
        
        Args:
            voice_text: Transcribed text from voice input
            expected_answer: Expected answer in appropriate format
            question_type: Type of question (multiple-choice, descriptive, etc.)
            
        Returns:
            Dictionary with match results and confidence score
        """
        logger.info(f"Processing voice response for {question_type} question")
        
        # Clean the voice text
        cleaned_voice_text = self._clean_text(voice_text)
        
        # Process based on question type
        if question_type == "multiple-choice":
            return self._process_multiple_choice(cleaned_voice_text, expected_answer)
        elif question_type == "true-false":
            return self._process_true_false(cleaned_voice_text)
        elif question_type == "descriptive":
            return self._process_descriptive(cleaned_voice_text, expected_answer)
        elif question_type == "fill-blank":
            return self._process_fill_blank(cleaned_voice_text, expected_answer)
        elif question_type == "matching":
            return self._process_matching(cleaned_voice_text, expected_answer)
        elif question_type == "sequence":
            return self._process_sequence(cleaned_voice_text, expected_answer)
        else:
            logger.warning(f"Unsupported question type: {question_type}")
            return {
                "is_correct": False,
                "confidence": 0.0,
                "matched_answer": None,
                "explanation": "Unsupported question type"
            }
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation except apostrophes
        text = re.sub(r'[^\w\s\']', ' ', text)
        
        # Replace multiple spaces with a single space
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _process_multiple_choice(self, 
                                voice_text: str, 
                                expected_answer: Any) -> Dict[str, Any]:
        """Process multiple choice voice response."""
        # Extract potential option indicators (A, B, C, D, 1, 2, 3, 4)
        option_indicators = re.findall(r'\b([a-d]|[1-4])\b', voice_text)
        
        # Check for option text match
        if isinstance(expected_answer, dict) and "options" in expected_answer:
            options = expected_answer["options"]
            correct_option = expected_answer["correct"]
            
            # Calculate similarity with each option
            similarities = []
            for option in options:
                similarity = self._calculate_semantic_similarity(voice_text, option)
                similarities.append(similarity)
            
            # Find the best match
            best_match_index = np.argmax(similarities)
            best_match_similarity = similarities[best_match_index]
            
            # Check if the best match corresponds to the correct answer
            is_correct = best_match_index == correct_option
            
            return {
                "is_correct": is_correct,
                "confidence": best_match_similarity,
                "matched_answer": best_match_index,
                "explanation": f"Matched option {best_match_index+1} with confidence {best_match_similarity:.2f}"
            }
        
        # If we have option indicators, use them
        elif option_indicators:
            # Convert letter options to indices (a->0, b->1, etc.)
            selected_option = None
            for indicator in option_indicators:
                if indicator.isalpha():
                    selected_option = ord(indicator) - ord('a')
                else:
                    selected_option = int(indicator) - 1
                
                # Only use the first valid indicator
                if 0 <= selected_option <= 3:
                    break
            
            if selected_option is not None:
                is_correct = selected_option == expected_answer
                return {
                    "is_correct": is_correct,
                    "confidence": 0.9,  # High confidence for explicit option selection
                    "matched_answer": selected_option,
                    "explanation": f"Selected option {chr(selected_option + ord('a'))} or {selected_option+1}"
                }
        
        # Fallback: try to match with option text
        return {
            "is_correct": False,
            "confidence": 0.0,
            "matched_answer": None,
            "explanation": "Could not determine selected option"
        }
    
    def _process_true_false(self, voice_text: str) -> Dict[str, Any]:
        """Process true/false voice response."""
        # Look for true/false indicators
        true_indicators = ["true", "yes", "correct", "right", "t"]
        false_indicators = ["false", "no", "incorrect", "wrong", "f"]
        
        # Tokenize the voice text
        tokens = word_tokenize(voice_text)
        
        # Check for true indicators
        true_matches = sum(1 for token in tokens if token.lower() in true_indicators)
        false_matches = sum(1 for token in tokens if token.lower() in false_indicators)
        
        if true_matches > false_matches:
            return {
                "is_correct": True,
                "confidence": min(0.5 + (true_matches * 0.1), 0.9),
                "matched_answer": True,
                "explanation": f"Detected {true_matches} true indicators"
            }
        elif false_matches > true_matches:
            return {
                "is_correct": False,
                "confidence": min(0.5 + (false_matches * 0.1), 0.9),
                "matched_answer": False,
                "explanation": f"Detected {false_matches} false indicators"
            }
        else:
            # No clear indicators, use semantic similarity
            true_similarity = self._calculate_semantic_similarity(voice_text, "true")
            false_similarity = self._calculate_semantic_similarity(voice_text, "false")
            
            if true_similarity > false_similarity:
                return {
                    "is_correct": True,
                    "confidence": true_similarity,
                    "matched_answer": True,
                    "explanation": f"Semantically closer to 'true' ({true_similarity:.2f})"
                }
            else:
                return {
                    "is_correct": False,
                    "confidence": false_similarity,
                    "matched_answer": False,
                    "explanation": f"Semantically closer to 'false' ({false_similarity:.2f})"
                }
    
    def _process_descriptive(self, 
                            voice_text: str, 
                            expected_answer: Any) -> Dict[str, Any]:
        """Process descriptive voice response."""
        # For descriptive questions, we need to check if key concepts are mentioned
        
        # If expected answer is a list of key terms
        if isinstance(expected_answer, list):
            # Calculate how many key terms are mentioned
            mentioned_terms = []
            for term in expected_answer:
                # Clean the term
                clean_term = self._clean_text(term)
                
                # Check for exact match
                if clean_term in voice_text:
                    mentioned_terms.append(term)
                    continue
                
                # Check for semantic similarity
                similarity = self._calculate_semantic_similarity(voice_text, clean_term)
                if similarity > self.medium_confidence_threshold:
                    mentioned_terms.append(term)
            
            # Calculate coverage ratio
            coverage = len(mentioned_terms) / len(expected_answer) if expected_answer else 0
            
            # Determine correctness based on coverage
            is_correct = coverage >= 0.7  # At least 70% of key terms should be mentioned
            
            return {
                "is_correct": is_correct,
                "confidence": min(coverage + 0.2, 0.95),  # Adjust confidence based on coverage
                "matched_answer": mentioned_terms,
                "explanation": f"Mentioned {len(mentioned_terms)}/{len(expected_answer)} key terms"
            }
        
        # If expected answer is a string
        elif isinstance(expected_answer, str):
            # Calculate semantic similarity
            similarity = self._calculate_semantic_similarity(voice_text, expected_answer)
            
            # Determine correctness based on similarity threshold
            is_correct = similarity > self.medium_confidence_threshold
            
            return {
                "is_correct": is_correct,
                "confidence": similarity,
                "matched_answer": voice_text,
                "explanation": f"Semantic similarity: {similarity:.2f}"
            }
        
        # Fallback
        return {
            "is_correct": False,
            "confidence": 0.0,
            "matched_answer": None,
            "explanation": "Could not evaluate descriptive answer"
        }
    
    def _process_fill_blank(self, 
                           voice_text: str, 
                           expected_answer: Any) -> Dict[str, Any]:
        """Process fill-in-the-blank voice response."""
        # Expected answer can be a string or a list of acceptable answers
        if isinstance(expected_answer, list):
            # Calculate similarity with each acceptable answer
            similarities = [self._calculate_semantic_similarity(voice_text, ans) for ans in expected_answer]
            
            # Find the best match
            best_match_index = np.argmax(similarities)
            best_match_similarity = similarities[best_match_index]
            
            # Determine correctness based on similarity threshold
            is_correct = best_match_similarity > self.medium_confidence_threshold
            
            return {
                "is_correct": is_correct,
                "confidence": best_match_similarity,
                "matched_answer": expected_answer[best_match_index],
                "explanation": f"Best match: '{expected_answer[best_match_index]}' with similarity {best_match_similarity:.2f}"
            }
        
        elif isinstance(expected_answer, str):
            # Calculate semantic similarity
            similarity = self._calculate_semantic_similarity(voice_text, expected_answer)
            
            # Determine correctness based on similarity threshold
            is_correct = similarity > self.medium_confidence_threshold
            
            return {
                "is_correct": is_correct,
                "confidence": similarity,
                "matched_answer": voice_text,
                "explanation": f"Semantic similarity: {similarity:.2f}"
            }
        
        # Fallback
        return {
            "is_correct": False,
            "confidence": 0.0,
            "matched_answer": None,
            "explanation": "Could not evaluate fill-in-the-blank answer"
        }
    
    def _process_matching(self, 
                         voice_text: str, 
                         expected_answer: Any) -> Dict[str, Any]:
        """Process matching voice response."""
        # Matching questions are complex for voice input
        # We'll try to extract pairs from the voice text
        
        # Expected format: "A goes with 1, B goes with 2, ..."
        if not isinstance(expected_answer, dict):
            return {
                "is_correct": False,
                "confidence": 0.0,
                "matched_answer": None,
                "explanation": "Expected answer format not supported for voice matching"
            }
        
        # Extract potential pairs
        pair_pattern = r'([a-zA-Z])\s*(?:goes with|matches|pairs with|is|to)\s*(\d+)'
        pairs = re.findall(pair_pattern, voice_text)
        
        if not pairs:
            return {
                "is_correct": False,
                "confidence": 0.1,
                "matched_answer": None,
                "explanation": "Could not extract matching pairs from voice input"
            }
        
        # Convert pairs to a dictionary
        matched_pairs = {}
        for left, right in pairs:
            matched_pairs[left.upper()] = int(right)
        
        # Calculate how many pairs match the expected answer
        correct_pairs = 0
        for key, value in matched_pairs.items():
            if key in expected_answer and expected_answer[key] == value:
                correct_pairs += 1
        
        # Calculate coverage and accuracy
        coverage = len(matched_pairs) / len(expected_answer) if expected_answer else 0
        accuracy = correct_pairs / len(matched_pairs) if matched_pairs else 0
        
        # Combined score
        combined_score = (coverage + accuracy) / 2
        
        # Determine correctness
        is_correct = combined_score > 0.7
        
        return {
            "is_correct": is_correct,
            "confidence": combined_score,
            "matched_answer": matched_pairs,
            "explanation": f"Matched {correct_pairs}/{len(expected_answer)} pairs correctly"
        }
    
    def _process_sequence(self, 
                         voice_text: str, 
                         expected_answer: Any) -> Dict[str, Any]:
        """Process sequence voice response."""
        # Sequence questions are challenging for voice input
        # We'll try to extract the sequence from the voice text
        
        if not isinstance(expected_answer, list):
            return {
                "is_correct": False,
                "confidence": 0.0,
                "matched_answer": None,
                "explanation": "Expected answer format not supported for voice sequence"
            }
        
        # Extract potential sequence indicators (1st, 2nd, first, second, etc.)
        sequence_pattern = r'(?:(\d+)(?:st|nd|rd|th)|(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth))\s+(?:is|comes|goes)\s+([a-zA-Z]+)'
        sequence_matches = re.findall(sequence_pattern, voice_text)
        
        if not sequence_matches:
            # Try simpler pattern
            sequence_pattern = r'(?:(\d+)[.,]?\s+([a-zA-Z]+))'
            sequence_matches = re.findall(sequence_pattern, voice_text)
        
        if not sequence_matches:
            return {
                "is_correct": False,
                "confidence": 0.1,
                "matched_answer": None,
                "explanation": "Could not extract sequence from voice input"
            }
        
        # Convert matches to a sequence
        extracted_sequence = []
        for position, item in sequence_matches:
            try:
                pos = int(position) - 1  # Convert to 0-based index
                while len(extracted_sequence) <= pos:
                    extracted_sequence.append(None)
                extracted_sequence[pos] = item
            except:
                continue
        
        # Remove None values
        extracted_sequence = [item for item in extracted_sequence if item is not None]
        
        if not extracted_sequence:
            return {
                "is_correct": False,
                "confidence": 0.1,
                "matched_answer": None,
                "explanation": "Could not construct valid sequence from voice input"
            }
        
        # Compare with expected sequence
        # Use Levenshtein distance for sequence comparison
        similarity = SequenceMatcher(None, extracted_sequence, expected_answer).ratio()
        
        # Determine correctness
        is_correct = similarity > 0.7
        
        return {
            "is_correct": is_correct,
            "confidence": similarity,
            "matched_answer": extracted_sequence,
            "explanation": f"Sequence similarity: {similarity:.2f}"
        }
    
    def _calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calculate semantic similarity between two texts."""
        # Generate embeddings
        embedding1 = self.model.encode(text1, convert_to_tensor=True)
        embedding2 = self.model.encode(text2, convert_to_tensor=True)
        
        # Calculate cosine similarity
        similarity = util.pytorch_cos_sim(embedding1, embedding2).item()
        
        return similarity 