import React from "react";
import { motion } from "framer-motion";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./questions/TrueFalseQuestion";
import { FillBlankQuestion } from "./questions/FillBlankQuestion";
import { SequenceQuestion } from "./questions/SequenceQuestion";
import { DescriptiveQuestion } from "./questions/DescriptiveQuestion";

interface QuestionProps {
  question: Question;
  selectedAnswer?: string | string[] | Record<string, string>;
  onSelectAnswer: (answer: string | string[] | Record<string, string>) => void;
}

export const QuizQuestion = ({ question, selectedAnswer, onSelectAnswer }: QuestionProps) => {
  // For debugging
  console.log("QuizQuestion rendering:", { questionType: question.type, question, selectedAnswer });
  
  // Parse options if they're stored as a JSON string
  const getOptions = () => {
    if (!question.options) return [];
    
    // If options is a string (JSON array from database), parse it
    if (typeof question.options === 'string') {
      try {
        return JSON.parse(question.options);
      } catch (e) {
        console.error("Failed to parse options:", e);
        return [];
      }
    }
    
    // If already an array, return as is
    return question.options;
  };
  
  // Create a normalized question object with properly formatted data
  const normalizedQuestion = {
    ...question,
    options: getOptions()
  };
  
  const renderQuestion = () => {
    // Check if this is a multiple choice question with options
    if (question.type === "multiple-choice" || 
        (normalizedQuestion.options && normalizedQuestion.options.length > 0)) {
      return (
        <MultipleChoiceQuestion 
          question={normalizedQuestion} 
          selectedAnswer={selectedAnswer as string} 
          onSelectAnswer={onSelectAnswer} 
        />
      );
    }
    
    switch (question.type) {
      case "true-false":
        return <TrueFalseQuestion question={question} selectedAnswer={selectedAnswer as string} onSelectAnswer={onSelectAnswer} />;
      case "fill-blank":
        return <FillBlankQuestion question={question} selectedAnswer={selectedAnswer as string | string[]} onSelectAnswer={onSelectAnswer} />;
      case "sequence":
        return <SequenceQuestion question={question} selectedAnswer={selectedAnswer as string[]} onSelectAnswer={onSelectAnswer} />;
      case "descriptive":
        return <DescriptiveQuestion question={question} selectedAnswer={selectedAnswer as string} onSelectAnswer={onSelectAnswer} />;
      default:
        // Fallback to descriptive for unknown types
        console.warn(`Unknown question type: ${question.type}, falling back to descriptive`);
        return <DescriptiveQuestion question={question} selectedAnswer={selectedAnswer as string} onSelectAnswer={onSelectAnswer} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-gray-800">{question.text}</h3>
      {renderQuestion()}
    </motion.div>
  );
}; 