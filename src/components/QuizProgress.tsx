import React from "react";
import { Progress } from "./ui/progress";

interface QuizProgressProps {
  current: number;
  total: number;
}

export const QuizProgress = ({ current, total }: QuizProgressProps) => {
  const percentage = (current / total) * 100;
  
  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between mb-2 text-sm font-medium">
        <span>Question {current} of {total}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-2 bg-gray-200" indicatorClassName="bg-gradient-to-r from-purple-500 to-cyan-500" />
    </div>
  );
}; 