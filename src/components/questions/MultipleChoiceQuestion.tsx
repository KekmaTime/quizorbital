import React, { useState } from "react";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

interface MultipleChoiceQuestionProps {
  question: {
    options: string[] | any;
    text?: string;
  };
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
}

export const MultipleChoiceQuestion = ({ 
  question, 
  selectedAnswer, 
  onSelectAnswer 
}: MultipleChoiceQuestionProps) => {
  // Local state for textarea input
  const [textInput, setTextInput] = useState(selectedAnswer || "");
  
  // Ensure options is an array with error handling
  let options = [];
  try {
    if (Array.isArray(question.options)) {
      options = question.options;
    } else if (typeof question.options === 'string') {
      options = JSON.parse(question.options);
    }
  } catch (e) {
    console.error("Failed to parse options:", e, question.options);
  }
  
  console.log("MultipleChoiceQuestion rendering with options:", options);
  
  // Handle submit for text input
  const handleSubmit = () => {
    onSelectAnswer(textInput);
  };
  
  // If we have valid options, render radio buttons
  if (Array.isArray(options) && options.length > 0) {
    return (
      <RadioGroup
        value={selectedAnswer}
        onValueChange={onSelectAnswer}
        className="space-y-3"
      >
        {options.map((option, index) => (
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
  }
  
  // Fallback to text input if no options are available
  return (
    <div className="space-y-4">
      <Textarea
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        className="w-full min-h-[100px]"
        placeholder="Type your answer here..."
      />
      <Button 
        onClick={handleSubmit}
        className="mt-2"
        variant="default"
      >
        Submit Answer
      </Button>
    </div>
  );
};