import React from "react";
import { motion } from "framer-motion";
import { BorderBeam } from "@/components/ui/border-beam";
import { Brain, Terminal, Zap, FileText, BarChart2, Mic } from "lucide-react";
import { SectionBadge } from "@/components/ui/section-badge";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  iconBgClass: string;
  iconTextClass: string;
}

const FeatureCard = ({ icon, title, description, delay, iconBgClass, iconTextClass }: FeatureCardProps) => (
  <BorderBeam>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="group p-6"
    >
      <div className={`h-12 w-12 ${iconBgClass} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <div className={iconTextClass}>{icon}</div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  </BorderBeam>
);

export const Features = () => {
  const features = [
    {
      icon: <Brain />,
      title: "AI-Powered Learning",
      description: "Our intelligent system adapts questions based on your performance and learning patterns.",
      delay: 0.2,
      iconBgClass: "bg-purple-500/10",
      iconTextClass: "text-purple-400"
    },
    {
      icon: <Terminal />,
      title: "Smart Analysis",
      description: "Get detailed insights into your learning progress and areas for improvement.",
      delay: 0.3,
      iconBgClass: "bg-cyan-500/10",
      iconTextClass: "text-cyan-400"
    },
    {
      icon: <Zap />,
      title: "Instant Feedback",
      description: "Receive immediate explanations and track your progress in real-time.",
      delay: 0.4,
      iconBgClass: "bg-purple-500/10",
      iconTextClass: "text-purple-400"
    },
    {
      icon: <FileText />,
      title: "PDF Processing",
      description: "Upload any PDF and our system will generate personalized quizzes from the content.",
      delay: 0.5,
      iconBgClass: "bg-cyan-500/10",
      iconTextClass: "text-cyan-400"
    },
    {
      icon: <BarChart2 />,
      title: "Performance Metrics",
      description: "Track your learning journey with comprehensive analytics and progress reports.",
      delay: 0.6,
      iconBgClass: "bg-purple-500/10",
      iconTextClass: "text-purple-400"
    },
    {
      icon: <Mic />,
      title: "Voice Interaction",
      description: "Answer questions using voice commands for a more natural learning experience.",
      delay: 0.7,
      iconBgClass: "bg-cyan-500/10",
      iconTextClass: "text-cyan-400"
    }
  ];

  return (
    <div id="features" className="bg-black text-white py-20">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <SectionBadge className="mb-4">
            <Zap className="w-4 h-4 mr-2 text-cyan-400" />
            <span className="text-sm font-medium">Platform Features</span>
          </SectionBadge>
          <h2 className="text-4xl font-bold mb-4">Supercharge Your Learning</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            QUIZORBIS combines cutting-edge AI with proven learning techniques to help you master any subject faster.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
}; 