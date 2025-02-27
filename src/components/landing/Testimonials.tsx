import React from "react";
import { motion } from "framer-motion";
import { SectionBadge } from "@/components/ui/section-badge";
import { Star, MessageSquare } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  rating: number;
  delay: number;
}

const Testimonial = ({ quote, author, role, rating, delay }: TestimonialProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay }}
    className="bg-gray-900 p-6 rounded-xl border border-gray-800"
  >
    <div className="flex mb-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
        />
      ))}
    </div>
    <p className="text-gray-300 mb-6 italic">"{quote}"</p>
    <div className="flex items-center">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center mr-3">
        <span className="text-white font-bold">{author.charAt(0)}</span>
      </div>
      <div>
        <p className="font-medium text-white">{author}</p>
        <p className="text-sm text-gray-400">{role}</p>
      </div>
    </div>
  </motion.div>
);

export const Testimonials = () => {
  const testimonials = [
    {
      quote: "QUIZORBIS transformed how I study for exams. The adaptive questions helped me focus on my weak areas and improved my grades significantly.",
      author: "Sarah Johnson",
      role: "Medical Student",
      rating: 5,
      delay: 0.2
    },
    {
      quote: "As a teacher, I use QUIZORBIS to create personalized quizzes for my students. The insights I get from their performance are invaluable.",
      author: "Michael Chen",
      role: "High School Teacher",
      rating: 5,
      delay: 0.3
    },
    {
      quote: "The voice interaction feature is a game-changer. I can study while cooking or commuting, making the most of my limited time.",
      author: "Priya Patel",
      role: "Working Professional",
      rating: 4,
      delay: 0.4
    },
    {
      quote: "I uploaded my research papers and QUIZORBIS generated perfect questions to test my understanding. It's like having a personal tutor.",
      author: "David Wilson",
      role: "PhD Candidate",
      rating: 5,
      delay: 0.5
    }
  ];

  return (
    <div className="bg-black text-white py-24">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <SectionBadge className="mb-4">
            <MessageSquare className="w-4 h-4 mr-2 text-cyan-400" />
            <span className="text-sm font-medium">User Testimonials</span>
          </SectionBadge>
          <h2 className="text-4xl font-bold mb-4">What Our Users Say</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Join thousands of students and educators who have transformed their learning experience with QUIZORBIS.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </div>
  );
}; 