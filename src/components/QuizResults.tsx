import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { BarChart2, Clock, Award, Check, X } from "lucide-react";

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    options?: string[];
    correctAnswer?: any;
    user_answer: any;
    is_correct: boolean;
    explanation?: string;
  }>;
  onRetake?: () => void;
  onContinue?: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  correctAnswers,
  timeSpent,
  questions,
  onRetake,
  onContinue,
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderAnswerValue = (answer: any, type: string) => {
    if (!answer) return "No answer provided";
    
    if (type === 'true-false') {
      return answer === true || answer === "true" ? 'True' : 'False';
    } else if (Array.isArray(answer)) {
      return answer.join(', ');
    } else {
      return String(answer);
    }
  };
  
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-center">Quiz Results</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Award className="mr-2 h-5 w-5 text-yellow-500" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{score.toFixed(1)}%</div>
            <Progress value={score} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart2 className="mr-2 h-5 w-5 text-blue-500" />
              Correct Answers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {correctAnswers} / {totalQuestions}
            </div>
            <Progress 
              value={(correctAnswers / totalQuestions) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-green-500" />
              Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatTime(timeSpent)}</div>
            <div className="text-sm text-gray-500 mt-2">
              Average: {formatTime(timeSpent / totalQuestions)} per question
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-start gap-2">
                  <div className={`flex-shrink-0 p-1 rounded-full ${question.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                    {question.is_correct ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <X className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      Question {index + 1}: {question.text}
                    </h3>
                    
                    {question.options && question.options.length > 0 && (
                      <div className="mt-2 text-sm">
                        <div className="font-medium">Options:</div>
                        <ul className="list-disc pl-5">
                          {question.options.map((option, i) => (
                            <li key={i}>{option}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="text-sm">
                        <span className="font-medium">Your answer:</span>{' '}
                        <span className={question.is_correct ? 'text-green-600' : 'text-red-600'}>
                          {renderAnswerValue(question.user_answer, question.type)}
                        </span>
                      </div>
                      
                      {!question.is_correct && (
                        <div className="text-sm">
                          <span className="font-medium">Correct answer:</span>{' '}
                          <span className="text-green-600">
                            {renderAnswerValue(question.correctAnswer, question.type)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {question.explanation && (
                      <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                        <span className="font-medium">Explanation:</span> {question.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-center gap-4">
        {onRetake && (
          <Button 
            onClick={onRetake}
            variant="outline"
          >
            Retake Quiz
          </Button>
        )}
        
        {onContinue && (
          <Button 
            onClick={onContinue}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
          >
            Continue Learning
          </Button>
        )}
      </div>
    </div>
  );
}; 