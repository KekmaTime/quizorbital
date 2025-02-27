import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QuizQuestion } from "./QuizQuestion";
import { QuizProgress } from "./QuizProgress";
import { VoiceInput } from "./VoiceInput";
import { DifficultyIndicator } from "./DifficultyIndicator";
import { Button } from "./ui/button";
import { ArrowRight, Mic, HelpCircle } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  explanation: string;
}

interface QuizInterfaceProps {
  questions: Question[];
  onComplete: (results: any) => void;
  timeLimit?: number; // in minutes
}

export const QuizInterface = ({ 
  questions, 
  onComplete,
  timeLimit = 0 
}: QuizInterfaceProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  
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
  
  const handleAnswer = (questionId: string, answer: string) => {
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
  
  const handleQuizComplete = () => {
    // Calculate results
    const results = {
      answers,
      score: calculateScore(),
      timeSpent: timeLimit * 60 - timeRemaining,
    };
    onComplete(results);
  };
  
  const calculateScore = () => {
    let correct = 0;
    Object.entries(answers).forEach(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId);
      if (question && question.correctAnswer === answer) {
        correct++;
      }
    });
    return (correct / questions.length) * 100;
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleVoiceInput = (text: string) => {
    // Simple algorithm to match voice input to an option
    const options = currentQuestion.options;
    const bestMatch = options.reduce((best, current) => {
      const currentSimilarity = calculateSimilarity(text.toLowerCase(), current.toLowerCase());
      const bestSimilarity = calculateSimilarity(text.toLowerCase(), best.toLowerCase());
      return currentSimilarity > bestSimilarity ? current : best;
    }, options[0]);
    
    handleAnswer(currentQuestion.id, bestMatch);
    setIsVoiceInputActive(false);
  };
  
  // Simple string similarity function
  const calculateSimilarity = (str1: string, str2: string) => {
    const words1 = str1.split(' ');
    const words2 = str2.split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-4xl mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <QuizProgress 
          current={currentQuestionIndex + 1} 
          total={questions.length} 
        />
        
        {timeLimit > 0 && (
          <div className="text-lg font-medium">
            Time: {formatTime(timeRemaining)}
          </div>
        )}
      </div>
      
      <Card className="mb-8 bg-white/90 backdrop-blur-sm shadow-lg border-purple-100">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <DifficultyIndicator difficulty={currentQuestion.difficulty} />
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsVoiceInputActive(true)}
                    className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <Mic className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Answer with voice</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <QuizQuestion
            question={currentQuestion}
            selectedAnswer={answers[currentQuestion.id]}
            onSelectAnswer={(answer) => handleAnswer(currentQuestion.id, answer)}
          />
          
          <div className="mt-8 flex justify-between items-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hint: Focus on key concepts in the question</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 group"
            >
              {currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {isVoiceInputActive && (
        <VoiceInput 
          onResult={handleVoiceInput}
          onCancel={() => setIsVoiceInputActive(false)}
        />
      )}
    </motion.div>
  );
}; 