import logging
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
import json
import os
from datetime import datetime, timedelta
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import random
from cold_start import ColdStartSolver

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecommendationSystem:
    """
    Personalized recommendation system that suggests content based on
    user behavior, preferences, and performance.
    """
    
    def __init__(self, data_dir: str = "./recommendation_data"):
        """
        Initialize the recommendation system.
        
        Args:
            data_dir: Directory to store recommendation data
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        # Initialize cold start solver for new users
        self.cold_start = ColdStartSolver()
        
        # Initialize TF-IDF vectorizer for content-based filtering
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
        # Recommendation strategies and their weights
        self.strategies = {
            "content_based": 0.3,
            "collaborative": 0.3,
            "performance_based": 0.2,
            "recency_based": 0.1,
            "diversity": 0.1
        }
        
        logger.info("Recommendation system initialized")
    
    def get_recommendations(self, 
                           user_id: str, 
                           available_content: List[Dict[str, Any]],
                           n_recommendations: int = 5) -> List[Dict[str, Any]]:
        """
        Get personalized recommendations for a user.
        
        Args:
            user_id: User identifier
            available_content: List of available content items
            n_recommendations: Number of recommendations to return
            
        Returns:
            List of recommended content items
        """
        logger.info(f"Generating recommendations for user {user_id}")
        
        # Check if user is new (cold start)
        user_profile = self.cold_start._load_user_profile(user_id)
        if not user_profile:
            logger.info(f"User {user_id} is new, using cold start recommendations")
            return self.cold_start.recommend_content_for_new_user(
                user_id, available_content
            )[:n_recommendations]
        
        # Get user's quiz history
        quiz_history = user_profile.get("quiz_history", [])
        
        # If user has very limited history, still use cold start with some history
        if len(quiz_history) < 3:
            logger.info(f"User {user_id} has limited history, using enhanced cold start")
            return self.cold_start.recommend_content_for_new_user(
                user_id, available_content, quiz_history
            )[:n_recommendations]
        
        # Get recommendations from each strategy
        content_based_recs = self._content_based_recommendations(
            user_id, available_content, quiz_history
        )
        
        collaborative_recs = self._collaborative_recommendations(
            user_id, available_content
        )
        
        performance_recs = self._performance_based_recommendations(
            user_id, available_content, quiz_history
        )
        
        recency_recs = self._recency_based_recommendations(
            user_id, available_content, quiz_history
        )
        
        # Combine recommendations with weighted scoring
        all_recs = {}
        
        # Add content-based recommendations
        for item in content_based_recs:
            item_id = item["id"]
            if item_id not in all_recs:
                all_recs[item_id] = {"item": item, "score": 0}
            all_recs[item_id]["score"] += item["score"] * self.strategies["content_based"]
        
        # Add collaborative recommendations
        for item in collaborative_recs:
            item_id = item["id"]
            if item_id not in all_recs:
                all_recs[item_id] = {"item": item, "score": 0}
            all_recs[item_id]["score"] += item["score"] * self.strategies["collaborative"]
        
        # Add performance-based recommendations
        for item in performance_recs:
            item_id = item["id"]
            if item_id not in all_recs:
                all_recs[item_id] = {"item": item, "score": 0}
            all_recs[item_id]["score"] += item["score"] * self.strategies["performance_based"]
        
        # Add recency-based recommendations
        for item in recency_recs:
            item_id = item["id"]
            if item_id not in all_recs:
                all_recs[item_id] = {"item": item, "score": 0}
            all_recs[item_id]["score"] += item["score"] * self.strategies["recency_based"]
        
        # Sort by score
        sorted_recs = sorted(
            all_recs.values(), 
            key=lambda x: x["score"], 
            reverse=True
        )
        
        # Apply diversity boost to ensure variety
        diverse_recs = self._apply_diversity(sorted_recs, n_recommendations)
        
        # Format final recommendations
        final_recs = []
        for rec in diverse_recs[:n_recommendations]:
            item = rec["item"]
            item["recommendation_score"] = rec["score"]
            final_recs.append(item)
        
        return final_recs
    
    def _content_based_recommendations(self, 
                                      user_id: str, 
                                      available_content: List[Dict[str, Any]],
                                      quiz_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate content-based recommendations."""
        # Extract user interests from profile and quiz history
        user_profile = self.cold_start._load_user_profile(user_id)
        interests = user_profile.get("background", {}).get("interests", [])
        
        # Extract topics from quiz history
        topics = [quiz.get("topic", "") for quiz in quiz_history]
        
        # Combine interests and topics
        user_preferences = " ".join(interests + topics)
        
        # If no preferences, return random recommendations
        if not user_preferences:
            return [
                {"id": item["id"], "score": 0.5, **item}
                for item in random.sample(available_content, min(5, len(available_content)))
            ]
        
        # Prepare content descriptions
        content_descriptions = []
        for item in available_content:
            description = f"{item.get('title', '')} {item.get('description', '')} {' '.join(item.get('tags', []))}"
            content_descriptions.append(description)
        
        # Add user preferences to the descriptions
        all_texts = content_descriptions + [user_preferences]
        
        # Generate TF-IDF matrix
        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
            
            # Calculate similarity between user preferences and content
            user_vector = tfidf_matrix[-1]
            content_vectors = tfidf_matrix[:-1]
            
            # Calculate cosine similarity
            similarities = cosine_similarity(user_vector, content_vectors).flatten()
            
            # Create recommendations with scores
            recommendations = []
            for i, score in enumerate(similarities):
                item = available_content[i].copy()
                item["score"] = float(score)
                recommendations.append(item)
            
            # Sort by similarity score
            recommendations.sort(key=lambda x: x["score"], reverse=True)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in content-based recommendations: {str(e)}")
            return [
                {"id": item["id"], "score": 0.5, **item}
                for item in random.sample(available_content, min(5, len(available_content)))
            ]
    
    def _collaborative_recommendations(self, 
                                      user_id: str, 
                                      available_content: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate collaborative filtering recommendations."""
        # Get similar users
        similar_users = self.cold_start.get_similar_users(user_id)
        
        if not similar_users:
            return [
                {"id": item["id"], "score": 0.5, **item}
                for item in random.sample(available_content, min(5, len(available_content)))
            ]
        
        # Get content that similar users performed well on
        content_scores = {}
        
        for similar_user in similar_users:
            user_profile = self.cold_start._load_user_profile(similar_user)
            if not user_profile:
                continue
                
            quiz_history = user_profile.get("quiz_history", [])
            
            for quiz in quiz_history:
                content_id = quiz.get("document_id")
                if not content_id:
                    continue
                    
                score = quiz.get("score", 0)
                similarity = quiz.get("user_similarity", 0.5)
                
                if content_id not in content_scores:
                    content_scores[content_id] = []
                    
                content_scores[content_id].append(score * similarity)
        
        # Calculate average scores
        avg_scores = {}
        for content_id, scores in content_scores.items():
            avg_scores[content_id] = sum(scores) / len(scores)
        
        # Create recommendations
        recommendations = []
        for item in available_content:
            item_id = item["id"]
            if item_id in avg_scores:
                item_copy = item.copy()
                item_copy["score"] = avg_scores[item_id] / 100.0  # Normalize to 0-1
                recommendations.append(item_copy)
        
        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return recommendations
    
    def _performance_based_recommendations(self, 
                                          user_id: str, 
                                          available_content: List[Dict[str, Any]],
                                          quiz_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate recommendations based on user performance."""
        # Get user's domain difficulties
        user_profile = self.cold_start._load_user_profile(user_id)
        domain_difficulties = user_profile.get("domain_difficulties", {})
        
        # Calculate performance by topic
        topic_performance = {}
        for quiz in quiz_history:
            topic = quiz.get("topic", "general")
            score = quiz.get("score", 0)
            
            if topic not in topic_performance:
                topic_performance[topic] = []
                
            topic_performance[topic].append(score)
        
        # Calculate average performance by topic
        avg_performance = {}
        for topic, scores in topic_performance.items():
            avg_performance[topic] = sum(scores) / len(scores)
        
        # Find topics where user needs improvement
        improvement_topics = []
        for topic, avg_score in avg_performance.items():
            if avg_score < 70:  # Below 70% is considered needing improvement
                improvement_topics.append(topic)
        
        # Find topics where user excels
        excel_topics = []
        for topic, avg_score in avg_performance.items():
            if avg_score > 85:  # Above 85% is considered excelling
                excel_topics.append(topic)
        
        # Score content based on performance needs
        recommendations = []
        for item in available_content:
            item_copy = item.copy()
            topic = item.get("topic", "general")
            
            # Default score
            score = 0.5
            
            # Boost score for improvement topics
            if topic in improvement_topics:
                score = 0.8
                item_copy["reason"] = "This topic needs improvement"
            
            # Slightly boost for excel topics (for reinforcement)
            elif topic in excel_topics:
                score = 0.6
                item_copy["reason"] = "You excel in this topic"
            
            # Adjust based on difficulty
            difficulty = item.get("difficulty", "intermediate")
            domain = self.cold_start._map_topic_to_domain(topic)
            user_difficulty = domain_difficulties.get(domain, "intermediate")
            
            # Match difficulty to user's level
            if difficulty == user_difficulty:
                score += 0.1
            
            item_copy["score"] = score
            recommendations.append(item_copy)
        
        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return recommendations
    
    def _recency_based_recommendations(self, 
                                      user_id: str, 
                                      available_content: List[Dict[str, Any]],
                                      quiz_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate recommendations based on recency."""
        # Get recently accessed content
        recent_content_ids = set()
        recent_topics = []
        
        # Sort quiz history by timestamp
        sorted_history = sorted(
            quiz_history, 
            key=lambda x: datetime.fromisoformat(x.get("timestamp", "2000-01-01T00:00:00")),
            reverse=True
        )
        
        # Get content from last 7 days
        one_week_ago = datetime.now() - timedelta(days=7)
        
        for quiz in sorted_history:
            timestamp = quiz.get("timestamp", "2000-01-01T00:00:00")
            quiz_date = datetime.fromisoformat(timestamp)
            
            if quiz_date > one_week_ago:
                content_id = quiz.get("document_id")
                if content_id:
                    recent_content_ids.add(content_id)
                
                topic = quiz.get("topic")
                if topic:
                    recent_topics.append(topic)
        
        # Count topic occurrences
        topic_counts = Counter(recent_topics)
        
        # Score content based on recency and topic frequency
        recommendations = []
        for item in available_content:
            item_copy = item.copy()
            item_id = item["id"]
            topic = item.get("topic", "general")
            
            # Default score
            score = 0.5
            
            # Boost score for content with same topic as recent quizzes
            topic_frequency = topic_counts.get(topic, 0)
            if topic_frequency > 0:
                score = 0.5 + (0.1 * min(topic_frequency, 3))  # Cap at 0.8
                item_copy["reason"] = "Related to your recent activity"
            
            # Slightly reduce score for recently accessed content (for variety)
            if item_id in recent_content_ids:
                score -= 0.2
                item_copy["reason"] = "You've recently worked with this content"
            
            item_copy["score"] = max(0.1, score)  # Ensure minimum score
            recommendations.append(item_copy)
        
        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return recommendations
    
    def _apply_diversity(self, 
                        sorted_recs: List[Dict[str, Any]], 
                        n_recommendations: int) -> List[Dict[str, Any]]:
        """Apply diversity to recommendations."""
        if len(sorted_recs) <= n_recommendations:
            return sorted_recs
        
        # Take top half of recommendations
        top_half = sorted_recs[:n_recommendations // 2]
        
        # Take some from the rest with diversity in mind
        rest = sorted_recs[n_recommendations // 2:]
        
        # Track selected topics
        selected_topics = set(item["item"].get("topic", "general") for item in top_half)
        
        diverse_selections = []
        for item in rest:
            topic = item["item"].get("topic", "general")
            if topic not in selected_topics and len(diverse_selections) < (n_recommendations - len(top_half)):
                diverse_selections.append(item)
                selected_topics.add(topic)
        
        # If we still need more, take top scoring from rest
        remaining_count = n_recommendations - len(top_half) - len(diverse_selections)
        if remaining_count > 0:
            for item in rest:
                if item not in diverse_selections and len(diverse_selections) < (n_recommendations - len(top_half)):
                    diverse_selections.append(item)
        
        # Combine and return
        return top_half + diverse_selections 