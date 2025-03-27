declare interface Question {
  id: string;
  type: "multiple-choice" | "descriptive" | "true-false" | "fill-blank" | "sequence";
  text: string;
  options?: string[];
  pairs?: Array<{ id: string; term: string; definition: string }>;
  items?: string[];
  blanks?: string[];
  correctAnswer: string | boolean | Record<string, string> | string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
}

declare interface FillBlankQuestion {
  id: string;
  type: "fill-blank";
  text: string;
  blanks: string[];
  correctAnswer: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
}

declare interface DescriptiveQuestion {
  id: string;
  type: "descriptive";
  text: string;
  correctAnswer: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
} 