import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { QuizPreferences } from "@/components/QuizPreferences";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import { CallToAction } from "@/components/landing/CallToAction";
import { Footer } from "@/components/landing/Footer";
import { QuizInterface } from "@/components/QuizInterface";

const sampleQuestions = [
  {
    id: "1",
    type: "multiple-choice",
    text: "What is QUIZORBIS?",
    options: [
      "A social media platform",
      "An AI-powered learning platform", 
      "A video game",
      "A music streaming service"
    ],
    correctAnswer: "An AI-powered learning platform",
    difficulty: "beginner",
    explanation: "QUIZORBIS is an AI-powered adaptive learning platform."
  },
  {
    id: "2",
    type: "descriptive",
    text: "Explain how QUIZORBIS adapts to individual learning needs and why this is beneficial for students.",
    correctAnswer: "QUIZORBIS uses AI algorithms to analyze student performance and dynamically adjust question difficulty. This personalization ensures students are consistently challenged at their optimal learning level, preventing both frustration from overly difficult content and boredom from too-easy questions. The platform's adaptive nature helps maintain engagement while maximizing learning efficiency.",
    difficulty: "intermediate",
    explanation: "A good explanation should cover both the technical aspect (AI adaptation) and educational benefits."
  },
  {
    id: "3",
    type: "true-false",
    text: "QUIZORBIS can only process text-based educational materials.",
    correctAnswer: false,
    difficulty: "beginner",
    explanation: "QUIZORBIS can handle various types of educational content, not just text."
  },
  {
    id: "4",
    type: "descriptive",
    text: "Compare and contrast traditional quiz platforms with QUIZORBIS's adaptive learning approach.",
    correctAnswer: "Traditional quiz platforms typically offer static content with fixed difficulty levels and predetermined question sequences. In contrast, QUIZORBIS employs AI-driven adaptation to customize the learning experience. It analyzes user responses in real-time, adjusts difficulty dynamically, and focuses on areas where improvement is needed. This results in more efficient learning and better engagement compared to one-size-fits-all approaches.",
    difficulty: "advanced",
    explanation: "The comparison should highlight key differentiating features of QUIZORBIS."
  },
  {
    id: "5",
    type: "multiple-choice",
    text: "Which of the following best describes QUIZORBIS's primary innovation?",
    options: [
      "Its colorful user interface",
      "Its adaptive learning algorithm",
      "Its social networking features",
      "Its content creation tools"
    ],
    correctAnswer: "Its adaptive learning algorithm",
    difficulty: "intermediate",
    explanation: "The core innovation of QUIZORBIS lies in its adaptive learning capabilities."
  },
  {
    id: "7",
    type: "fill-blank",
    text: "QUIZORBIS uses [1] algorithms to analyze student performance and [2] adjust question difficulty.",
    blanks: ["AI", "dynamically"],
    correctAnswer: ["AI", "dynamically"],
    difficulty: "intermediate",
    explanation: "The platform combines AI technology with dynamic adjustment capabilities."
  },
  {
    id: "8",
    type: "sequence",
    text: "Arrange the steps of using QUIZORBIS in the correct order:",
    items: [
      "Review performance analytics",
      "Upload learning material",
      "Take adaptive quiz",
      "Set quiz preferences"
    ],
    correctAnswer: [
      "Upload learning material",
      "Set quiz preferences",
      "Take adaptive quiz",
      "Review performance analytics"
    ],
    difficulty: "beginner",
    explanation: "Following the correct sequence ensures optimal use of QUIZORBIS features."
  }
];

const Index = () => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [step, setStep] = useState(1);

  const handleGetStarted = () => {
    setShowQuiz(true);
  };

  if (!showQuiz) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <Hero onGetStarted={handleGetStarted} />
        <Features />
        <HowItWorks />
        <Testimonials />
        <CallToAction onGetStarted={handleGetStarted} />
        <Footer />
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
            <div className="space-y-8 animate-fade-in">
              <QuizInterface
                questions={sampleQuestions}
                onComplete={(results) => {
                  console.log(results);
                  setStep(1);
                }}
                timeLimit={10}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
