import * as tf from '@tensorflow/tfjs';
import { UserAnswer } from './types';

/**
 * ProficiencyModel - Neural network model to predict user proficiency
 * 
 * Implements a feed-forward neural network with:
 * - Input layer (8 features)
 * - 2 hidden layers with dropout for regularization
 * - Output layer with sigmoid activation (0-1 value)
 */
export class ProficiencyModel {
  // Model instance
  private model: tf.Sequential | null = null;
  
  // Track if model is already trained
  private isTrained: boolean = false;

  // Save any user-specific training data
  private trainingData: {
    inputs: number[][];
    outputs: number[];
  } = {
    inputs: [],
    outputs: []
  };

  constructor() {
    this.buildModel();
  }

  /**
   * Builds the neural network architecture
   */
  private buildModel(): void {
    const inputSize = 8; // 8-dimensional feature vector
    
    try {
      // Define model architecture
      this.model = tf.sequential();
      
      // Input layer and first hidden layer
      this.model.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
        inputShape: [inputSize]
      }));
      
      // Dropout for regularization
      this.model.add(tf.layers.dropout({ rate: 0.2 }));
      
      // Second hidden layer
      this.model.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      // Output layer
      this.model.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      // Compile model
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError'
      });
    } catch (error) {
      console.error('Error building proficiency model:', error);
      this.model = null;
    }
  }

  /**
   * Extract features from user's quiz performance
   * Creates an 8-dimensional feature vector
   */
  public extractFeatures(
    userAnswers: UserAnswer[],
    confidenceScores: number[] = [],
    lastInteractionTime: number = Date.now()
  ): number[] {
    // Return empty array if no answers
    if (!userAnswers.length) return Array(8).fill(0);
    
    // 1. Calculate correct ratio
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const correctRatio = correctCount / userAnswers.length;
    
    // 2. Calculate average response time
    const avgResponseTime = userAnswers.reduce(
      (sum, answer) => sum + answer.timeSpent, 0
    ) / userAnswers.length;
    
    // Normalize response time (between 0-1)
    // Assuming 60 seconds as the maximum expected time
    const normalizedResponseTime = Math.min(avgResponseTime / 60000, 1);
    
    // 3. Calculate confidence score (average if available)
    const confidenceScore = confidenceScores.length
      ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
      : 0.5; // Default to middle value if not available
    
    // 4. Calculate question difficulty (based on the metadata if available)
    const difficultyMap: Record<string, number> = {
      'beginner': 0.2,
      'easy': 0.4,
      'medium': 0.6,
      'hard': 0.8,
      'expert': 1.0
    };
    
    const avgDifficulty = userAnswers.reduce((sum, answer) => {
      // Get difficulty from the question if available
      const question = answer.difficulty || 'medium';
      return sum + (difficultyMap[question.toLowerCase()] || 0.6);
    }, 0) / userAnswers.length;
    
    // 5. Calculate recency factor (exponential decay)
    const timeSinceLastInteractionMs = Date.now() - lastInteractionTime;
    const daysSinceLastInteraction = timeSinceLastInteractionMs / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.exp(-0.1 * daysSinceLastInteraction);
    
    // 6. Count of questions (normalized to 0-1, assuming 50 as max)
    const questionCount = Math.min(userAnswers.length / 50, 1);
    
    // 7. Streak of consecutive correct answers
    let currentStreak = 0;
    let maxStreak = 0;
    
    for (const answer of userAnswers) {
      if (answer.isCorrect) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    // Normalize streak (assuming max streak of 10)
    const normalizedStreak = Math.min(maxStreak / 10, 1);
    
    // 8. Interaction term (correctRatio * confidenceScore)
    const interaction = correctRatio * confidenceScore;
    
    return [
      correctRatio,
      normalizedResponseTime,
      confidenceScore,
      avgDifficulty,
      recencyFactor,
      questionCount,
      normalizedStreak,
      interaction
    ];
  }

  /**
   * Train the model with given feature vectors and known proficiency values
   */
  public async train(
    featureVectors: number[][],
    proficiencyValues: number[],
    epochs: number = 50,
    batchSize: number = 16
  ): Promise<tf.History> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    
    if (featureVectors.length !== proficiencyValues.length) {
      throw new Error('Feature vectors and proficiency values must have the same length');
    }
    
    // Convert inputs and outputs to tensors
    const inputs = tf.tensor2d(featureVectors);
    const outputs = tf.tensor2d(proficiencyValues, [proficiencyValues.length, 1]);
    
    try {
      // Train the model
      const result = await this.model.fit(inputs, outputs, {
        epochs,
        batchSize: Math.min(batchSize, featureVectors.length),
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss}`);
          }
        }
      });
      
      // Store training data for potential retraining
      this.trainingData.inputs.push(...featureVectors);
      this.trainingData.outputs.push(...proficiencyValues);
      
      this.isTrained = true;
      
      // Free tensor memory
      inputs.dispose();
      outputs.dispose();
      
      return result;
    } catch (error) {
      console.error('Error training proficiency model:', error);
      
      // Free tensor memory
      inputs.dispose();
      outputs.dispose();
      
      throw error;
    }
  }

  /**
   * Predict proficiency level based on features 
   */
  public predict(features: number[]): number {
    if (!this.model) {
      console.error('Model not initialized');
      return 0.5; // Return middle value as default
    }
    
    try {
      // Convert input to tensor
      const input = tf.tensor2d([features]);
      
      // Get prediction
      const prediction = this.model.predict(input);
      
      // Extract predicted value (between 0-1)
      const predictionValue = Array.isArray(prediction) 
        ? prediction[0].dataSync()[0] 
        : prediction.dataSync()[0];
      
      // Free tensor memory
      input.dispose();
      if (Array.isArray(prediction)) {
        prediction.forEach(p => p.dispose());
      } else {
        prediction.dispose();
      }
      
      return predictionValue;
    } catch (error) {
      console.error('Error predicting proficiency:', error);
      return 0.5; // Return middle value as default
    }
  }

  /**
   * Save model to browser's IndexedDB
   */
  public async saveModel(modelId: string = 'proficiency-model'): Promise<tf.io.SaveResult> {
    if (!this.model) {
      throw new Error('Model not initialized');
    }
    
    return await this.model.save(`indexeddb://${modelId}`);
  }

  /**
   * Load model from browser's IndexedDB
   */
  public async loadModel(modelId: string = 'proficiency-model'): Promise<boolean> {
    try {
      // Need to reload the model and convert it to a Sequential model
      const loadedModel = await tf.loadLayersModel(`indexeddb://${modelId}`);
      
      // Create a new sequential model and transfer weights
      const newModel = tf.sequential();
      
      // Assume the same structure as our original model
      newModel.add(tf.layers.dense({
        units: 16,
        activation: 'relu',
        inputShape: [8]
      }));
      
      newModel.add(tf.layers.dropout({ rate: 0.2 }));
      
      newModel.add(tf.layers.dense({
        units: 8,
        activation: 'relu'
      }));
      
      newModel.add(tf.layers.dense({
        units: 1,
        activation: 'sigmoid'
      }));
      
      // Copy weights from the loaded model
      for (let i = 0; i < loadedModel.layers.length; i++) {
        const weights = loadedModel.layers[i].getWeights();
        newModel.layers[i].setWeights(weights);
      }
      
      // Compile the model
      newModel.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError'
      });
      
      this.model = newModel;
      this.isTrained = true;
      return true;
    } catch (error) {
      // Expected error on first run when no model exists yet
      if (error.message && error.message.includes('Cannot find model')) {
        console.log('No saved model found. Using new model.');
      } else {
        console.error('Error loading proficiency model:', error);
      }
      
      // If loading fails, ensure new model is built
      this.buildModel();
      return false;
    }
  }
} 