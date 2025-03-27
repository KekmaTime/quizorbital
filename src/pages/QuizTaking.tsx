import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QuizInterface } from "@/components/QuizInterface";
import { QuizResults } from "@/components/QuizResults";
import { useToast } from "@/components/ui/use-toast";
import { quizAPI, Quiz, QuizResult } from "@/services/api";

const QuizTaking = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) {
        setError("Quiz ID is missing");
        setLoading(false);
        return;
      }

      try {
        const response = await quizAPI.getQuizDirect(quizId);
        setQuiz(response.data);
      } catch (error: any) {
        console.error("Failed to fetch quiz:", error);
        setError(error.response?.data?.error || "Failed to load quiz");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load quiz. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, toast]);

  const handleQuizComplete = async (results: {
    answers: Array<{
      question_id: string;
      answer: any;
    }>;
    timeSpent: number;
  }) => {
    if (!quizId) return;
    
    setSubmitting(true);
    
    try {
      // Submit quiz results to API
      await quizAPI.submitQuizResult(quizId, {
        answers: results.answers,
        time_spent: results.timeSpent
      });
      
      // Get the actual results from the API
      const resultsResponse = await quizAPI.getQuizResults(quizId);
      setQuizResults(resultsResponse.data);
      setQuizCompleted(true);
      
      toast({
        title: "Quiz completed",
        description: "Your quiz has been submitted successfully.",
      });
    } catch (error: any) {
      console.error("Failed to submit quiz results:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.response?.data?.error || "Failed to submit quiz results.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizCompleted(false);
  };

  const handleContinueLearning = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>{error || "Quiz not found."}</p>
        <button 
          onClick={() => navigate("/dashboard")}
          className="mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {submitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg">Submitting your quiz...</p>
          </div>
        </div>
      )}
      
      {!quizCompleted ? (
        <>
          <h1 className="text-3xl font-bold mb-8 text-center">{quiz.title}</h1>
          <QuizInterface
            questions={quiz.questions}
            onComplete={handleQuizComplete}
            timeLimit={quiz.time_limit}
          />
        </>
      ) : (
        quizResults && (
          <QuizResults
            score={quizResults.score}
            totalQuestions={quizResults.totalQuestions}
            correctAnswers={quizResults.correctAnswers}
            timeSpent={quizResults.time_spent}
            questions={quizResults.questions}
            onRetake={handleRetakeQuiz}
            onContinue={handleContinueLearning}
          />
        )
      )}
    </div>
  );
};

export default QuizTaking; 