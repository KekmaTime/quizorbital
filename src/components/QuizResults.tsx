import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { FeedbackCard } from "./FeedbackCard";
import { ArrowRight, BarChart2, Award, Clock } from "lucide-react";

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  onRetake: () => void;
  onContinue: () => void;
}

export const QuizResults = ({
  score,
  totalQuestions,
  correctAnswers,
  timeSpent,
  feedback,
  onRetake,
  onContinue
}: QuizResultsProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  
  const getScoreColor = () => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    return "text-orange-500";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <Card className="mb-8 overflow-hidden border-purple-100">
        <div className="h-2 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-4xl font-bold ${getScoreColor()}`}>
                {Math.round(score)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">Overall Score</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-2xl font-bold text-blue-500">
                <Award className="mr-2 h-5 w-5" />
                {correctAnswers}/{totalQuestions}
              </div>
              <div className="text-sm text-gray-500 mt-1">Correct Answers</div>
            </div>
            
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-2xl font-bold text-purple-500">
                <Clock className="mr-2 h-5 w-5" />
                {formatTime(timeSpent)}
              </div>
              <div className="text-sm text-gray-500 mt-1">Time Spent</div>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <BarChart2 className="mr-2 h-5 w-5 text-purple-500" />
                Performance Analysis
              </h3>
              <div className="space-y-4">
                <FeedbackCard 
                  title="Strengths" 
                  items={feedback.strengths}
                  icon="strength"
                />
                
                <FeedbackCard 
                  title="Areas for Improvement" 
                  items={feedback.weaknesses}
                  icon="weakness"
                />
                
                <FeedbackCard 
                  title="Recommendations" 
                  items={feedback.recommendations}
                  icon="recommendation"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={onRetake}
            >
              Retake Quiz
            </Button>
            
            <Button 
              onClick={onContinue}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 group"
            >
              Continue Learning
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 