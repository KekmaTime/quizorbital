import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Define types for API responses
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Define types for auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  preferences?: Record<string, any>;
}

export interface OnboardingData {
  background_info: {
    education_level: string;
    subjects_of_interest: string[];
    learning_goals: string[];
    preferred_difficulty?: string;
  };
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor for authentication
api.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<AxiosError> => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: LoginCredentials): Promise<AxiosResponse> => 
    api.post('/auth/login', credentials),
  
  register: (data: RegisterData): Promise<AxiosResponse> => 
    api.post('/auth/register', data),
  
  refreshToken: (): Promise<AxiosResponse> => 
    api.post('/auth/refresh'),
  
  logout: (): Promise<AxiosResponse> => 
    api.post('/auth/logout'),
};

// User API
export const userAPI = {
  getProfile: (): Promise<AxiosResponse<UserProfile>> => 
    api.get('/user/profile'),
  
  updateProfile: (data: Partial<UserProfile>): Promise<AxiosResponse> => 
    api.put('/user/profile', data),
  
  getRecommendations: (): Promise<AxiosResponse> => 
    api.get('/user/recommendations'),
  
  submitOnboarding: (data: OnboardingData): Promise<AxiosResponse> => 
    api.post('/user/onboarding', data),
};

// Document API
export interface DocumentUploadResponse {
  id: string;
  title: string;
  description: string;
  tags: string[];
  created_at: string;
}

export const documentAPI = {
  uploadDocument: (formData: FormData): Promise<AxiosResponse<DocumentUploadResponse>> => {
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  getDocuments: (): Promise<AxiosResponse> => {
    // Add error handling and retry logic
    return api.get('/documents').catch(error => {
      console.error("Error fetching documents:", error);
      // Retry once after a short delay
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(api.get('/documents'));
        }, 1000);
      });
    });
  },
  
  getDocument: (id: string): Promise<AxiosResponse> => 
    api.get(`/document/${id}`),
};

// Quiz API
export interface QuizGenerationOptions {
  document_id: string;
  title: string;
  num_questions: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question_types?: ('multiple-choice' | 'true-false' | 'fill-blank' | 'sequence' | 'descriptive')[];
  time_limit?: number;
}

export interface VoiceResponseData {
  quiz_id: string;
  question_id: string;
  audio_data: Blob;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'sequence' | 'descriptive';
  text: string;
  options?: string[];
  correctAnswer?: string | boolean | string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  document_id: string;
  questions: QuizQuestion[];
  created_at: string;
  time_limit?: number;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  score: number;
  time_spent: number;
  created_at: string;
  questions: Array<QuizQuestion & {
    user_answer: any;
    is_correct: boolean;
  }>;
  totalQuestions: number;
  correctAnswers: number;
}

export const quizAPI = {
  generateQuiz: (data: QuizGenerationOptions): Promise<AxiosResponse<Quiz>> => {
    console.log("Generating quiz with data:", data);
    return api.post('/quiz/generate', data)
      .then(response => {
        console.log("Quiz generation response:", response.data);
        return response;
      })
      .catch(error => {
        console.error("Quiz generation error:", error);
        throw error;
      });
  },

  getQuizDirect: (quizId: string): Promise<AxiosResponse<Quiz>> => {
    console.log("Directly fetching quiz with ID:", quizId);
    return api.get(`/quiz/direct/${quizId}`)
      .then(response => {
        console.log("Direct quiz fetch response:", response.data);
        
        // Ensure the response has the expected structure
        if (!response.data || !response.data.questions) {
          console.error("Invalid quiz data format:", response.data);
          throw new Error("Invalid quiz data format");
        }
        
        // Transform the data to ensure it matches the Quiz interface
        const quiz: Quiz = {
          id: response.data.id || quizId,
          title: response.data.title || "Quiz",
          document_id: response.data.file_id || "",  // Use file_id from database as document_id
          difficulty: response.data.difficulty || "intermediate",
          created_at: response.data.created_at || new Date().toISOString(),
          questions: (response.data.questions || []).map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty || "intermediate",
            explanation: q.explanation || ""
          }))
        };
        
        return { ...response, data: quiz };
      })
      .catch(error => {
        console.error("Direct quiz fetch error:", error);
        throw error;
      });
  },
  
  generateAdaptiveQuiz: (data: QuizGenerationOptions): Promise<AxiosResponse<Quiz>> => 
    api.post('/quiz/adaptive', data),
  
  getQuiz: (quizId: string): Promise<AxiosResponse<Quiz>> => {
    console.log("Fetching quiz with ID:", quizId);
    return api.get(`/quiz/${quizId}`)
      .then(response => {
        console.log("Quiz fetch response:", response.data);
        
        // Transform backend data to match frontend expected format
        const quiz: Quiz = {
          id: response.data.id,
          title: response.data.title,
          difficulty: response.data.difficulty,
          created_at: response.data.created_at,
          questions: response.data.questions.map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            explanation: q.explanation || ''
          }))
        };
        return { ...response, data: quiz };
      })
      .catch(error => {
        console.error("Quiz fetch error:", error);
        throw error;
      });
  },
  
  submitQuizResult: (quizId: string, data: {
    answers: Array<{
      question_id: string;
      answer: any;
    }>;
    time_spent: number;
  }): Promise<AxiosResponse> => {
    console.log("Submitting quiz results:", data);
    return api.post(`/quiz/${quizId}/submit`, data);
  },
  
  getQuizResults: (quizId: string): Promise<AxiosResponse<QuizResult>> => {
    console.log("Fetching quiz results for ID:", quizId);
    return api.get(`/quiz/results/${quizId}`)
      .then(response => {
        console.log("Quiz results response:", response.data);
        
        // Transform the data to match the expected format
        const results = response.data;
        const transformedResults: QuizResult = {
          id: results.id,
          quiz_id: results.quiz_id,
          score: results.score,
          time_spent: results.time_spent,
          created_at: results.created_at,
          questions: results.questions.map((q: any) => ({
            id: q.id,
            type: q.type,
            text: q.text,
            options: q.options || [],
            correctAnswer: q.correct_answer || q.correctAnswer,
            difficulty: q.difficulty,
            explanation: q.explanation || '',
            user_answer: q.user_answer,
            is_correct: q.is_correct
          })),
          totalQuestions: results.questions.length,
          correctAnswers: results.questions.filter((q: any) => q.is_correct).length
        };
        
        return { ...response, data: transformedResults };
      });
  },
  
  submitVoiceResponse: (data: VoiceResponseData): Promise<AxiosResponse> => 
    api.post('/quiz/voice-response', data),
};

export default api; 