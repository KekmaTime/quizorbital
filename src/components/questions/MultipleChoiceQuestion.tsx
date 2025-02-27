import React from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface MultipleChoiceQuestionProps {
  question: {
    options: string[];
  };
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
}

export const MultipleChoiceQuestion = ({ 
  question, 
  selectedAnswer, 
  onSelectAnswer 
}: MultipleChoiceQuestionProps) => {
  return (
    <RadioGroup
      value={selectedAnswer}
      onValueChange={onSelectAnswer}
      className="space-y-3"
    >
      {question.options.map((option, index) => (
        <div key={index} className="flex items-center space-x-3">
          <RadioGroupItem value={option} id={`option-${index}`} />
          <Label
            htmlFor={`option-${index}`}
            className="text-gray-700 cursor-pointer"
          >
            {option}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}; 