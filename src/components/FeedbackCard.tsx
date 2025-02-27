import React from "react";
import { Card, CardContent } from "./ui/card";
import { Brain, AlertTriangle, Lightbulb } from "lucide-react";

interface FeedbackCardProps {
  title: string;
  items: string[];
  icon: "strength" | "weakness" | "recommendation";
}

export const FeedbackCard = ({ title, items, icon }: FeedbackCardProps) => {
  const getIcon = () => {
    switch (icon) {
      case "strength":
        return <Brain className="h-5 w-5 text-green-500" />;
      case "weakness":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "recommendation":
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };
  
  const getHeaderColor = () => {
    switch (icon) {
      case "strength":
        return "bg-green-50 border-green-100";
      case "weakness":
        return "bg-orange-50 border-orange-100";
      case "recommendation":
        return "bg-blue-50 border-blue-100";
      default:
        return "bg-gray-50 border-gray-100";
    }
  };
  
  return (
    <Card className="border overflow-hidden">
      <div className={`flex items-center p-3 ${getHeaderColor()}`}>
        {getIcon()}
        <h4 className="ml-2 font-medium">{title}</h4>
      </div>
      <CardContent className="p-4">
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-400 mt-2 mr-2"></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}; 