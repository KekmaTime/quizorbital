import { useState, useEffect, useRef } from "react";
import { useQuiz } from "@/lib/QuizContext";
import { Question, QuestionType, QuizPhase } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { AlertCircle, CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { toast } from "@/components/ui/use-toast";

export const Quiz = () => {
  // Debug logging
  console.log("Quiz component rendering");
  
  const { state, submitAnswer, setPhase } = useQuiz();
  const { questions, currentQuestionIndex, userAnswers } = state;
  
  console.log("Quiz state:", {
    questionsCount: questions.length,
    currentIndex: currentQuestionIndex,
    userAnswersCount: userAnswers.length
  });

  // Preserve questions in a ref to avoid losing them during re-renders
  const questionsRef = useRef(questions);
  useEffect(() => {
    if (questions.length > 0) {
      console.log("Updating questions ref");
      questionsRef.current = questions;
    }
  }, [questions]);

  // Start time tracking
  const [quizStartTime] = useState<Date>(new Date());
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedMultipleAnswers, setSelectedMultipleAnswers] = useState<string[]>([]);
  const [descriptiveAnswer, setDescriptiveAnswer] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(state.settings.timeLimit * 60);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    explanation: string;
  }>({ show: false, isCorrect: false, explanation: "" });

  // Use referenced questions to ensure we don't lose them
  const currentQuestion: Question | undefined = (questions.length > 0 && questions[currentQuestionIndex]) || 
                                                (questionsRef.current.length > 0 && questionsRef.current[currentQuestionIndex]);
  
  useEffect(() => {
    // If we have no current question but have questions in the ref, restore them
    if (questions.length === 0 && questionsRef.current.length > 0) {
      console.warn("Questions were lost from state, using backup from ref", questionsRef.current);
      toast({
        title: "Restored Quiz State",
        description: "Your quiz state was recovered from a backup."
      });
    }
  }, [questions]);
  
  const isLastQuestion = currentQuestionIndex === (questions.length - 1 || questionsRef.current.length - 1);
  const isQuizCompleted = currentQuestionIndex >= (questions.length || questionsRef.current.length);

  // Timer for the whole quiz
  useEffect(() => {
    if (!quizStartTime || isQuizCompleted || state.settings.timeLimit === 0) return;

    console.log("Setting up quiz timer with time limit:", state.settings.timeLimit);
    
    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor(
        (new Date().getTime() - quizStartTime.getTime()) / 1000
      );
      const remaining = state.settings.timeLimit * 60 - elapsedSeconds;
      
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        // End quiz by transitioning to results phase
        setPhase(QuizPhase.Results);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStartTime, state.settings.timeLimit, setPhase, isQuizCompleted]);

  // Reset question start time when the question changes
  useEffect(() => {
    console.log("Question index changed to:", currentQuestionIndex);
    setQuestionStartTime(new Date());
    setSelectedAnswer("");
    setSelectedMultipleAnswers([]);
    setDescriptiveAnswer("");
    setFeedback({ show: false, isCorrect: false, explanation: "" });
  }, [currentQuestionIndex]);

  // Add safety check to prevent premature quiz completion
  useEffect(() => {
    // If the quiz thinks it's completed but we have no or few user answers, something went wrong
    if (isQuizCompleted && userAnswers.length < Math.max(1, questions.length / 2)) {
      console.error("Quiz completed prematurely:", {
        answers: userAnswers.length,
        questions: questions.length,
        currentIndex: currentQuestionIndex
      });
      
      toast({
        title: "Quiz Error Detected",
        description: "The quiz ended unexpectedly. Returning to setup phase.",
        variant: "destructive",
      });
      
      // Reset and go back to setup after a brief delay
      setTimeout(() => {
        setPhase(QuizPhase.Setup);
      }, 2000);
    }
  }, [isQuizCompleted, questions.length, userAnswers.length, currentQuestionIndex, setPhase]);

  // Helper function to get current answer based on question type
  const getCurrentAnswer = (): string | string[] => {
    if (!currentQuestion) return "";
    
    switch (currentQuestion.type) {
      case "multiple-choice":
      case "true-false":
        return selectedAnswer;
      case "multiple-select":
        return selectedMultipleAnswers.sort();
      case "descriptive":
        return descriptiveAnswer;
      default:
        return "";
    }
  };

  // Check if the current answer is valid
  const isAnswerValid = (): boolean => {
    if (!currentQuestion) return false;
    
    switch (currentQuestion.type) {
      case "multiple-choice":
      case "true-false":
        return selectedAnswer !== "";
      case "multiple-select":
        return selectedMultipleAnswers.length > 0;
      case "descriptive":
        return descriptiveAnswer.trim().length > 0;
      default:
        return false;
    }
  };

  // Handle checkbox change for multiple select
  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedMultipleAnswers(prev => [...prev, id]);
    } else {
      setSelectedMultipleAnswers(prev => prev.filter(item => item !== id));
    }
  };

  // Handle answer submission
  const handleSubmit = async () => {
    if (!currentQuestion || !isAnswerValid()) return;

    const timeSpent = Math.floor(
      (new Date().getTime() - questionStartTime.getTime()) / 1000
    );

    const userAnswer = getCurrentAnswer();
    console.log("Submitting answer:", userAnswer);

    // Show feedback before moving to next question
    setFeedback({
      show: true,
      isCorrect: currentQuestion.type === "descriptive" 
        ? true // For descriptive questions, we don't show incorrect feedback
        : typeof currentQuestion.correctAnswer === 'string' 
          ? currentQuestion.correctAnswer === userAnswer 
          : JSON.stringify(currentQuestion.correctAnswer.sort()) === JSON.stringify(userAnswer),
      explanation: currentQuestion.explanation || "",
    });

    // Wait 3 seconds before moving to next question
    setTimeout(() => {
      console.log("Feedback timer completed, proceeding to next question");
      submitAnswer(userAnswer, timeSpent);
      
      // End quiz if it was the last question
      if (isLastQuestion) {
        console.log("Last question completed, transitioning to results");
        setPhase(QuizPhase.Results);
      }
    }, 3000);
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Calculate progress percentage
  const progressPercentage = Math.round(
    ((currentQuestionIndex) / questions.length) * 100
  );

  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case "multiple-choice":
      case "true-false":
        return (
          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-3"
          >
            {currentQuestion.options.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedAnswer === option.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                }`}
                onClick={() => setSelectedAnswer(option.id)}
              >
                <RadioGroupItem value={option.id} id={option.id} />
                <Label
                  htmlFor={option.id}
                  className="flex-grow cursor-pointer font-normal"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case "multiple-select":
        return (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-colors ${
                  selectedMultipleAnswers.includes(option.id) ? "border-primary bg-primary/5" : "hover:bg-gray-50"
                }`}
                onClick={() => handleCheckboxChange(
                  option.id, 
                  !selectedMultipleAnswers.includes(option.id)
                )}
              >
                <Checkbox 
                  id={option.id}
                  checked={selectedMultipleAnswers.includes(option.id)}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange(option.id, checked === true)
                  }
                />
                <Label
                  htmlFor={option.id}
                  className="flex-grow cursor-pointer font-normal"
                >
                  {option.text}
                </Label>
              </div>
            ))}
          </div>
        );
        
      case "descriptive":
        return (
          <div className="space-y-3">
            <Textarea 
              placeholder="Type your answer here..." 
              value={descriptiveAnswer}
              onChange={(e) => setDescriptiveAnswer(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render question type indicator
  const renderQuestionTypeIndicator = () => {
    if (!currentQuestion) return null;
    
    let icon;
    let label;
    
    switch (currentQuestion.type) {
      case "multiple-choice":
        icon = <AlertCircle className="h-4 w-4 mr-1" />;
        label = "Multiple Choice";
        break;
      case "true-false":
        icon = <AlertCircle className="h-4 w-4 mr-1" />;
        label = "True/False";
        break;
      case "multiple-select":
        icon = <CheckCircle2 className="h-4 w-4 mr-1" />;
        label = "Multiple Select";
        break;
      case "descriptive":
        icon = <FileText className="h-4 w-4 mr-1" />;
        label = "Descriptive";
        break;
      default:
        return null;
    }
    
    return (
      <div className="inline-flex items-center text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
        {icon}
        {label}
      </div>
    );
  };

  if (isQuizCompleted) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center">Quiz Completed!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            You have completed the quiz. Your results are being analyzed.
          </p>
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center">Loading Quiz...</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>Preparing your personalized questions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
      <CardHeader className="relative">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length || questionsRef.current.length}
          </span>
          {state.settings.timeLimit > 0 && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="mr-1 h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            {renderQuestionTypeIndicator()}
            <span className="font-medium">Question Type</span>
          </div>
          <p className="text-xl font-semibold whitespace-normal break-words">
            {currentQuestion?.question || "Loading question..."}
          </p>
        </div>
      </CardHeader>
      
      <CardContent>
        {currentQuestion ? renderQuestion() : (
          <div className="py-8 text-center">
            <p className="text-gray-500">
              There was an issue loading this question. Please try again or contact support.
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Reload Quiz
            </Button>
          </div>
        )}

        {feedback.show && (
          <Alert
            className={`mt-6 ${
              feedback.isCorrect ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <AlertTitle>
                {feedback.isCorrect ? "Correct!" : "Incorrect!"}
              </AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {feedback.explanation}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-xs text-gray-500">
          Difficulty: <span className="font-medium capitalize">{currentQuestion?.difficulty || "N/A"}</span>
        </div>
        <Button 
          onClick={handleSubmit}
          disabled={!currentQuestion || !isAnswerValid() || feedback.show}
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
        </Button>
      </CardFooter>
    </Card>
  );
}; 