import logging
import numpy as np
from typing import List, Dict, Any, Tuple
import math
from datetime import datetime
from proficiency_model import ProficiencyPredictor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdaptiveLearning:
    """
    Implements adaptive learning algorithms to personalize question difficulty
    based on user performance and learning patterns.
    """
    
    def __init__(self):
        # Difficulty levels and their numerical representations
        self.difficulty_levels = {
            "beginner": 1,
            "intermediate": 2,
            "advanced": 3
        }
        
        # Inverse mapping
        self.difficulty_names = {v: k for k, v in self.difficulty_levels.items()}
        
        # Parameters for the adaptive algorithm
        self.learning_rate = 0.2  # How quickly the system adapts
        self.forgetting_factor = 0.05  # Rate at which knowledge decays
        self.confidence_threshold = 0.7  # Threshold for moving to harder questions
        
        # Initialize proficiency predictor
        self.proficiency_predictor = ProficiencyPredictor()
        
    def calculate_next_difficulty(self, 
                                 user_id: str, 
                                 topic: str, 
                                 current_performance: Dict[str, Any],
                                 historical_performance: List[Dict[str, Any]] = None) -> str:
        """
        Calculate the next appropriate difficulty level for a user on a specific topic.
        
        Args:
            user_id: The user's unique identifier
            topic: The topic or subject area
            current_performance: Dict containing current quiz performance metrics
            historical_performance: List of previous performance records
            
        Returns:
            String representing the recommended difficulty level
        """
        logger.info(f"Calculating next difficulty level for user {user_id} on topic {topic}")
        
        # Extract current performance metrics
        correct_ratio = current_performance.get("correct_ratio", 0.5)
        avg_response_time = current_performance.get("avg_response_time", 30)
        confidence_score = current_performance.get("confidence_score", 0.5)
        current_difficulty = self.difficulty_levels.get(
            current_performance.get("difficulty", "intermediate"), 2
        )
        
        # Calculate performance score (0-1)
        performance_score = self._calculate_performance_score(
            correct_ratio, avg_response_time, confidence_score
        )
        
        # Get proficiency estimate
        proficiency = self._estimate_proficiency(
            user_id, topic, performance_score, 
            current_difficulty, historical_performance
        )
        
        # Determine next difficulty level
        next_difficulty_value = self._determine_next_difficulty(
            proficiency, current_difficulty
        )
        
        # Convert numerical difficulty back to string
        next_difficulty = self.difficulty_names.get(next_difficulty_value, "intermediate")
        
        logger.info(f"Recommended next difficulty: {next_difficulty} (proficiency: {proficiency:.2f})")
        return next_difficulty
    
    def _calculate_performance_score(self, 
                                    correct_ratio: float, 
                                    avg_response_time: float,
                                    confidence_score: float) -> float:
        """
        Calculate a unified performance score based on correctness, speed, and confidence.
        
        Args:
            correct_ratio: Ratio of correct answers (0-1)
            avg_response_time: Average time to answer in seconds
            confidence_score: User's confidence level (0-1)
            
        Returns:
            Performance score between 0 and 1
        """
        # Normalize response time (faster is better)
        # Assume 60 seconds is the maximum expected time
        time_factor = max(0, 1 - (avg_response_time / 60))
        
        # Weight the factors (correctness is most important)
        weighted_score = (
            0.6 * correct_ratio +
            0.2 * time_factor +
            0.2 * confidence_score
        )
        
        return weighted_score
    
    def _estimate_proficiency(self, 
                             user_id: str, 
                             topic: str, 
                             performance_score: float,
                             current_difficulty: int,
                             historical_performance: List[Dict[str, Any]] = None) -> float:
        """
        Estimate the user's proficiency level for a specific topic.
        
        Args:
            user_id: The user's unique identifier
            topic: The topic or subject area
            performance_score: Current performance score (0-1)
            current_difficulty: Current difficulty level (1-3)
            historical_performance: List of previous performance records
            
        Returns:
            Estimated proficiency level (0-1)
        """
        # Create current performance data
        current_performance = {
            "correct_ratio": performance_score,
            "difficulty": self.difficulty_names.get(current_difficulty, "intermediate")
        }
        
        # If we have historical data, add more metrics
        if historical_performance and len(historical_performance) > 0:
            # Calculate streak (consecutive correct answers)
            streak = 0
            for hist in reversed(historical_performance):
                if hist.get("correct_ratio", 0) > 0.7:
                    streak += 1
                else:
                    break
            
            current_performance["streak"] = streak
            
            # Add question count
            current_performance["question_count"] = sum(
                hist.get("question_count", 5) for hist in historical_performance[-3:]
            )
            
            # Add average response time if available
            if any("avg_response_time" in hist for hist in historical_performance):
                avg_times = [hist.get("avg_response_time", 30) for hist in historical_performance 
                            if "avg_response_time" in hist]
                current_performance["avg_response_time"] = sum(avg_times) / len(avg_times)
        
        # Use the proficiency predictor model
        predicted_proficiency = self.proficiency_predictor.predict_proficiency(
            user_id, topic, current_performance, historical_performance
        )
        
        # Blend with simple heuristic for robustness
        heuristic_proficiency = performance_score * (current_difficulty / 3.0)
        
        # Weighted average (70% model, 30% heuristic)
        blended_proficiency = 0.7 * predicted_proficiency + 0.3 * heuristic_proficiency
        
        logger.info(f"Estimated proficiency for user {user_id} on topic {topic}: {blended_proficiency:.4f}")
        return blended_proficiency
    
    def _determine_next_difficulty(self, proficiency: float, current_difficulty: int) -> int:
        """
        Determine the next difficulty level based on proficiency.
        
        Args:
            proficiency: Estimated proficiency level (0-3)
            current_difficulty: Current difficulty level (1-3)
            
        Returns:
            Next difficulty level (1-3)
        """
        # Thresholds for moving up or down
        move_up_threshold = current_difficulty * self.confidence_threshold
        move_down_threshold = (current_difficulty - 1) * self.confidence_threshold
        
        if proficiency >= move_up_threshold and current_difficulty < 3:
            # User is ready for more difficult questions
            return current_difficulty + 1
        elif proficiency < move_down_threshold and current_difficulty > 1:
            # User needs easier questions
            return current_difficulty - 1
        else:
            # Stay at current difficulty
            return current_difficulty
    
    def _days_since(self, timestamp) -> float:
        """Calculate days since the given timestamp."""
        if not timestamp:
            return 30  # Default to 30 days if no timestamp
            
        try:
            # If timestamp is a datetime object
            if isinstance(timestamp, datetime):
                time_delta = datetime.now() - timestamp
            # If timestamp is a string
            elif isinstance(timestamp, str):
                time_delta = datetime.now() - datetime.fromisoformat(timestamp)
            # If timestamp is a unix timestamp
            else:
                time_delta = datetime.now() - datetime.fromtimestamp(timestamp)
                
            return time_delta.total_seconds() / (24 * 3600)  # Convert to days
        except Exception as e:
            logger.error(f"Error calculating days since timestamp: {e}")
            return 30  # Default to 30 days on error
    
    def analyze_user_response(self, 
                             question: Dict[str, Any], 
                             user_answer: Any,
                             response_time: float) -> Dict[str, Any]:
        """
        Analyze a user's response to a question.
        
        Args:
            question: The question data
            user_answer: The user's answer
            response_time: Time taken to answer in seconds
            
        Returns:
            Analysis of the response
        """
        # Get correct answer from question
        correct_answer = question.get("answer")
        
        # Check if answer is correct
        is_correct = self._check_answer_correctness(question.get("type"), user_answer, correct_answer)
        
        # Calculate confidence based on response time and question difficulty
        difficulty_value = self.difficulty_levels.get(question.get("difficulty", "intermediate"), 2)
        confidence = self._calculate_confidence(is_correct, response_time, difficulty_value)
        
        return {
            "question_id": question.get("id"),
            "is_correct": is_correct,
            "response_time": response_time,
            "confidence": confidence,
            "difficulty": question.get("difficulty")
        }
    
    def _check_answer_correctness(self, question_type: str, user_answer: Any, correct_answer: Any) -> bool:
        """Check if the user's answer is correct based on question type."""
        try:
            if question_type == "multiple-choice":
                return user_answer == correct_answer
            elif question_type == "true-false":
                return user_answer == correct_answer
            elif question_type == "descriptive":
                # For descriptive questions, we'll need more sophisticated NLP comparison
                # For now, just check if key terms are present
                if isinstance(correct_answer, list) and isinstance(user_answer, str):
                    return all(term.lower() in user_answer.lower() for term in correct_answer)
                return False
            elif question_type == "fill-blank":
                if isinstance(correct_answer, list):
                    return user_answer.lower() in [ans.lower() for ans in correct_answer]
                return user_answer.lower() == correct_answer.lower()
            elif question_type == "matching":
                # Check if all matches are correct
                if isinstance(correct_answer, dict) and isinstance(user_answer, dict):
                    return all(user_answer.get(k) == v for k, v in correct_answer.items())
                return False
            elif question_type == "sequence":
                # Check if sequence is correct
                return user_answer == correct_answer
            else:
                return False
        except Exception as e:
            logger.error(f"Error checking answer correctness: {e}")
            return False
    
    def _calculate_confidence(self, is_correct: bool, response_time: float, difficulty: int) -> float:
        """
        Calculate confidence score based on correctness, response time, and difficulty.
        
        Args:
            is_correct: Whether the answer was correct
            response_time: Time taken to answer in seconds
            difficulty: Question difficulty level (1-3)
            
        Returns:
            Confidence score between 0 and 1
        """
        if not is_correct:
            # If answer is wrong, confidence is low
            base_confidence = 0.2
        else:
            # If answer is right, calculate based on response time
            # Faster responses indicate higher confidence
            expected_time = 10 * difficulty  # Expected time increases with difficulty
            time_factor = min(1.0, expected_time / max(1, response_time))
            base_confidence = 0.5 + (0.5 * time_factor)
        
        return base_confidence 