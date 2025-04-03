import FileUpload from "@/components/FileUpload";
import { QuizPreferences } from "@/components/QuizPreferences";
import { Quiz } from "@/components/Quiz";
import { QuizResults } from "@/components/QuizResults";
import { PreAssessment } from "@/components/PreAssessment";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Sparkles, Terminal, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { SectionBadge } from "@/components/ui/section-badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { LampContainer } from "@/components/ui/lamp-container";
import { useQuiz } from "@/lib/QuizContext";
import { Spinner } from "@/components/ui/spinner";
import { QuizPhase } from "@/lib/types";

const Index = () => {
  const [showQuiz, setShowQuiz] = useState(false);
  const { state, startQuiz, setPhase, resetQuiz, setPreAssessmentResults } = useQuiz();
  const { phase, isLoading, questions, userAnswers, preAssessmentResults } = state;

  // Handle starting the quiz
  const handleStartQuiz = async () => {
    if (phase === QuizPhase.Setup) {
      setPhase(QuizPhase.PreAssessment);
    }
  };

  // Handle starting the actual quiz after pre-assessment
  const handleStartAfterPreAssessment = async () => {
    // Start the quiz using the context
    startQuiz();
  };

  // Landing page
  if (!showQuiz) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <LampContainer className="pt-32 pb-20">
          <div className="container relative z-10 px-4 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <SectionBadge className="mb-6">
                <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                <span className="text-sm font-medium">AI-Powered Learning Platform</span>
              </SectionBadge>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-6xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400"
              >
                Master Any Subject with
                <br /> AI-Driven Quizzes
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-400 max-w-2xl mx-auto mb-8"
              >
                Transform your learning experience with personalized quizzes that adapt
                to your unique style and help you achieve mastery.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => setShowQuiz(true)}
                  size="lg"
                  className="group bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                >
                  Get Started
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <BorderBeam>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="group p-6"
                >
                  <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">AI-Powered Learning</h3>
                  <p className="text-gray-400">
                    Our intelligent system adapts questions based on your performance
                    and learning patterns.
                  </p>
                </motion.div>
              </BorderBeam>

              <BorderBeam>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="group p-6"
                >
                  <div className="h-12 w-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Terminal className="text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
                  <p className="text-gray-400">
                    Get detailed insights into your learning progress and areas for improvement.
                  </p>
                </motion.div>
              </BorderBeam>

              <BorderBeam>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="group p-6"
                >
                  <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Zap className="text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
                  <p className="text-gray-400">
                    Receive immediate explanations and track your progress in real-time.
                  </p>
                </motion.div>
              </BorderBeam>
            </div>
          </div>
        </LampContainer>
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
          {/* Step 1: Upload study material */}
          {phase === QuizPhase.Setup && (
            <div className="space-y-8 animate-fade-in">
              <FileUpload />
              {state.studyMaterial && <QuizPreferences />}
              <div className="text-center">
                <Button
                  onClick={() => setPhase(QuizPhase.PreAssessment)}
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={!state.studyMaterial}
                >
                  Next: Take Pre-Assessment
                </Button>
              </div>
            </div>
          )}

          {/* Pre-assessment */}
          {phase === QuizPhase.PreAssessment && !preAssessmentResults && (
            <PreAssessment />
          )}

          {/* Start quiz after pre-assessment */}
          {phase === QuizPhase.PreAssessment && preAssessmentResults && !isLoading && (
            <div className="text-center py-12 animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4">Ready to Start the Quiz</h2>
              <p className="text-gray-600 mb-8">
                Based on your pre-assessment, we've set your difficulty level to <strong className="text-primary">{preAssessmentResults.recommendedDifficulty}</strong>.
              </p>
              <Button
                onClick={handleStartAfterPreAssessment}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Start Quiz
              </Button>
            </div>
          )}

          {/* Generating quiz */}
          {isLoading && (
            <div className="text-center py-12 animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4">Generating Your Quiz</h2>
              <div className="flex justify-center mb-8">
                <Spinner className="h-10 w-10 text-primary" />
              </div>
              <p className="text-gray-600">
                Our AI is analyzing your study material and creating personalized questions...
              </p>
            </div>
          )}

          {/* Quiz in progress */}
          {phase === QuizPhase.Quiz && !isLoading && questions.length > 0 && (
            <Quiz />
          )}

          {/* Quiz results */}
          {phase === QuizPhase.Results && (
            <QuizResults />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
