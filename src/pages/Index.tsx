
import { FileUpload } from "@/components/FileUpload";
import { QuizPreferences } from "@/components/QuizPreferences";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const [step, setStep] = useState(1);

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
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
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
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
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
