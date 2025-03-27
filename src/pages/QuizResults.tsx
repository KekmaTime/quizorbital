import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FeedbackCard } from "@/components/FeedbackCard";
import { Button } from "@/components/ui/button";
import { BarChart2, Clock, Award } from "lucide-react";

const QuizResults = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Here you would fetch the quiz results from your API
    // For now, we'll just use mock data
    setTimeout(() => {
      setResults({
        score: 85,
        totalQuestions: 10,
        correctAnswers: 8.5,
        timeSpent: 450, // in seconds
        feedback: {
          strengths: [
            "Strong understanding of core concepts",
            "Excellent recall of key facts",
            "Good application of knowledge"
          ],
          weaknesses: [
            "Some difficulty with advanced topics",
            "Need to improve on time management"
          ],
          recommendations: [
            "Review chapter 5 on advanced concepts",
            "Practice more timed quizzes",
            "Focus on application-based questions"
          ]
        }
      });
      setLoading(false);
    }, 1000);
  }, [quizId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Loading results...</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Results not found.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Quiz Results</h1>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Your Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="font-medium">Score</span>
              <span className="font-medium">{results.score}%</span>
            </div>
            <Progress value={results.score} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-purple-50 p-4 rounded-lg flex items-center">
              <Award className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <div className="text-sm text-purple-700">Correct Answers</div>
                <div className="text-xl font-bold text-purple-900">
                  {results.correctAnswers}/{results.totalQuestions}
                </div>
              </div>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg flex items-center">
              <Clock className="h-8 w-8 text-cyan-500 mr-3" />
              <div>
                <div className="text-sm text-cyan-700">Time Spent</div>
                <div className="text-xl font-bold text-cyan-900">
                  {formatTime(results.timeSpent)}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg flex items-center">
              <BarChart2 className="h-8 w-8 text-amber-500 mr-3" />
              <div>
                <div className="text-sm text-amber-700">Performance</div>
                <div className="text-xl font-bold text-amber-900">
                  {results.score >= 80 ? "Excellent" : results.score >= 60 ? "Good" : "Needs Improvement"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Feedback</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FeedbackCard
                title="Strengths"
                items={results.feedback.strengths}
                icon="strength"
              />
              <FeedbackCard
                title="Areas to Improve"
                items={results.feedback.weaknesses}
                icon="weakness"
              />
              <FeedbackCard
                title="Recommendations"
                items={results.feedback.recommendations}
                icon="recommendation"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => window.location.href = "/dashboard"}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults; 