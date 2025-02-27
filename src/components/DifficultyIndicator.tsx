import React from "react";
import { Badge } from "./ui/badge";
import { Zap } from "lucide-react";

interface DifficultyIndicatorProps {
  difficulty: "beginner" | "intermediate" | "advanced";
}

export const DifficultyIndicator = ({ difficulty }: DifficultyIndicatorProps) => {
  const getColor = () => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-100 text-green-800 border-green-200";
      case "intermediate":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "advanced":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  return (
    <Badge className={`${getColor()} flex items-center gap-1 px-3 py-1 capitalize`}>
      <Zap className="h-3 w-3" />
      {difficulty}
    </Badge>
  );
}; 