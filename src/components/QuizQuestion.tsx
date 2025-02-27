import React from "react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

interface QuestionProps {
  question: {
    id: string;
    text: string;
    options: string[];
  };
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
}

export const QuizQuestion = ({ 
  question, 
  selectedAnswer, 
  onSelectAnswer 
}: QuestionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-gray-800">
        {question.text}
      </h3>
      
      <RadioGroup 
        value={selectedAnswer} 
        onValueChange={onSelectAnswer}
        className="space-y-3"
      >
        {question.options.map((option, index) => (
          <div 
            key={index} 
            className="flex items-center space-x-2 rounded-lg border p-4 transition-colors hover:bg-purple-50 cursor-pointer"
            onClick={() => onSelectAnswer(option)}
          >
            <RadioGroupItem 
              value={option} 
              id={`option-${index}`} 
              className="text-purple-600"
            />
            <Label 
              htmlFor={`option-${index}`} 
              className="flex-grow cursor-pointer font-medium"
            >
              {option}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </motion.div>
  );
}; 