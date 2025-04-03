# Proficiency Prediction Model

## Overview

The proficiency prediction model in QUIZORBIS is a neural network implemented in TypeScript using TensorFlow.js. It predicts a user's proficiency level based on their quiz performance patterns.

## Model Architecture

The model is a feed-forward neural network (multilayer perceptron) with the following structure:

- **Input Layer**: 8 neurons (for the feature vector)
- **First Hidden Layer**: 16 neurons with ReLU activation
- **Dropout Layer**: 20% dropout rate for regularization
- **Second Hidden Layer**: 8 neurons with ReLU activation
- **Output Layer**: 1 neuron with Sigmoid activation (outputs a value between 0-1)

## Features Used (8-dimensional vector)

1. **correct_ratio**: Ratio of correct answers
2. **avg_response_time**: Normalized response time
3. **confidence_score**: User's confidence level
4. **difficulty**: Numerical representation of question difficulty
5. **recency_factor**: Exponential decay based on time since last interaction
6. **question_count**: Normalized count of questions attempted
7. **streak**: Normalized count of consecutive correct answers
8. **Interaction term**: correct_ratio * confidence_score

## Training Parameters

- **Optimizer**: Adam with learning rate of 0.001
- **Loss Function**: Mean Squared Error (MSE)
- **Batch Size**: 16 (or smaller if dataset is smaller)
- **Epochs**: 50

## Implementation Files

- `src/lib/proficiencyModel.ts`: Core model implementation
- `src/hooks/useProficiencyModel.ts`: React hook for using the model
- `src/components/QuizResults.tsx`: Integration with UI

## Usage

The model is used in the QuizResults component to provide a proficiency score after each quiz. The score is displayed as a percentage and also interpreted into a descriptive level (Beginner, Basic, Intermediate, Advanced, Expert).

## Persistence

The model is saved to the browser's IndexedDB after training, allowing for persistence between sessions. Training data is also stored in localStorage to enable retraining with more data over time.

## Future Improvements

Potential improvements to the model:

1. Add more features such as topic-specific performance
2. Allow users to provide explicit confidence ratings for each answer
3. Implement a more sophisticated model architecture (e.g., LSTM for temporal patterns)
4. Add visualization of proficiency trends over time
5. Use proficiency predictions to adapt question difficulty in real-time 