
import { FileUpload } from "@/components/FileUpload";
import { QuizPreferences } from "@/components/QuizPreferences";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Target, Zap } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [step, setStep] = useState(1);

  if (!showQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        {/* Hero Section */}
        <div className="container px-4 py-24 mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <p className="text-sm font-medium text-primary mb-2">Welcome to</p>
            <h1 className="text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              QUIZ<span className="text-primary">ORBIS</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Transform your learning experience with AI-powered quizzes that adapt
              to your unique learning style and help you master any subject.
            </p>
            <Button
              onClick={() => setShowQuiz(true)}
              size="lg"
              className="group"
            >
              Get Started
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fade-in">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Learning</h3>
              <p className="text-gray-600">
                Our intelligent system adapts questions based on your performance
                and learning style.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fade-in [animation-delay:200ms]">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Personalized Focus</h3>
              <p className="text-gray-600">
                Get questions tailored to your weak areas and learning objectives.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow animate-fade-in [animation-delay:400ms]">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
              <p className="text-gray-600">
                Receive immediate explanations and track your progress in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container px-4 py-16 mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary mb-2">Welcome to</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            QUIZORBIS
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            An intelligent quiz platform that adapts to your learning style and
            helps you master any subject through personalized questions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <FileUpload />
              <div className="text-center">
                <Button
                  onClick={() => setStep(2)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Next: Set Preferences
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <QuizPreferences />
              <div className="text-center space-x-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Start Quiz
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4">Quiz Ready!</h2>
              <p className="text-gray-600 mb-8">
                Your personalized quiz is being generated. Get ready to begin!
              </p>
              <Button variant="outline" onClick={() => setStep(1)}>
                Start Over
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
