import React from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface TrueFalseQuestionProps {
  question: {
    text: string;
  };
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
}

export const TrueFalseQuestion = ({ 
  question, 
  selectedAnswer, 
  onSelectAnswer 
}: TrueFalseQuestionProps) => {
  return (
    <RadioGroup
      value={selectedAnswer}
      onValueChange={(value) => onSelectAnswer(value === "true" ? "true" : "false")}
      className="space-y-3"
    >
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="true" id="true" />
        <Label htmlFor="true" className="text-gray-700 cursor-pointer">
          True
        </Label>
      </div>
      <div className="flex items-center space-x-3">
        <RadioGroupItem value="false" id="false" />
        <Label htmlFor="false" className="text-gray-700 cursor-pointer">
          False
        </Label>
      </div>
    </RadioGroup>
  );
}; 