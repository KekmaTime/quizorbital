import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X } from "lucide-react";
import { Button } from "./ui/button";

interface VoiceInputProps {
  onResult: (text: string) => void;
  onCancel: () => void;
}

export const VoiceInput = ({ onResult, onCancel }: VoiceInputProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onstart = () => {
        setIsListening(true);
      };
      
      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcriptValue = result[0].transcript;
        setTranscript(transcriptValue);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
      recognitionInstance.start();
    } else {
      alert("Your browser doesn't support speech recognition. Please try a different browser.");
      onCancel();
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);
  
  const handleSubmit = () => {
    if (transcript) {
      onResult(transcript);
    }
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div 
          className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Voice Input</h3>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center py-8">
            <div className={`relative rounded-full p-4 ${isListening ? 'bg-purple-100 animate-pulse' : 'bg-gray-100'}`}>
              <Mic className={`h-8 w-8 ${isListening ? 'text-purple-600' : 'text-gray-400'}`} />
              {isListening && (
                <span className="absolute inset-0 rounded-full border-4 border-purple-300 animate-ping opacity-75"></span>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              {isListening ? "Listening..." : "Microphone inactive"}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 min-h-[80px] mb-4">
            {transcript ? (
              <p className="text-gray-800">{transcript}</p>
            ) : (
              <p className="text-gray-400 italic">Your spoken answer will appear here...</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!transcript}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
            >
              Submit Answer
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 