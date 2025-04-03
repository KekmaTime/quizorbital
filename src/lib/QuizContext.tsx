import React, { createContext, useCallback, useContext, useReducer, useMemo, ReactNode, useRef, useEffect } from "react";
import { Question, UserAnswer, QuizState, QuizSettings, QuizPhase, DifficultyLevel, PreAssessmentResults, QuizResult } from "./types";
import { toast } from "@/components/ui/use-toast";
import { callOpenAI } from "./openai";
import { extractTextFromPDF } from "./pdfExtractor";

// Initial quiz state
const initialState: QuizState = {
  phase: QuizPhase.Setup,
  questions: [],
  currentQuestionIndex: 0,
  userAnswers: [],
  studyMaterial: null,
  isLoading: false,
  settings: {
    numQuestions: 5,
    difficulty: DifficultyLevel.Medium,
    timeLimit: 0,
  },
  preAssessmentResults: null,
  vectorStoreId: null,
  quizResult: null,
  totalQuizTime: 0,
};

// Action types
type Action =
  | { type: "SET_PHASE"; payload: QuizPhase }
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "NEXT_QUESTION" }
  | { type: "PREV_QUESTION" }
  | { type: "SUBMIT_ANSWER"; payload: UserAnswer }
  | { type: "SET_STUDY_MATERIAL"; payload: File | string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SETTINGS"; payload: Partial<QuizSettings> }
  | { type: "SET_PREASSESSMENT_RESULTS"; payload: PreAssessmentResults }
  | { type: "RESET_QUIZ" }
  | { type: "SET_VECTOR_STORE_ID"; payload: string | null }
  | { type: "SET_QUIZ_RESULT"; payload: QuizResult }
  | { type: "SET_TOTAL_QUIZ_TIME"; payload: number };

// Quiz context type
export interface QuizContextType {
  state: QuizState;
  startQuiz: () => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  submitAnswer: (answer: string | string[], timeSpent: number) => void;
  setStudyMaterial: (material: File | string) => void;
  setSettings: (settings: Partial<QuizSettings>) => void;
  setPhase: (phase: QuizPhase) => void;
  setPreAssessmentResults: (results: PreAssessmentResults) => void;
  resetQuiz: () => void;
  setVectorStoreId: (id: string | null) => void;
  setQuizResult: (result: QuizResult) => void;
  setTotalQuizTime: (timeInSeconds: number) => void;
}

// Reducer function
function quizReducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case "SET_PHASE":
      return { ...state, phase: action.payload };
    case "SET_QUESTIONS":
      return { ...state, questions: action.payload, userAnswers: [] };
    case "NEXT_QUESTION":
      return {
        ...state,
        currentQuestionIndex: Math.min(
          state.currentQuestionIndex + 1,
          state.questions.length - 1
        ),
      };
    case "PREV_QUESTION":
      return {
        ...state,
        currentQuestionIndex: Math.max(state.currentQuestionIndex - 1, 0),
      };
    case "SUBMIT_ANSWER":
      return {
        ...state,
        userAnswers: [...state.userAnswers, action.payload],
      };
    case "SET_STUDY_MATERIAL":
      return { ...state, studyMaterial: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case "SET_PREASSESSMENT_RESULTS":
      return { ...state, preAssessmentResults: action.payload };
    case "SET_VECTOR_STORE_ID":
      return { ...state, vectorStoreId: action.payload };
    case "SET_QUIZ_RESULT":
      return { ...state, quizResult: action.payload };
    case "SET_TOTAL_QUIZ_TIME":
      return { ...state, totalQuizTime: action.payload };
    case "RESET_QUIZ":
      return {
        ...initialState,
        studyMaterial: state.studyMaterial,
        settings: state.settings,
        vectorStoreId: state.vectorStoreId,
      };
    default:
      return state;
  }
}

