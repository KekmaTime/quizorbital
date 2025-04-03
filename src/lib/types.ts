// Question Types
export type QuestionType = 
  | "multiple-choice" 
  | "true-false" 
  | "descriptive" 
  | "multiple-select";

export interface QuestionOption {
  id: string;
  text: string;
}

// Quiz Phases
export enum QuizPhase {
  Setup = "setup",
  PreAssessment = "pre-assessment",
  Quiz = "quiz",
  Results = "results"
}

// Difficulty Levels
export enum DifficultyLevel {
  Beginner = "beginner",
  Easy = "easy", 
  Medium = "medium",
  Hard = "hard",
  Expert = "expert"
}

// Quiz Settings
export interface QuizSettings {
  numQuestions: number;
  difficulty: DifficultyLevel;
  timeLimit: number;
  questionTypeDistribution?: QuestionTypeDistribution[];
}

// Pre-Assessment Results
export interface PreAssessmentResults {
  score: number;
  recommendedDifficulty: DifficultyLevel;
  strengths: string[];
  weaknesses: string[];
}

// Question Interface
export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  difficulty: string;
  explanation?: string;
}

// User Answer Interface
export interface UserAnswer {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
  question?: string;
  correctAnswer?: string | string[];
  questionType?: QuestionType;
  difficulty?: string;
}

// Quiz State
export interface QuizState {
  phase: QuizPhase;
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: UserAnswer[];
  studyMaterial: File | string | null;
  isLoading: boolean;
  settings: QuizSettings;
  preAssessmentResults: PreAssessmentResults | null;
  vectorStoreId: string | null;
  quizResult: QuizResult | null;
  totalQuizTime: number; // Total time in seconds the user spent on the quiz
}

// Pre-assessment Types
export type PreAssessmentQuestionType = 'mcq' | 'slider';

export interface PreAssessmentQuestion {
  id: string;
  question: string;
  type: PreAssessmentQuestionType;
  options?: QuestionOption[]; 
  min?: number; // For slider questions
  max?: number; // For slider questions
  step?: number; // For slider questions
  defaultValue?: number; // For slider questions
}

export interface PreAssessmentAnswer {
  questionId: string;
  answer: string | number;
}

// Performance Analysis Types
export interface PerformanceMetrics {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: string;
  averageResponseTime: string;
}

export interface PerformanceAnalysis {
  strengths: string[];
  weaknesses: string[];
  recommendedTopics: string[];
  improvementSuggestions: string;
}

export interface QuizResult {
  metrics: PerformanceMetrics;
  analysis: PerformanceAnalysis;
  proficiency?: number;
}

// Quiz Preferences Types
export interface QuestionTypeDistribution {
  type: QuestionType;
  percentage: number;
}

export interface QuizPreferencesType {
  difficulty: string;
  questionCount: number;
  timeLimit: number; // in minutes
  questionTypeDistribution: QuestionTypeDistribution[];
}

// Proficiency Types
export interface ProficiencyData {
  features: number[];
  score: number; 
  timestamp: number;
} 