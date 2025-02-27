import React from "react";
import { Input } from "../ui/input";

interface FillBlankQuestionProps {
  question: {
    text: string;
    blanks: string[];
  };
  selectedAnswer: string[];
  onSelectAnswer: (answer: string[]) => void;
}

export const FillBlankQuestion = ({ question, selectedAnswer, onSelectAnswer }: FillBlankQuestionProps) => {
  const handleInputChange = (index: number, value: string) => {
    const newAnswers = [...(selectedAnswer || new Array(question.blanks.length).fill(""))];
    newAnswers[index] = value;
    onSelectAnswer(newAnswers);
  };

  const parts = question.text.split(/\[(\d+)\]/);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {parts.map((part, index) => {
          if (/^\d+$/.test(part)) {
            const blankIndex = parseInt(part) - 1;
            return (
              <Input
                key={index}
                type="text"
                value={selectedAnswer?.[blankIndex] || ""}
                onChange={(e) => handleInputChange(blankIndex, e.target.value)}
                className="w-32 inline-block"
                placeholder="Type answer..."
              />
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    </div>
  );
}; 