// Create context
const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider component
export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  // Keep a backup of questions for recovery
  const questionsBackupRef = useRef<Question[]>([]);

  // Update the backup whenever questions change
  useEffect(() => {
    if (state.questions.length > 0) {
      console.log("Backing up questions:", state.questions.length);
      questionsBackupRef.current = state.questions;
    }
  }, [state.questions]);

  const setPhase = useCallback((phase: QuizPhase) => {
    console.log(`Setting phase to ${phase}`);
    
    // When transitioning to results phase, make sure we have user answers
    if (phase === QuizPhase.Results && state.userAnswers.length === 0 && state.questions.length > 0) {
      console.warn("Transitioning to results with no answers - this may indicate a state issue");
      toast({
        title: "Warning",
        description: "Quiz ended with missing answer data. Results may be incomplete.",
        variant: "default",
      });
    }
    
    dispatch({ type: "SET_PHASE", payload: phase });
  }, [state.userAnswers.length, state.questions.length]);

  const startQuiz = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      
      if (!state.studyMaterial) {
        toast({
          title: "Missing Study Material",
          description: "Please upload a study material before starting the quiz.",
          variant: "destructive",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // Extract content from the study material
      let content = "";
      try {
        if (typeof state.studyMaterial === "string") {
          content = state.studyMaterial;
        } else if (state.studyMaterial instanceof File) {
          if (state.studyMaterial.type === "application/pdf") {
            toast({
              title: "Processing PDF",
              description: "Extracting content using GPT-4o vision. This may take a moment...",
              variant: "default",
            });
            
            content = await extractTextFromPDF(state.studyMaterial);
            
            // Verify we have meaningful content
            if (content.length < 100 || content.includes("Error extracting PDF content")) {
              throw new Error("Could not extract meaningful content from the PDF");
            }
            
            console.log("Successfully extracted PDF content, length:", content.length);
          } else {
            content = await state.studyMaterial.text();
          }
        }
      } catch (error: any) {
        console.error("Error extracting content:", error);
        toast({
          title: "Content Extraction Error",
          description: error.message || "There was a problem reading your study material. Please try another file.",
          variant: "destructive",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      // Generate questions using OpenAI
      try {
        console.log("Calling OpenAI to generate questions");
        const response = await callOpenAI("generateQuestions", {
          content,
          numQuestions: state.settings.numQuestions,
          difficulty: state.settings.difficulty,
          preAssessmentResults: state.preAssessmentResults,
          vectorStoreId: state.vectorStoreId,
          questionTypeDistribution: state.settings.questionTypeDistribution
        });

        if (response.success && response.data) {
          console.log(`Received ${response.data.length} questions from OpenAI`);
          
          if (response.data.length === 0) {
            throw new Error("No questions were generated");
          }
          
          dispatch({ type: "SET_QUESTIONS", payload: response.data });
          dispatch({ type: "SET_PHASE", payload: QuizPhase.Quiz });
        } else {
          throw new Error(response.error || "An unknown error occurred");
        }
      } catch (error: any) {
        console.error("Error calling OpenAI:", error);
        toast({
          title: "Question Generation Failed",
          description: error.message || "Failed to generate questions",
          variant: "destructive",
        });
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start the quiz",
        variant: "destructive",
      });
      dispatch({ type: "SET_LOADING", payload: false });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.studyMaterial, state.settings, state.preAssessmentResults, state.vectorStoreId]);

  const nextQuestion = useCallback(() => {
    dispatch({ type: "NEXT_QUESTION" });
  }, []);

  const prevQuestion = useCallback(() => {
    dispatch({ type: "PREV_QUESTION" });
  }, []);

  const submitAnswer = useCallback(
    (answer: string | string[], timeSpent: number) => {
      const question = state.questions[state.currentQuestionIndex];
      const isCorrect = evaluateAnswer(question, answer);

      const userAnswer: UserAnswer = {
        questionId: question.id,
        userAnswer: answer,
        isCorrect,
        timeSpent,
        question: question.question,
        correctAnswer: question.correctAnswer,
        questionType: question.type,
        difficulty: question.difficulty, // Add difficulty for proficiency model
      };

      dispatch({ type: "SUBMIT_ANSWER", payload: userAnswer });

      // Move to the next question or complete quiz
      if (state.currentQuestionIndex < state.questions.length - 1) {
        nextQuestion();
      } else {
        dispatch({ type: "SET_PHASE", payload: QuizPhase.Results });
      }
    },
    [state.questions, state.currentQuestionIndex, nextQuestion]
  );

  const setStudyMaterial = useCallback((material: File | string) => {
    dispatch({ type: "SET_STUDY_MATERIAL", payload: material });
  }, []);

  const setSettings = useCallback((settings: Partial<QuizSettings>) => {
    dispatch({ type: "SET_SETTINGS", payload: settings });
  }, []);

  const setPreAssessmentResults = useCallback((results: PreAssessmentResults) => {
    dispatch({ type: "SET_PREASSESSMENT_RESULTS", payload: results });
  }, []);
  
  const setQuizResult = useCallback((result: QuizResult) => {
    dispatch({ type: "SET_QUIZ_RESULT", payload: result });
  }, []);

  const resetQuiz = useCallback(() => {
    dispatch({ type: "RESET_QUIZ" });
  }, []);

  const setVectorStoreId = useCallback((id: string | null) => {
    dispatch({ type: "SET_VECTOR_STORE_ID", payload: id });
  }, []);

  const setTotalQuizTime = useCallback((timeInSeconds: number) => {
    console.log("Setting total quiz time:", timeInSeconds);
    dispatch({ type: "SET_TOTAL_QUIZ_TIME", payload: timeInSeconds });
  }, []);

  const value = useMemo(
    () => ({
      state,
      startQuiz,
      nextQuestion,
      prevQuestion,
      submitAnswer,
      setStudyMaterial,
      setSettings,
      setPhase,
      setPreAssessmentResults,
      resetQuiz,
      setVectorStoreId,
      setQuizResult,
      setTotalQuizTime,
    }),
    [
      state,
      startQuiz,
      nextQuestion,
      prevQuestion,
      submitAnswer,
      setStudyMaterial,
      setSettings,
      setPhase,
      setPreAssessmentResults,
      resetQuiz,
      setVectorStoreId,
      setQuizResult,
      setTotalQuizTime,
    ]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

// Hook for using the quiz context
export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}

// Helper function to evaluate an answer
function evaluateAnswer(question: Question, answer: string | string[]): boolean {
  if (!question || !answer) return false;

  switch (question.type) {
    case "multiple-choice":
    case "true-false":
      return answer === question.correctAnswer;
    case "multiple-select":
      const correctAnswers = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [question.correctAnswer];
      const userAnswers = Array.isArray(answer) ? answer : [answer];

      // Check if arrays have the same length and all elements match
      return (
        correctAnswers.length === userAnswers.length &&
        correctAnswers.every((item) => userAnswers.includes(item))
      );
    case "descriptive":
      // For descriptive questions, we'll need to use AI to evaluate
      // This is a placeholder that marks it as incorrect until evaluation
      return false;
    default:
      return false;
  }
} 