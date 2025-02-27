import React from "react";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";

interface DescriptiveQuestionProps {
  question: {
    text: string;
  };
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
}

export const DescriptiveQuestion = ({
  question,
  selectedAnswer = "",
  onSelectAnswer
}: DescriptiveQuestionProps) => {
  return (
    <div className="space-y-4">
      <Label htmlFor="answer" className="sr-only">
        Your Answer
      </Label>
      <Textarea
        id="answer"
        value={selectedAnswer}
        onChange={(e) => onSelectAnswer(e.target.value)}
        placeholder="Type your answer here..."
        className="min-h-[200px] resize-y"
      />
      <div className="text-sm text-gray-500">
        Tip: Provide a detailed explanation and include relevant examples if possible.
      </div>
    </div>
  );
}; 