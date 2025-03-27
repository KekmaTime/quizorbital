import logging
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
import pickle
import os
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserProficiencyDataset(Dataset):
    """Dataset for user proficiency prediction."""
    
    def __init__(self, features: List[List[float]], labels: List[float]):
        """
        Initialize the dataset.
        
        Args:
            features: List of feature vectors
            labels: List of proficiency labels
        """
        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32).reshape(-1, 1)
        
    def __len__(self):
        return len(self.features)
    
    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]

class ProficiencyModel(nn.Module):
    """Neural network model for predicting user proficiency."""
    
    def __init__(self, input_size: int = 8):
        """
        Initialize the model.
        
        Args:
            input_size: Size of the input feature vector
        """
        super(ProficiencyModel, self).__init__()
        
        # Define the neural network architecture
        self.model = nn.Sequential(
            nn.Linear(input_size, 16),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 1),
            nn.Sigmoid()  # Output between 0 and 1 for proficiency
        )
    
    def forward(self, x):
        """Forward pass through the model."""
        return self.model(x)

class ProficiencyPredictor:
    """Manages proficiency prediction models for users and topics."""
    
    def __init__(self, model_dir: str = "./models"):
        """
        Initialize the predictor.
        
        Args:
            model_dir: Directory to store trained models
        """
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        # Default model parameters
        self.input_size = 8
        self.learning_rate = 0.001
        self.batch_size = 16
        self.epochs = 50
        
        # Initialize the default model
        self.default_model = ProficiencyModel(self.input_size)
        
        # Dictionary to store user-specific models
        self.user_models = {}
        
        logger.info("Proficiency predictor initialized")
    
    def _get_model_path(self, user_id: str, topic: str) -> str:
        """Get the path for a specific user-topic model."""
        return os.path.join(self.model_dir, f"{user_id}_{topic}_model.pt")
    
    def _extract_features(self, performance_data: Dict[str, Any]) -> List[float]:
        """
        Extract features from performance data.
        
        Args:
            performance_data: Dictionary containing performance metrics
            
        Returns:
            Feature vector for the model
        """
        # Extract basic performance metrics
        correct_ratio = performance_data.get("correct_ratio", 0.5)
        avg_response_time = min(60, performance_data.get("avg_response_time", 30)) / 60.0  # Normalize to 0-1
        confidence_score = performance_data.get("confidence_score", 0.5)
        
        # Extract difficulty level
        difficulty_map = {"beginner": 0.33, "intermediate": 0.67, "advanced": 1.0, "adaptive": 0.67}
        difficulty = difficulty_map.get(performance_data.get("difficulty", "intermediate"), 0.67)
        
        # Calculate time-based features
        days_since = 0
        if "timestamp" in performance_data:
            timestamp = performance_data["timestamp"]
            try:
                if isinstance(timestamp, datetime):
                    days_since = (datetime.now() - timestamp).days
                elif isinstance(timestamp, str):
                    days_since = (datetime.now() - datetime.fromisoformat(timestamp)).days
            except:
                days_since = 30  # Default if parsing fails
        
        recency_factor = np.exp(-0.05 * days_since)  # Exponential decay with time
        
        # Additional features
        question_count = min(20, performance_data.get("question_count", 5)) / 20.0  # Normalize to 0-1
        streak = min(5, performance_data.get("streak", 0)) / 5.0  # Normalize to 0-1
        
        # Combine features
        features = [
            correct_ratio,
            avg_response_time,
            confidence_score,
            difficulty,
            recency_factor,
            question_count,
            streak,
            correct_ratio * confidence_score  # Interaction term
        ]
        
        return features
    
    def train_model(self, 
                   user_id: str, 
                   topic: str, 
                   performance_history: List[Dict[str, Any]],
                   known_proficiency: Optional[List[float]] = None) -> bool:
        """
        Train a proficiency prediction model for a specific user and topic.
        
        Args:
            user_id: User identifier
            topic: Topic identifier
            performance_history: List of performance data dictionaries
            known_proficiency: Optional list of known proficiency values for supervised learning
            
        Returns:
            Success status
        """
        if len(performance_history) < 3:
            logger.warning(f"Not enough data to train model for user {user_id} on topic {topic}")
            return False
        
        try:
            # Extract features from performance history
            features = [self._extract_features(perf) for perf in performance_history]
            
            # Determine labels (proficiency values)
            if known_proficiency and len(known_proficiency) == len(performance_history):
                # Use provided proficiency values if available
                labels = known_proficiency
            else:
                # Estimate proficiency from performance data
                labels = [perf.get("correct_ratio", 0.5) * 
                         (0.5 + 0.5 * perf.get("confidence_score", 0.5)) for perf in performance_history]
            
            # Create dataset and dataloader
            dataset = UserProficiencyDataset(features, labels)
            dataloader = DataLoader(dataset, batch_size=min(self.batch_size, len(dataset)), shuffle=True)
            
            # Initialize model
            model = ProficiencyModel(self.input_size)
            optimizer = optim.Adam(model.parameters(), lr=self.learning_rate)
            criterion = nn.MSELoss()
            
            # Train the model
            model.train()
            for epoch in range(self.epochs):
                total_loss = 0
                for batch_features, batch_labels in dataloader:
                    # Forward pass
                    outputs = model(batch_features)
                    loss = criterion(outputs, batch_labels)
                    
                    # Backward pass and optimize
                    optimizer.zero_grad()
                    loss.backward()
                    optimizer.step()
                    
                    total_loss += loss.item()
                
                # Log progress every 10 epochs
                if (epoch + 1) % 10 == 0:
                    logger.info(f"Epoch {epoch+1}/{self.epochs}, Loss: {total_loss/len(dataloader):.4f}")
            
            # Save the trained model
            model_path = self._get_model_path(user_id, topic)
            torch.save(model.state_dict(), model_path)
            
            # Store in memory for quick access
            self.user_models[(user_id, topic)] = model
            
            logger.info(f"Successfully trained and saved model for user {user_id} on topic {topic}")
            return True
            
        except Exception as e:
            logger.error(f"Error training proficiency model: {str(e)}")
            return False
    
    def predict_proficiency(self, 
                           user_id: str, 
                           topic: str, 
                           current_performance: Dict[str, Any],
                           historical_performance: List[Dict[str, Any]] = None) -> float:
        """
        Predict user proficiency on a specific topic.
        
        Args:
            user_id: User identifier
            topic: Topic identifier
            current_performance: Current performance data
            historical_performance: Optional historical performance data
            
        Returns:
            Predicted proficiency score (0-1)
        """
        try:
            # Extract features from current performance
            features = self._extract_features(current_performance)
            features_tensor = torch.tensor([features], dtype=torch.float32)
            
            # Try to load user-specific model
            model = self._load_model(user_id, topic)
            
            # If no model exists, train one if we have enough data
            if model is None and historical_performance and len(historical_performance) >= 3:
                success = self.train_model(user_id, topic, historical_performance)
                if success:
                    model = self._load_model(user_id, topic)
            
            # If we still don't have a model, use the default model
            if model is None:
                model = self.default_model
            
            # Make prediction
            model.eval()
            with torch.no_grad():
                prediction = model(features_tensor)
            
            proficiency = prediction.item()
            logger.info(f"Predicted proficiency for user {user_id} on topic {topic}: {proficiency:.4f}")
            
            return proficiency
            
        except Exception as e:
            logger.error(f"Error predicting proficiency: {str(e)}")
            return 0.5  # Default to middle proficiency on error
    
    def _load_model(self, user_id: str, topic: str) -> Optional[ProficiencyModel]:
        """
        Load a trained model for a specific user and topic.
        
        Args:
            user_id: User identifier
            topic: Topic identifier
            
        Returns:
            Loaded model or None if not found
        """
        # Check if model is already loaded in memory
        if (user_id, topic) in self.user_models:
            return self.user_models[(user_id, topic)]
        
        # Try to load from disk
        model_path = self._get_model_path(user_id, topic)
        if os.path.exists(model_path):
            try:
                model = ProficiencyModel(self.input_size)
                model.load_state_dict(torch.load(model_path))
                self.user_models[(user_id, topic)] = model
                return model
            except Exception as e:
                logger.error(f"Error loading model from {model_path}: {str(e)}")
        
        return None
    
    def update_model(self, 
                    user_id: str, 
                    topic: str, 
                    new_performance: Dict[str, Any],
                    true_proficiency: Optional[float] = None) -> bool:
        """
        Update an existing model with new performance data.
        
        Args:
            user_id: User identifier
            topic: Topic identifier
            new_performance: New performance data
            true_proficiency: Optional known proficiency for this performance
            
        Returns:
            Success status
        """
        try:
            # Load historical performance data
            history_path = os.path.join(self.model_dir, f"{user_id}_{topic}_history.json")
            
            if os.path.exists(history_path):
                with open(history_path, 'r') as f:
                    history = json.load(f)
            else:
                history = []
            
            # Add new performance data
            if true_proficiency is not None:
                new_performance["true_proficiency"] = true_proficiency
            
            history.append(new_performance)
            
            # Save updated history
            with open(history_path, 'w') as f:
                json.dump(history, f)
            
            # Retrain model if we have enough data
            if len(history) >= 3:
                known_proficiency = [h.get("true_proficiency") for h in history if "true_proficiency" in h]
                if len(known_proficiency) != len(history):
                    known_proficiency = None
                
                return self.train_model(user_id, topic, history, known_proficiency)
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating proficiency model: {str(e)}")
            return False 