import { useState, useEffect, useCallback } from 'react';
import { ProficiencyModel } from '@/lib/proficiencyModel';
import { UserAnswer, ProficiencyData } from '@/lib/types';

const MODEL_STORAGE_KEY = 'quizorbital-proficiency-data';

/**
 * Custom hook to use the proficiency prediction model
 */
export const useProficiencyModel = () => {
  const [model, setModel] = useState<ProficiencyModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [proficiencyData, setProficiencyData] = useState<ProficiencyData[]>([]);

  // Initialize the model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsLoading(true);
        
        // Create new model instance
        const proficiencyModel = new ProficiencyModel();
        
        // Try to load from storage
        const modelLoaded = await proficiencyModel.loadModel();
        console.log(`Proficiency model ${modelLoaded ? 'loaded from storage' : 'initialized new'}`);
        
        // Load saved proficiency data
        const savedData = localStorage.getItem(MODEL_STORAGE_KEY);
        const parsedData: ProficiencyData[] = savedData ? JSON.parse(savedData) : [];
        setProficiencyData(parsedData);
        
        setModel(proficiencyModel);
      } catch (error) {
        console.error('Error initializing proficiency model:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeModel();
  }, []);

  /**
   * Predict proficiency based on user's quiz answers
   */
  const predictProficiency = useCallback(
    async (
      userAnswers: UserAnswer[],
      confidenceScores: number[] = [],
      saveResult: boolean = true
    ): Promise<number> => {
      if (!model || !userAnswers.length) {
        return 0.5; // Return middle value as default
      }
      
      try {
        // Extract features from user answers
        const features = model.extractFeatures(userAnswers, confidenceScores);
        
        // Get prediction
        const proficiency = model.predict(features);
        
        // Save data if requested
        if (saveResult) {
          const newData: ProficiencyData = {
            features,
            score: proficiency,
            timestamp: Date.now()
          };
          
          const updatedData = [...proficiencyData, newData];
          setProficiencyData(updatedData);
          
          // Save to localStorage
          localStorage.setItem(MODEL_STORAGE_KEY, JSON.stringify(updatedData));
        }
        
        return proficiency;
      } catch (error) {
        console.error('Error predicting proficiency:', error);
        return 0.5; // Return middle value as default
      }
    },
    [model, proficiencyData]
  );

  /**
   * Train model with example data or past performance
   */
  const trainModel = useCallback(
    async (
      trainingData?: { features: number[][]; scores: number[] }
    ): Promise<boolean> => {
      if (!model) return false;
      
      try {
        setIsLoading(true);
        
        let features: number[][] = [];
        let scores: number[] = [];
        
        if (trainingData) {
          // Use provided training data
          features = trainingData.features;
          scores = trainingData.scores;
        } else if (proficiencyData.length > 0) {
          // Use stored proficiency data for training
          features = proficiencyData.map(data => data.features);
          scores = proficiencyData.map(data => data.score);
        } else {
          // Not enough data to train
          console.warn('No training data available');
          setIsLoading(false);
          return false;
        }
        
        // Only train if we have enough data
        if (features.length < 3) {
          console.warn('Not enough training data (minimum 3 samples required)');
          setIsLoading(false);
          return false;
        }
        
        // Train the model
        await model.train(features, scores);
        
        // Save the trained model
        await model.saveModel();
        
        return true;
      } catch (error) {
        console.error('Error training proficiency model:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [model, proficiencyData]
  );

  /**
   * Clear all saved proficiency data
   */
  const clearProficiencyData = useCallback(() => {
    localStorage.removeItem(MODEL_STORAGE_KEY);
    setProficiencyData([]);
  }, []);

  return {
    predictProficiency,
    trainModel,
    clearProficiencyData,
    proficiencyData,
    isLoading
  };
}; 