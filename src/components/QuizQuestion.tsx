import React from "react";
import { motion } from "framer-motion";
import { MultipleChoiceQuestion } from "./questions/MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./questions/TrueFalseQuestion";
import { FillBlankQuestion } from "./questions/FillBlankQuestion";
import { SequenceQuestion } from "./questions/SequenceQuestion";
import { DescriptiveQuestion } from "./questions/DescriptiveQuestion";

interface QuestionProps {
  question: Question;
  selectedAnswer?: string | string[] | Record<string, string>;
  onSelectAnswer: (answer: string | string[] | Record<string, string>) => void;
}

export const QuizQuestion = ({ question, selectedAnswer, onSelectAnswer }: QuestionProps) => {
  const renderQuestion = () => {
    switch (question.type) {
      case "multiple-choice":
        return <MultipleChoiceQuestion question={question} selectedAnswer={selectedAnswer as string} onSelectAnswer={onSelectAnswer} />;
      case "true-false":
        return <TrueFalseQuestion question={question} selectedAnswer={selectedAnswer as string} onSelectAnswer={onSelectAnswer} />;
      case "fill-blank":
        return <FillBlankQuestion question={question} selectedAnswer={selectedAnswer as string[]} onSelectAnswer={onSelectAnswer} />;
      case "sequence":
        return <SequenceQuestion question={question} selectedAnswer={selectedAnswer as string[]} onSelectAnswer={onSelectAnswer} />;
      case "descriptive":
        return <DescriptiveQuestion question={question} selectedAnswer={selectedAnswer as string} onSelectAnswer={onSelectAnswer} />;
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-semibold text-gray-800">{question.text}</h3>
      {renderQuestion()}
    </motion.div>
  );
}; 