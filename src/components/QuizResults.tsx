import { useEffect, useState } from "react";
import { useQuiz } from "@/lib/QuizContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { callOpenAI } from "@/lib/openai";
import { analyzeQuizWithAssistant } from "@/lib/assistantsApi";
import { QuizResult } from "@/lib/types";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Star,
  XCircle,
  Brain,
  Bot
} from "lucide-react";

export const QuizResults = () => {
  const { state, resetQuiz, setQuizResult } = useQuiz();
  const { userAnswers, questions, totalQuizTime } = state;

  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [useAssistantApi, setUseAssistantApi] = useState(true);

  useEffect(() => {
    const analyzeResults = async () => {
      setLoading(true);
      try {
        // Check if userAnswers is defined and not empty
        if (!userAnswers || userAnswers.length === 0) {
          console.warn("No answers available for analysis");
          setLoading(false);
          return;
        }

        console.log(`Analyzing results with total quiz time: ${totalQuizTime} seconds`);
        
        let resultData;
        
        if (useAssistantApi) {
          // Use the new Assistants API integration
          try {
            console.log("Using OpenAI Assistants API for analysis");
            resultData = await analyzeQuizWithAssistant(userAnswers, totalQuizTime);
          } catch (error) {
            console.error("Assistants API failed, falling back to direct OpenAI call:", error);
            setUseAssistantApi(false);
            
            // Fall back to the original method
            const response = await callOpenAI("analyzePerformance", { 
              answers: userAnswers,
              includeProficiency: true,
              totalQuizTime
            });
            
            if (response.success && response.data) {
              resultData = response.data;
            } else {
              throw new Error("Failed to get valid analysis response");
            }
          }
        } else {
          // Use the original direct OpenAI API call
          console.log("Using direct OpenAI API call for analysis");
          const response = await callOpenAI("analyzePerformance", { 
            answers: userAnswers,
            includeProficiency: true,
            totalQuizTime
          });
          
          if (response.success && response.data) {
            resultData = response.data;
          } else {
            throw new Error("Failed to get valid analysis response");
          }
        }
        
        if (resultData) {
          setResult(resultData);
          setQuizResult(resultData); // Save to global state
        }
      } catch (error) {
        console.error("Failed to analyze results:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only analyze if we have answers
    if (userAnswers && userAnswers.length > 0) {
      analyzeResults();
    } else {
      console.warn("No user answers to analyze:", userAnswers);
      setLoading(false);
    }
  }, [userAnswers, setQuizResult, totalQuizTime, useAssistantApi]);

  const handleStartNew = () => {
    resetQuiz();
  };
  
  // Helper to get proficiency level description
  const getProficiencyLevel = (score: number): string => {
    if (score >= 0.9) return "Expert";
    if (score >= 0.75) return "Advanced";
    if (score >= 0.6) return "Intermediate";
    if (score >= 0.4) return "Basic";
    return "Beginner";
  };

  if (loading) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center">Analyzing Results...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {useAssistantApi ? (
            <>
              <div className="flex items-center justify-center mb-2">
                <Bot className="h-16 w-16 text-primary/60 animate-pulse" />
                <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full animate-ping"></div>
                <div className="ml-1 h-1.5 w-1.5 bg-blue-400 rounded-full animate-ping animation-delay-150"></div>
                <div className="ml-1 h-1 w-1 bg-blue-300 rounded-full animate-ping animation-delay-300"></div>
              </div>
              <p className="mt-4 text-gray-500 text-center">
                Please wait while the AI Assistant analyzes your performance.
                <br/>
                <span className="text-xs text-blue-500">Using OpenAI Assistants API with function calling</span>
              </p>
            </>
          ) : (
            <>
              <BarChart3 className="h-16 w-16 text-primary/60 animate-pulse" />
              <p className="mt-4 text-gray-500">Please wait while we analyze your performance.</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-center">No Results Available</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p>There are no quiz results to display.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleStartNew}>Start New Quiz</Button>
        </CardFooter>
      </Card>
    );
  }

  const { metrics, analysis } = result;
  const accuracy = parseFloat(metrics.accuracy);

  return (
    <Card className="w-full max-w-3xl mx-auto mt-8 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Quiz Results</CardTitle>
        <div className="flex justify-end">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">Analysis:</div>
            <button
              className={`px-2 py-1 text-xs rounded-l-md ${!useAssistantApi ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => {
                if (useAssistantApi) {
                  setUseAssistantApi(false);
                  setLoading(true);
                }
              }}
            >
              Standard
            </button>
            <button
              className={`px-2 py-1 text-xs rounded-r-md ${useAssistantApi ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
              onClick={() => {
                if (!useAssistantApi) {
                  setUseAssistantApi(true);
                  setLoading(true);
                }
              }}
            >
              Assistant API
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-8">
        {/* Summary */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
            <Award className="h-12 w-12 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            {accuracy > 80 
              ? "Excellent!" 
              : accuracy > 60 
                ? "Good Job!" 
                : "Keep Practicing!"}
          </h3>
          <p className="text-gray-600">
            You answered {metrics.correctAnswers} out of {metrics.totalQuestions} questions correctly.
          </p>
        </div>
        
        {/* Performance Metrics */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Performance Metrics</h4>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Accuracy</span>
                <span className="text-sm font-medium">{metrics.accuracy}%</span>
              </div>
              <Progress 
                value={parseFloat(metrics.accuracy)} 
                className="h-2"
              />
            </div>
            
            {/* Proficiency Score (if available) */}
            {result.proficiency !== undefined && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium flex items-center">
                    <Brain className="h-4 w-4 mr-1" /> 
                    Proficiency Level
                    {useAssistantApi && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-100 rounded-sm text-[10px] text-blue-700 flex items-center">
                        <Bot className="h-3 w-3 mr-0.5" />
                        Assistant
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium">
                    {getProficiencyLevel(result.proficiency)}
                  </span>
                </div>
                <Progress 
                  value={result.proficiency * 100} 
                  className="h-2 bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Based on {useAssistantApi ? 'OpenAI Assistant' : 'ML'} analysis of your quiz performance
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg flex items-center space-x-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Average Time</p>
                  <p className="font-medium">{metrics.averageResponseTime}</p>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Questions</p>
                  <p className="font-medium">{metrics.totalQuestions}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Analysis */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Detailed Analysis</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h5 className="text-sm font-medium flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                Strengths
              </h5>
              <ul className="space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <Star className="h-3 w-3 text-amber-500 mr-2 mt-1 flex-shrink-0" />
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-3">
              <h5 className="text-sm font-medium flex items-center">
                <XCircle className="h-4 w-4 text-red-500 mr-1" />
                Areas to Improve
              </h5>
              <ul className="space-y-1">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <Star className="h-3 w-3 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                    {weakness}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <h5 className="font-medium mb-2">How to Improve</h5>
          <p className="text-sm text-gray-600">{analysis.improvementSuggestions}</p>
          
          {analysis.recommendedTopics.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium mb-1">Recommended Topics to Review:</p>
              <div className="flex flex-wrap gap-2">
                {analysis.recommendedTopics.map((topic, index) => (
                  <a 
                    key={index}
                    href={`https://www.google.com/search?q=${encodeURIComponent(topic)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white rounded text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary/80 transition-colors cursor-pointer flex items-center"
                  >
                    {topic}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-center">
        <Button onClick={handleStartNew}>Start New Quiz</Button>
      </CardFooter>
    </Card>
  );
}; 