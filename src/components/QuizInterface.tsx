import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QuizQuestion } from "./QuizQuestion";
import { QuizProgress } from "./QuizProgress";
import { VoiceInput } from "./VoiceInput";
import { DifficultyIndicator } from "./DifficultyIndicator";
import { Button } from "./ui/button";
import { ArrowRight, Mic, HelpCircle, Clock, MicOff } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Progress } from "./ui/progress";

interface Question {
  id: string;
  type: "multiple-choice" | "descriptive" | "true-false" | "matching" | "fill-blank" | "sequence";
  text: string;
  options?: string[];
  pairs?: Array<{ id: string; term: string; definition: string }>;
  items?: string[];
  blanks?: string[];
  correctAnswer: string | boolean | Record<string, string> | string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
}

interface QuizInterfaceProps {
  questions: any[];
  onComplete: (results: any) => void;
  timeLimit?: number;
}

export const QuizInterface = ({ 
  questions, 
  onComplete,
  timeLimit = 0 
}: QuizInterfaceProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  
  // Log questions for debugging
  useEffect(() => {
    console.log("Questions received:", questions);
  }, [questions]);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  useEffect(() => {
    if (timeLimit === 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleQuizComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLimit]);
  
  const handleAnswer = (questionId: string, answer: any) => {
    console.log(`Saving answer for question ${questionId}:`, answer);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer
    }));
  };
  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleQuizComplete();
    }
  };
  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };
  
  const handleQuizComplete = () => {
    // Calculate results
    const results = {
      answers,
      timeSpent: timeLimit * 60 - timeRemaining,
    };
    onComplete(results);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle empty questions array
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center p-8">
        <p>No questions available for this quiz.</p>
      </div>
    );
  }
  
  // Ensure currentQuestion exists
  if (!currentQuestion) {
    return (
      <div className="text-center p-8">
        <p>Error loading question data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
        
        {timeLimit > 0 && (
          <div className="flex items-center text-sm font-medium">
            <Clock className="mr-1 h-4 w-4" />
            {formatTime(timeRemaining)}
          </div>
        )}
      </div>
      
      <Progress 
        value={(currentQuestionIndex + 1) / questions.length * 100} 
        className="h-2"
      />
      
      <Card className="p-6">
        <CardContent className="p-0">
          <QuizQuestion
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onSelectAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
          />
          
          {isVoiceInputActive && (
            <div className="mt-4 p-3 bg-purple-50 rounded-md flex items-center">
              <Mic className="h-5 w-5 text-purple-500 animate-pulse mr-2" />
              <span className="text-sm">Listening... Speak your answer clearly.</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsVoiceInputActive(false)}
                className="ml-auto"
              >
                <MicOff className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {!isVoiceInputActive && (
            <Button
              variant="outline"
              onClick={() => setIsVoiceInputActive(true)}
              className="flex items-center"
            >
              <Mic className="mr-2 h-4 w-4" />
              Voice Input
            </Button>
          )}
          
          {currentQuestionIndex < questions.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button 
              onClick={handleQuizComplete}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            >
              Finish Quiz
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}; 