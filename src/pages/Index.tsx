
import { FileUpload } from "@/components/FileUpload";
import { QuizPreferences } from "@/components/QuizPreferences";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Sparkles, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const Index = () => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [step, setStep] = useState(1);

  if (!showQuiz) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Hero Section */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 z-0" />
          <div className="absolute inset-0 backdrop-blur-3xl z-0" />

          <div className="container relative z-10 px-4 pt-32 pb-20 mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center bg-white/10 rounded-full px-4 py-2 mb-6"
              >
                <Sparkles className="w-4 h-4 mr-2 text-purple-400" />
                <span className="text-sm font-medium">AI-Powered Learning Platform</span>
              </motion.div>

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

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="group relative bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI-Powered Learning</h3>
                <p className="text-gray-400">
                  Our intelligent system adapts questions based on your performance
                  and learning patterns.
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="group relative bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="h-12 w-12 bg-cyan-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Terminal className="text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Smart Analysis</h3>
                <p className="text-gray-400">
                  Get detailed insights into your learning progress and areas for improvement.
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="group relative bg-white/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Instant Feedback</h3>
                <p className="text-gray-400">
                  Receive immediate explanations and track your progress in real-time.
                </p>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </motion.div>
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
