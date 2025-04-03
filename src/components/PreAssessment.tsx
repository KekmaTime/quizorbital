import { useState, useEffect } from "react";
import { useQuiz } from "@/lib/QuizContext";
import { PreAssessmentQuestion, DifficultyLevel, PreAssessmentResults } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Slider } from "./ui/slider";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { ArrowRight, Check, HelpCircle, Lightbulb } from "lucide-react";
import { preAssessmentQuestions } from "@/lib/preAssessmentQuestions";

export const PreAssessment = () => {
  const { state, setPreAssessmentResults, setPhase } = useQuiz();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [answers, setAnswers] = useState<Map<string, string | number>>(new Map());
  
  const currentQuestion: PreAssessmentQuestion | undefined = preAssessmentQuestions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === preAssessmentQuestions.length - 1;
  
  // Set default value for slider questions
  useEffect(() => {
    if (currentQuestion?.type === 'slider' && selectedAnswer === null) {
      setSelectedAnswer(currentQuestion.defaultValue || 5);
    } else if (currentQuestion?.type === 'mcq') {
      setSelectedAnswer(null);
    }
  }, [currentQuestionIndex, currentQuestion]);
  
  // Check if current question has been answered
  useEffect(() => {
    if (currentQuestion) {
      const existingAnswer = answers.get(currentQuestion.id);
      if (existingAnswer) {
        setSelectedAnswer(existingAnswer);
      }
    }
  }, [currentQuestion, answers]);
  
  // Handle next question
  const handleNext = () => {
    if (!currentQuestion || selectedAnswer === null) return;
    
    // Save answer
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, selectedAnswer);
    setAnswers(newAnswers);
    setAnsweredQuestions(prev => new Set(prev).add(currentQuestion.id));
    
    // Move to next question or complete assessment
    if (isLastQuestion) {
      completePreAssessment();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    }
  };
  
  // Handle previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setSelectedAnswer(null);
    }
  };
  
  // Complete pre-assessment and calculate results
  const completePreAssessment = () => {
    // Calculate difficulty level based on answers
    const difficulty = calculateDifficulty();
    
    // Create pre-assessment results
    const results: PreAssessmentResults = {
      score: calculateScore(),
      recommendedDifficulty: difficulty,
      strengths: ["Understanding concepts", "Quick learning"],
      weaknesses: ["Technical implementation", "Advanced topics"]
    };
    
    // Update context
    setPreAssessmentResults(results);
  };
  
  // Calculate difficulty level based on answers
  const calculateDifficulty = (): DifficultyLevel => {
    // Simple algorithm that averages slider values and considers multiple choice responses
    let totalScore = 0;
    let maxScore = 0;
    
    // Process answers
    for (const question of preAssessmentQuestions) {
      const answer = answers.get(question.id);
      if (answer === undefined) continue;
      
      if (question.type === 'slider') {
        totalScore += Number(answer);
        maxScore += (question.max || 5);
      } else if (question.type === 'mcq' && question.id === 'pa-2') {
        // For knowledge level question
        if (answer === 'beginner') totalScore += 1;
        else if (answer === 'intermediate') totalScore += 3;
        else if (answer === 'advanced') totalScore += 5;
        maxScore += 5;
      }
    }
    
    // Calculate percentage
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 50;
    
    // Determine difficulty based on percentage
    if (percentage < 30) return DifficultyLevel.Beginner;
    if (percentage < 50) return DifficultyLevel.Easy;
    if (percentage < 70) return DifficultyLevel.Medium;
    if (percentage < 85) return DifficultyLevel.Hard;
    return DifficultyLevel.Expert;
  };
  
  // Calculate overall score
  const calculateScore = (): number => {
    return Math.round((answeredQuestions.size / preAssessmentQuestions.length) * 100);
  };
  
  // Calculate progress percentage
  const progressPercentage = Math.round(
    (answeredQuestions.size / preAssessmentQuestions.length) * 100
  );
  
  // Render question based on type
  const renderQuestion = () => {
    if (!currentQuestion) return null;
    
    switch (currentQuestion.type) {
      case "mcq":
        return (
          <RadioGroup
            value={selectedAnswer as string}
            onValueChange={setSelectedAnswer}
            className="space-y-3 mt-6"
          >
            {currentQuestion.options?.map((option) => (
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
        
      case "slider":
        return (
          <div className="space-y-6 mt-8">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-gray-500">
                {currentQuestion.min || 1}
              </Label>
              <Label className="text-xl font-medium">
                {selectedAnswer}
              </Label>
              <Label className="text-sm text-gray-500">
                {currentQuestion.max || 10}
              </Label>
            </div>
            <Slider
              value={selectedAnswer !== null ? [selectedAnswer as number] : [currentQuestion.defaultValue || 5]}
              min={currentQuestion.min || 1}
              max={currentQuestion.max || 10}
              step={currentQuestion.step || 1}
              onValueChange={(value) => setSelectedAnswer(value[0])}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (state.preAssessmentResults) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <Check className="h-6 w-6 text-green-500" />
            Pre-Assessment Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            Based on your answers, we've set your difficulty level to:
          </p>
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-lg text-primary font-medium text-lg mb-6">
            {state.preAssessmentResults.recommendedDifficulty.charAt(0).toUpperCase() + 
              state.preAssessmentResults.recommendedDifficulty.slice(1)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            This will ensure the quiz is tailored to your knowledge level. You can always adjust this in the preferences.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!currentQuestion) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center">Loading Assessment...</CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
      <CardHeader className="relative">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {preAssessmentQuestions.length}
          </span>
          <span className="text-sm text-gray-500">
            Pre-Assessment
          </span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex items-center gap-2 mt-6">
          {currentQuestion.type === 'mcq' ? (
            <HelpCircle className="h-5 w-5 text-primary" />
          ) : (
            <Lightbulb className="h-5 w-5 text-primary" />
          )}
          <CardTitle className="text-xl">
            {currentQuestion.question}
          </CardTitle>
        </div>
        <CardDescription className="mt-2">
          Help us tailor the quiz to your knowledge level
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {renderQuestion()}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        <Button 
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="flex items-center gap-1"
        >
          {isLastQuestion ? (
            <>
              Complete <Check className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              Next <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}; 