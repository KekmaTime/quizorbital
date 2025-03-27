import logging
import numpy as np
from typing import Dict, Any, List, Tuple, Optional
import json
import os
from datetime import datetime
import random
from sklearn.cluster import KMeans
from collections import Counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ColdStartSolver:
    """
    Solves the cold-start problem for new users by providing initial
    recommendations and difficulty settings based on user profiles.
    """
    
    def __init__(self, data_dir: str = "./user_data"):
        """
        Initialize the cold start solver.
        
        Args:
            data_dir: Directory to store user profile data
        """
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)
        
        # Knowledge domains and their relationships
        self.knowledge_domains = {
            "mathematics": ["algebra", "calculus", "statistics", "geometry"],
            "science": ["physics", "chemistry", "biology", "astronomy"],
            "humanities": ["history", "literature", "philosophy", "arts"],
            "languages": ["english", "spanish", "french", "german"],
            "technology": ["programming", "data_science", "web_development", "cybersecurity"]
        }
        
        # Difficulty mapping for domains
        self.domain_difficulty = {
            "beginner": ["basic_math", "general_science", "world_history", "english_basics", "computer_basics"],
            "intermediate": ["algebra", "biology", "modern_history", "grammar", "programming"],
            "advanced": ["calculus", "physics", "philosophy", "literature", "data_science"]
        }
        
        # Load existing user profiles for collaborative filtering
        self.user_profiles = self._load_user_profiles()
        
        logger.info("Cold start solver initialized")
    
    def create_initial_profile(self, 
                              user_id: str, 
                              background_info: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create an initial user profile based on background information.
        
        Args:
            user_id: User identifier
            background_info: Dictionary with user background information
            
        Returns:
            Initial user profile
        """
        logger.info(f"Creating initial profile for user {user_id}")
        
        # Extract relevant information
        education_level = background_info.get("education_level", "high_school")
        interests = background_info.get("interests", [])
        prior_knowledge = background_info.get("prior_knowledge", {})
        learning_goals = background_info.get("learning_goals", [])
        
        # Map education level to base difficulty
        base_difficulty = self._map_education_to_difficulty(education_level)
        
        # Identify relevant knowledge domains
        relevant_domains = self._identify_relevant_domains(interests, prior_knowledge, learning_goals)
        
        # Create domain-specific difficulty settings
        domain_difficulties = self._create_domain_difficulties(relevant_domains, prior_knowledge, base_difficulty)
        
        # Generate initial recommendations
        recommendations = self._generate_initial_recommendations(relevant_domains, domain_difficulties)
        
        # Create the profile
        profile = {
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "background": background_info,
            "base_difficulty": base_difficulty,
            "relevant_domains": relevant_domains,
            "domain_difficulties": domain_difficulties,
            "recommendations": recommendations,
            "profile_confidence": 0.6,  # Initial confidence is moderate
            "quiz_history": []
        }
        
        # Save the profile
        self._save_user_profile(user_id, profile)
        
        return profile
    
    def update_profile_with_quiz(self, 
                               user_id: str, 
                               quiz_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user profile based on quiz results.
        
        Args:
            user_id: User identifier
            quiz_result: Dictionary with quiz results
            
        Returns:
            Updated user profile
        """
        logger.info(f"Updating profile for user {user_id} with quiz results")
        
        # Load current profile
        profile = self._load_user_profile(user_id)
        if not profile:
            logger.warning(f"No profile found for user {user_id}")
            return None
        
        # Extract quiz information
        topic = quiz_result.get("topic", "general")
        score = quiz_result.get("score", 0)
        difficulty = quiz_result.get("difficulty", "intermediate")
        
        # Add to quiz history
        profile["quiz_history"].append({
            "quiz_id": quiz_result.get("quiz_id"),
            "topic": topic,
            "score": score,
            "difficulty": difficulty,
            "timestamp": datetime.now().isoformat()
        })
        
        # Update domain difficulties based on quiz results
        domain = self._map_topic_to_domain(topic)
        if domain in profile["domain_difficulties"]:
            current_difficulty = profile["domain_difficulties"][domain]
            
            # Adjust difficulty based on score
            if score > 80 and difficulty == current_difficulty:
                # User did well, increase difficulty
                profile["domain_difficulties"][domain] = self._increase_difficulty(current_difficulty)
            elif score < 40 and difficulty == current_difficulty:
                # User struggled, decrease difficulty
                profile["domain_difficulties"][domain] = self._decrease_difficulty(current_difficulty)
        
        # Update profile confidence
        profile["profile_confidence"] = min(0.95, profile["profile_confidence"] + 0.05)
        
        # Update recommendations
        profile["recommendations"] = self._generate_recommendations(profile)
        
        # Save updated profile
        self._save_user_profile(user_id, profile)
        
        return profile
    
    def get_similar_users(self, user_id: str, n: int = 5) -> List[str]:
        """
        Find similar users for collaborative filtering.
        
        Args:
            user_id: User identifier
            n: Number of similar users to return
            
        Returns:
            List of similar user IDs
        """
        profile = self._load_user_profile(user_id)
        if not profile or len(self.user_profiles) < 5:
            # Not enough data for meaningful comparison
            return []
        
        # Create feature vectors for users
        user_features = {}
        for uid, uprof in self.user_profiles.items():
            if uid == user_id:
                continue
                
            # Create a feature vector based on domain difficulties and interests
            features = []
            
            # Convert domain difficulties to numerical values
            for domain in sorted(self.knowledge_domains.keys()):
                diff = uprof.get("domain_difficulties", {}).get(domain, "intermediate")
                features.append(self._difficulty_to_number(diff))
            
            # Add interest indicators (1 if interested, 0 if not)
            interests = uprof.get("background", {}).get("interests", [])
            for domain in sorted(self.knowledge_domains.keys()):
                features.append(1 if domain in interests else 0)
            
            user_features[uid] = features
        
        # Create feature vector for target user
        target_features = []
        for domain in sorted(self.knowledge_domains.keys()):
            diff = profile.get("domain_difficulties", {}).get(domain, "intermediate")
            target_features.append(self._difficulty_to_number(diff))
            
        interests = profile.get("background", {}).get("interests", [])
        for domain in sorted(self.knowledge_domains.keys()):
            target_features.append(1 if domain in interests else 0)
        
        # Calculate similarity with other users
        similarities = {}
        for uid, features in user_features.items():
            similarity = self._calculate_cosine_similarity(target_features, features)
            similarities[uid] = similarity
        
        # Get top N similar users
        similar_users = sorted(similarities.items(), key=lambda x: x[1], reverse=True)[:n]
        return [uid for uid, _ in similar_users]
    
    def recommend_content_for_new_user(self, 
                                      user_id: str, 
                                      available_documents: List[Dict[str, Any]],
                                      n_recommendations: int = 5) -> List[Dict[str, Any]]:
        """
        Recommend content for a new user.
        
        Args:
            user_id: User identifier
            available_documents: List of available documents
            n_recommendations: Number of recommendations to return
            
        Returns:
            List of recommended documents
        """
        profile = self._load_user_profile(user_id)
        if not profile:
            logger.warning(f"No profile found for user {user_id}")
            return []
        
        # Get user's relevant domains and difficulties
        relevant_domains = profile.get("relevant_domains", [])
        domain_difficulties = profile.get("domain_difficulties", {})
        
        # Filter documents by relevance to user's domains
        relevant_docs = []
        for doc in available_documents:
            doc_topics = doc.get("tags", [])
            doc_domain = self._map_topic_to_domain(doc.get("topic", "general"))
            
            # Check if document is relevant to user's domains
            if doc_domain in relevant_domains:
                # Calculate relevance score
                relevance = 1.0
                
                # Adjust based on difficulty match
                doc_difficulty = doc.get("difficulty", "intermediate")
                domain_difficulty = domain_difficulties.get(doc_domain, "intermediate")
                
                if doc_difficulty == domain_difficulty:
                    relevance *= 1.2  # Boost exact difficulty matches
                elif self._difficulty_to_number(doc_difficulty) > self._difficulty_to_number(domain_difficulty):
                    relevance *= 0.8  # Penalize if too difficult
                
                relevant_docs.append((doc, relevance))
        
        # If we have few relevant documents, include some from other domains
        if len(relevant_docs) < n_recommendations:
            for doc in available_documents:
                if doc not in [d[0] for d in relevant_docs]:
                    doc_domain = self._map_topic_to_domain(doc.get("topic", "general"))
                    relevance = 0.5  # Lower base relevance for non-matching domains
                    relevant_docs.append((doc, relevance))
        
        # Sort by relevance and return top N
        relevant_docs.sort(key=lambda x: x[1], reverse=True)
        return [doc for doc, _ in relevant_docs[:n_recommendations]]
    
    def _map_education_to_difficulty(self, education_level: str) -> str:
        """Map education level to base difficulty."""
        education_map = {
            "elementary": "beginner",
            "middle_school": "beginner",
            "high_school": "intermediate",
            "undergraduate": "intermediate",
            "graduate": "advanced",
            "phd": "advanced"
        }
        return education_map.get(education_level, "intermediate")
    
    def _identify_relevant_domains(self, 
                                  interests: List[str], 
                                  prior_knowledge: Dict[str, str],
                                  learning_goals: List[str]) -> List[str]:
        """Identify relevant knowledge domains based on user information."""
        domains = set()
        
        # Add domains from interests
        for interest in interests:
            domain = self._map_topic_to_domain(interest)
            if domain:
                domains.add(domain)
        
        # Add domains from prior knowledge
        for topic in prior_knowledge.keys():
            domain = self._map_topic_to_domain(topic)
            if domain:
                domains.add(domain)
        
        # Add domains from learning goals
        for goal in learning_goals:
            domain = self._map_topic_to_domain(goal)
            if domain:
                domains.add(domain)
        
        # If no domains identified, add general domains
        if not domains:
            domains = {"mathematics", "science"}
        
        return list(domains)
    
    def _map_topic_to_domain(self, topic: str) -> str:
        """Map a topic to its knowledge domain."""
        topic = topic.lower()
        
        for domain, topics in self.knowledge_domains.items():
            if topic == domain or topic in topics:
                return domain
        
        # Check for partial matches
        for domain, topics in self.knowledge_domains.items():
            if any(t in topic for t in topics + [domain]):
                return domain
        
        return "general"
    
    def _create_domain_difficulties(self, 
                                   domains: List[str], 
                                   prior_knowledge: Dict[str, str],
                                   base_difficulty: str) -> Dict[str, str]:
        """Create difficulty settings for each domain."""
        difficulties = {}
        
        for domain in domains:
            # Start with base difficulty
            difficulty = base_difficulty
            
            # Adjust based on prior knowledge
            domain_topics = self.knowledge_domains.get(domain, [])
            for topic, level in prior_knowledge.items():
                if topic == domain or topic in domain_topics:
                    # Override with user's self-reported level
                    difficulty = level
                    break
            
            difficulties[domain] = difficulty
        
        return difficulties
    
    def _generate_initial_recommendations(self, 
                                         domains: List[str],
                                         domain_difficulties: Dict[str, str]) -> List[Dict[str, Any]]:
        """Generate initial content recommendations."""
        recommendations = []
        
        for domain in domains:
            difficulty = domain_difficulties.get(domain, "intermediate")
            
            # Add domain-specific recommendations
            recommendations.append({
                "type": "topic",
                "name": domain,
                "difficulty": difficulty,
                "reason": f"Based on your interests and background in {domain}"
            })
            
            # Add specific topics within the domain
            domain_topics = self.knowledge_domains.get(domain, [])
            if domain_topics:
                # Select 1-2 topics from this domain
                selected_topics = random.sample(domain_topics, min(2, len(domain_topics)))
                for topic in selected_topics:
                    recommendations.append({
                        "type": "subtopic",
                        "name": topic,
                        "parent_domain": domain,
                        "difficulty": difficulty,
                        "reason": f"Specific topic in {domain} that matches your profile"
                    })
        
        return recommendations
    
    def _generate_recommendations(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate updated recommendations based on user profile."""
        # Start with some recommendations based on domains
        recommendations = self._generate_initial_recommendations(
            profile.get("relevant_domains", []),
            profile.get("domain_difficulties", {})
        )
        
        # Add recommendations based on quiz history
        quiz_history = profile.get("quiz_history", [])
        if quiz_history:
            # Find topics where user performed well
            good_topics = []
            for quiz in quiz_history:
                if quiz.get("score", 0) > 70:
                    good_topics.append(quiz.get("topic"))
            
            # Count occurrences
            topic_counter = Counter(good_topics)
            
            # Add recommendations for top topics
            for topic, count in topic_counter.most_common(2):
                if count > 1:  # Only recommend if user did well multiple times
                    domain = self._map_topic_to_domain(topic)
                    difficulty = profile.get("domain_difficulties", {}).get(domain, "intermediate")
                    
                    # Increase difficulty for topics user is good at
                    advanced_difficulty = self._increase_difficulty(difficulty)
                    
                    recommendations.append({
                        "type": "mastery",
                        "name": topic,
                        "difficulty": advanced_difficulty,
                        "reason": f"You've shown proficiency in {topic}"
                    })
        
        # Add collaborative filtering recommendations
        similar_users = self.get_similar_users(profile["user_id"])
        if similar_users:
            # Find topics that similar users performed well on
            similar_user_topics = []
            for user_id in similar_users:
                similar_profile = self._load_user_profile(user_id)
                if similar_profile:
                    for quiz in similar_profile.get("quiz_history", []):
                        if quiz.get("score", 0) > 70:
                            similar_user_topics.append(quiz.get("topic"))
            
            # Count occurrences
            topic_counter = Counter(similar_user_topics)
            
            # Add recommendations for top topics from similar users
            for topic, count in topic_counter.most_common(2):
                if count > 1 and not any(r.get("name") == topic for r in recommendations):
                    domain = self._map_topic_to_domain(topic)
                    difficulty = profile.get("domain_difficulties", {}).get(domain, "intermediate")
                    
                    recommendations.append({
                        "type": "collaborative",
                        "name": topic,
                        "difficulty": difficulty,
                        "reason": f"Similar users performed well in {topic}"
                    })
        
        return recommendations[:10]  # Limit to 10 recommendations
    
    def _increase_difficulty(self, difficulty: str) -> str:
        """Increase difficulty level."""
        if difficulty == "beginner":
            return "intermediate"
        elif difficulty == "intermediate":
            return "advanced"
        return "advanced"
    
    def _decrease_difficulty(self, difficulty: str) -> str:
        """Decrease difficulty level."""
        if difficulty == "advanced":
            return "intermediate"
        elif difficulty == "intermediate":
            return "beginner"
        return "beginner"
    
    def _difficulty_to_number(self, difficulty: str) -> int:
        """Convert difficulty string to number."""
        mapping = {"beginner": 1, "intermediate": 2, "advanced": 3}
        return mapping.get(difficulty, 2)
    
    def _calculate_cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = sum(a * a for a in vec1) ** 0.5
        norm2 = sum(b * b for b in vec2) ** 0.5
        
        if norm1 == 0 or norm2 == 0:
            return 0
            
        return dot_product / (norm1 * norm2)
    
    def _load_user_profiles(self) -> Dict[str, Dict[str, Any]]:
        """Load all user profiles."""
        profiles = {}
        
        if not os.path.exists(self.data_dir):
            return profiles
            
        for filename in os.listdir(self.data_dir):
            if filename.endswith(".json"):
                user_id = filename.split(".")[0]
                profile_path = os.path.join(self.data_dir, filename)
                
                try:
                    with open(profile_path, 'r') as f:
                        profiles[user_id] = json.load(f)
                except Exception as e:
                    logger.error(f"Error loading profile for user {user_id}: {str(e)}")
        
        return profiles
    
    def _load_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Load a specific user profile."""
        profile_path = os.path.join(self.data_dir, f"{user_id}.json")
        
        if not os.path.exists(profile_path):
            return None
            
        try:
            with open(profile_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading profile for user {user_id}: {str(e)}")
            return None
    
    def _save_user_profile(self, user_id: str, profile: Dict[str, Any]) -> bool:
        """Save a user profile."""
        profile_path = os.path.join(self.data_dir, f"{user_id}.json")
        
        try:
            with open(profile_path, 'w') as f:
                json.dump(profile, f, indent=2)
            
            # Update in-memory profiles
            self.user_profiles[user_id] = profile
            
            return True
        except Exception as e:
            logger.error(f"Error saving profile for user {user_id}: {str(e)}")
            return False 