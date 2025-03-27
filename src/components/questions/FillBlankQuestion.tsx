import React, { useState, useEffect } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface FillBlankQuestionProps {
  question: any;
  selectedAnswer?: string | string[];
  onSelectAnswer: (answer: string | string[]) => void;
}

export const FillBlankQuestion = ({ 
  question, 
  selectedAnswer = "", 
  onSelectAnswer 
}: FillBlankQuestionProps) => {
  // Initialize with proper type handling
  const [inputValue, setInputValue] = useState<string | string[]>(() => {
    if (Array.isArray(question.blanks) && question.blanks.length > 0) {
      return Array.isArray(selectedAnswer) ? selectedAnswer : Array(question.blanks.length).fill("");
    }
    return typeof selectedAnswer === 'string' ? selectedAnswer : "";
  });
  
  // For debugging
  useEffect(() => {
    console.log("FillBlankQuestion rendered with:", { question, selectedAnswer, inputValue });
  }, [question, selectedAnswer]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index?: number) => {
    if (typeof index === 'number' && Array.isArray(inputValue)) {
      // Handle multiple blanks
      const newValues = [...inputValue];
      newValues[index] = e.target.value;
      setInputValue(newValues);
    } else {
      // Handle single blank
      setInputValue(e.target.value);
    }
  };
  
  const handleSubmit = () => {
    onSelectAnswer(inputValue);
  };
  
  // Handle different question text formats
  const renderQuestionText = () => {
    const text = question.text;
    
    // If the question has defined blanks array
    if (Array.isArray(question.blanks) && question.blanks.length > 0) {
      // Format with [1], [2], etc.
      if (text.includes("[") && text.includes("]")) {
        const regex = /\[(\d+)\]/g;
        const parts = text.split(regex);
        
        return (
          <div className="mb-4">
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                {part}
                {index < parts.length - 1 && index % 2 === 0 && (
                  <Input
                    type="text"
                    value={Array.isArray(inputValue) ? inputValue[Math.floor(index/2)] || "" : ""}
                    onChange={(e) => handleChange(e, Math.floor(index/2))}
                    className="inline-block w-32 mx-1"
                    placeholder={`Answer ${Math.floor(index/2) + 1}`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        );
      }
    }
    
    // If the text contains underscores for blanks
    if (text.includes("_____")) {
      const parts = text.split("_____");
      return (
        <div className="mb-4">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              {part}
              {index < parts.length - 1 && (
                <Input
                  type="text"
                  value={typeof inputValue === 'string' ? inputValue : ""}
                  onChange={(e) => handleChange(e)}
                  className="inline-block w-32 mx-1"
                  placeholder="Your answer"
                />
              )}
            </React.Fragment>
          ))}
        </div>
      );
    }
    
    // Default case - just show text and input below
    // This is the fallback that should always work
    return (
      <>
        <p className="mb-4">{text}</p>
        <Textarea
          value={typeof inputValue === 'string' ? inputValue : ""}
          onChange={(e) => handleChange(e)}
          className="w-full min-h-[100px]"
          placeholder="Type your answer here..."
        />
      </>
    );
  };
  
  return (
    <div className="space-y-4">
      {renderQuestionText()}
      
      <Button 
        onClick={handleSubmit}
        className="mt-2"
        variant={selectedAnswer ? "outline" : "default"}
      >
        {selectedAnswer ? "Update Answer" : "Submit Answer"}
      </Button>
    </div>
  );
}; 