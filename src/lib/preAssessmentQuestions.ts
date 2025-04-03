import { PreAssessmentQuestion } from "./types";

// Sample pre-assessment questions to gauge user knowledge level
export const preAssessmentQuestions: PreAssessmentQuestion[] = [
  {
    id: "pa-1",
    question: "How familiar are you with the subject matter?",
    type: "slider",
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 3
  },
  {
    id: "pa-2",
    question: "How would you rate your current knowledge level?",
    type: "mcq",
    options: [
      { id: "beginner", text: "Beginner - I'm just starting to learn" },
      { id: "intermediate", text: "Intermediate - I have some understanding" },
      { id: "advanced", text: "Advanced - I have good knowledge of the subject" }
    ]
  },
  {
    id: "pa-3",
    question: "How quickly do you typically learn new concepts?",
    type: "slider",
    min: 1,
    max: 5,
    step: 1,
    defaultValue: 3
  },
  {
    id: "pa-4",
    question: "What's your preferred question type?",
    type: "mcq",
    options: [
      { id: "multiple-choice", text: "Multiple Choice" },
      { id: "true-false", text: "True/False" },
      { id: "descriptive", text: "Descriptive/Open-ended" },
      { id: "multiple-select", text: "Multiple Select" }
    ]
  },
  {
    id: "pa-5",
    question: "How much time do you want to spend on this quiz?",
    type: "mcq",
    options: [
      { id: "short", text: "Short (5-10 minutes)" },
      { id: "medium", text: "Medium (10-20 minutes)" },
      { id: "long", text: "Long (20+ minutes)" }
    ]
  }
];
 