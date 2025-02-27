import React from "react";
import { motion } from "framer-motion";
import { SectionBadge } from "@/components/ui/section-badge";
import { FileUp, Settings, BookOpen, ArrowRight } from "lucide-react";

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  step: number;
  isLast?: boolean;
}

const Step = ({ icon, title, description, step, isLast = false }: StepProps) => (
  <div className="relative flex flex-col items-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 * step }}
      className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center mb-6 z-10"
    >
      <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center">
        {icon}
      </div>
    </motion.div>
    
    {!isLast && (
      <div className="absolute top-10 left-[50%] w-full h-0.5 bg-gradient-to-r from-purple-500/20 to-cyan-500/20"></div>
    )}
    
    <motion.h3
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2 * step }}
      className="text-xl font-semibold mb-2"
    >
      {title}
    </motion.h3>
    
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 * step }}
      className="text-gray-400 text-center max-w-xs"
    >
      {description}
    </motion.p>
  </div>
);

export const HowItWorks = () => {
  const steps = [
    {
      icon: <FileUp className="h-8 w-8 text-purple-400" />,
      title: "Upload Your Content",
      description: "Upload any PDF document or learning material that you want to master."
    },
    {
      icon: <Settings className="h-8 w-8 text-cyan-400" />,
      title: "Set Your Preferences",
      description: "Choose difficulty level, number of questions, and time limits to customize your experience."
    },
    {
      icon: <BookOpen className="h-8 w-8 text-purple-400" />,
      title: "Take Adaptive Quizzes",
      description: "Answer questions that adapt to your knowledge level and learning style."
    },
    {
      icon: <ArrowRight className="h-8 w-8 text-cyan-400" />,
      title: "Track Your Progress",
      description: "Review detailed analytics and insights to see your improvement over time."
    }
  ];

  return (
    <div id="how-it-works" className="bg-black text-white py-24">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <SectionBadge className="mb-4">
            <Settings className="w-4 h-4 mr-2 text-purple-400" />
            <span className="text-sm font-medium">How It Works</span>
          </SectionBadge>
          <h2 className="text-4xl font-bold mb-4">Simple Process, Powerful Results</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our streamlined approach makes it easy to transform any learning material into an effective quiz experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Step 
              key={index} 
              {...step} 
              step={index + 1} 
              isLast={index === steps.length - 1} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 