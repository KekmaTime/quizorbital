import OpenAI from "openai";
import { UserAnswer } from "./types";
import { toast } from "@/components/ui/use-toast";

// Initialize OpenAI client with API key from environment variables
let openaiClient: OpenAI;

try {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("OpenAI API key not found in environment variables.");
    throw new Error("API key not found");
  }
  
  openaiClient = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for browser environments
  });
  console.log("OpenAI client initialized successfully for Assistants API");
} catch (error) {
  console.error("Failed to initialize OpenAI client for Assistants API:", error);
}

// Cache the assistant ID to avoid creating a new one each time
let quizAnalysisAssistantId: string | null = null;

// Function to get or create the quiz analysis assistant
export async function getQuizAnalysisAssistant(): Promise<string> {
  if (quizAnalysisAssistantId) {
    return quizAnalysisAssistantId;
  }

  try {
    const assistant = await openaiClient.beta.assistants.create({
      model: "gpt-4o",
      name: "Quiz Performance Analyzer",
      instructions: `You are an educational analytics expert. Provide insightful analysis of quiz performance data.
      Calculate an accurate proficiency score based on the student's performance across multiple metrics.
      Be encouraging but honest about areas for improvement.`,
      tools: [
        {
          type: "function",
          function: {
            name: "calculateAccuracyMetrics",
            description: "Calculate accuracy and proficiency metrics based on quiz answers",
            parameters: {
              type: "object",
              properties: {
                correctAnswers: {
                  type: "number",
                  description: "Number of correct answers",
                },
                totalQuestions: {
                  type: "number",
                  description: "Total number of questions",
                },
                quizDifficulty: {
                  type: "string",
                  description: "Overall difficulty level of the quiz",
                },
                timePerQuestion: {
                  type: "number",
                  description: "Average time spent per question in seconds",
                }
              },
              required: ["correctAnswers", "totalQuestions"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "identifyStrengthsAndWeaknesses",
            description: "Identify topic areas of strength and weakness based on quiz performance",
            parameters: {
              type: "object",
              properties: {
                answerDetails: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      isCorrect: { type: "boolean" },
                      difficulty: { type: "string" },
                      timeSpent: { type: "number" }
                    }
                  },
                  description: "Details of each question and answer"
                }
              },
              required: ["answerDetails"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "recommendTopics",
            description: "Recommend topics to study based on quiz performance",
            parameters: {
              type: "object",
              properties: {
                weaknesses: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of topic areas where the user struggled"
                },
                subjectArea: {
                  type: "string",
                  description: "The general subject area of the quiz"
                }
              },
              required: ["weaknesses"]
            }
          }
        }
      ]
    });

    quizAnalysisAssistantId = assistant.id;
    return assistant.id;
  } catch (error) {
    console.error("Error creating assistant:", error);
    throw new Error("Failed to create quiz analysis assistant");
  }
}

// Function to analyze quiz performance using the Assistants API
export async function analyzeQuizWithAssistant(answers: UserAnswer[], totalQuizTime: number | null) {
  try {
    if (!answers || answers.length === 0) {
      throw new Error("No answers to analyze");
    }

    // Get or create the assistant
    const assistantId = await getQuizAnalysisAssistant();

    // Create a thread for this analysis session
    const thread = await openaiClient.beta.threads.create();

    // Prepare the message with quiz data
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const averageTime = totalQuizTime ? (totalQuizTime / totalQuestions) : 
                        (answers.reduce((sum, a) => sum + a.timeSpent, 0) / totalQuestions);
    
    // Get subject area from questions
    const subjectArea = extractSubjectArea(answers);

    // Format message for the assistant
    const messageContent = `
    I've just completed a quiz with the following results:
    - Total questions: ${totalQuestions}
    - Correct answers: ${correctAnswers}
    - Total time: ${totalQuizTime ? `${totalQuizTime} seconds` : 'Not tracked'}
    - Average time per question: ${averageTime.toFixed(1)} seconds
    - Subject area: ${subjectArea}
    
    Here are the details of my answers:
    ${answers.map((a, i) => `
    Question ${i+1}: ${a.question}
    - Correct: ${a.isCorrect ? 'Yes' : 'No'}
    - Difficulty: ${a.difficulty || 'Medium'}
    - Time spent: ${a.timeSpent} seconds
    `).join('')}
    
    Please analyze my performance and provide:
    1. A detailed analysis of my accuracy and proficiency level
    2. My areas of strength and weakness
    3. Recommended topics to review
    4. Strategies for improvement
    `;

    // Add the message to the thread
    await openaiClient.beta.threads.messages.create(thread.id, {
      role: "user",
      content: messageContent
    });

    // Run the assistant
    const run = await openaiClient.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // Poll for the run to complete
    const completedRun = await waitForRunCompletion(thread.id, run.id);
    
    // Handle run results
    if (completedRun.status === 'completed') {
      // Get the assistant's response
      const messages = await openaiClient.beta.threads.messages.list(thread.id);
      
      // The last assistant message will have the analysis
      const assistantMessages = Array.from(messages.data)
        .filter(msg => msg.role === 'assistant')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (assistantMessages.length > 0) {
        // Process and format the assistant's response
        return processAssistantResponse(assistantMessages[0], {
          totalQuestions,
          correctAnswers,
          averageResponseTime: `${averageTime.toFixed(1)} seconds${totalQuizTime ? ` (${totalQuizTime} seconds total)` : ''}`
        });
      }
    } else if (completedRun.status === 'requires_action') {
      // Handle function calling (this would be replaced with actual function implementations)
      const toolCalls = completedRun.required_action?.submit_tool_outputs.tool_calls || [];
      
      const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
        const args = JSON.parse(toolCall.function.arguments);
        let output = "{}";
        
        if (toolCall.function.name === "calculateAccuracyMetrics") {
          output = JSON.stringify({
            accuracy: ((correctAnswers / totalQuestions) * 100).toFixed(2),
            proficiency: Math.min(0.9, Math.max(0.2, (correctAnswers / totalQuestions) * 
              (totalQuestions > 5 ? 1.2 : 1))), // Adjust based on test length
            suggestions: "Focus on understanding core concepts and practice more"
          });
        } else if (toolCall.function.name === "identifyStrengthsAndWeaknesses") {
          // Group questions by topics/concepts and analyze patterns
          const topics = groupQuestionsByTopic(answers);
          output = JSON.stringify({
            strengths: topics.filter(t => t.correctRate >= 0.7).map(t => t.topic),
            weaknesses: topics.filter(t => t.correctRate < 0.7).map(t => t.topic)
          });
        } else if (toolCall.function.name === "recommendTopics") {
          // Generate topic recommendations based on identified weaknesses
          const weaknesses = args.weaknesses || [];
          const recommendations = weaknesses.map(w => `${w} fundamentals`);
          recommendations.push(`${subjectArea} practice exercises`);
          
          output = JSON.stringify({
            recommendedTopics: recommendations,
            improvementStrategies: "Regular practice with focus on weak areas"
          });
        }
        
        return {
          tool_call_id: toolCall.id,
          output
        };
      }));
      
      // Submit the tool outputs
      const completedToolRun = await openaiClient.beta.threads.runs.submitToolOutputs(
        thread.id,
        completedRun.id,
        { tool_outputs: toolOutputs }
      );
      
      // Wait for the run to complete after submitting tool outputs
      const finalRun = await waitForRunCompletion(thread.id, completedToolRun.id);
      
      // Get the assistant's final response
      const messages = await openaiClient.beta.threads.messages.list(thread.id);
      
      const assistantMessages = Array.from(messages.data)
        .filter(msg => msg.role === 'assistant')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (assistantMessages.length > 0) {
        return processAssistantResponse(assistantMessages[0], {
          totalQuestions,
          correctAnswers,
          averageResponseTime: `${averageTime.toFixed(1)} seconds${totalQuizTime ? ` (${totalQuizTime} seconds total)` : ''}`
        });
      }
    } else {
      throw new Error(`Run failed with status: ${completedRun.status}`);
    }
    
    // Fallback in case something goes wrong
    throw new Error("Could not retrieve analysis results");
  } catch (error) {
    console.error("Error analyzing quiz with Assistant API:", error);
    toast({
      title: "Analysis Error",
      description: "Failed to analyze quiz results. Using backup analysis method.",
      variant: "destructive",
    });
    
    // Return a default analysis as fallback
    return createFallbackAnalysis(answers, totalQuizTime);
  }
}

// Helper function to wait for a run to complete
async function waitForRunCompletion(threadId: string, runId: string, maxAttempts = 20): Promise<any> {
  let attempts = 0;
  let run;
  
  while (attempts < maxAttempts) {
    run = await openaiClient.beta.threads.runs.retrieve(threadId, runId);
    
    if (run.status === 'completed' || run.status === 'requires_action' || 
        run.status === 'failed' || run.status === 'cancelled') {
      return run;
    }
    
    // Wait before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  
  throw new Error('Run timed out');
}

// Process and format the assistant's response
function processAssistantResponse(assistantMessage: any, metrics: any) {
  const content = assistantMessage.content;
  
  // Extract relevant parts from the assistant's message
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendedTopics: string[] = [];
  let improvementSuggestions = "";
  let proficiency = 0.5; // Default value
  
  // Parse the message content to extract structured information
  content.forEach((part: any) => {
    if (part.type === 'text') {
      const text = part.text.value;
      
      // Extract strengths
      const strengthsMatch = text.match(/Strengths:[\s\n]+([\s\S]+?)(?=Weaknesses:|$)/i);
      if (strengthsMatch && strengthsMatch[1]) {
        strengthsMatch[1].split(/\n/).forEach((line: string) => {
          const cleanLine = line.replace(/^[-*•\s]+/, '').trim();
          if (cleanLine) strengths.push(cleanLine);
        });
      }
      
      // Extract weaknesses
      const weaknessesMatch = text.match(/Weaknesses:[\s\n]+([\s\S]+?)(?=Recommended|Improvement|$)/i);
      if (weaknessesMatch && weaknessesMatch[1]) {
        weaknessesMatch[1].split(/\n/).forEach((line: string) => {
          const cleanLine = line.replace(/^[-*•\s]+/, '').trim();
          if (cleanLine) weaknesses.push(cleanLine);
        });
      }
      
      // Extract recommended topics
      const topicsMatch = text.match(/Recommended Topics:[\s\n]+([\s\S]+?)(?=Strategies|Improvement|$)/i);
      if (topicsMatch && topicsMatch[1]) {
        topicsMatch[1].split(/\n/).forEach((line: string) => {
          const cleanLine = line.replace(/^[-*•\s]+/, '').trim();
          if (cleanLine) recommendedTopics.push(cleanLine);
        });
      }
      
      // Extract improvement suggestions
      const suggestionsMatch = text.match(/(?:Strategies for Improvement|Improvement Suggestions):[\s\n]+([\s\S]+?)(?=\n\n|$)/i);
      if (suggestionsMatch && suggestionsMatch[1]) {
        improvementSuggestions = suggestionsMatch[1].trim();
      }
      
      // Extract proficiency
      const proficiencyMatch = text.match(/Proficiency:[\s\n]+(\d+(\.\d+)?)/i) || 
                              text.match(/Proficiency Level:[\s\n]*([\d.]+)/i) ||
                              text.match(/proficiency score of (\d+(\.\d+)?)/i);
      
      if (proficiencyMatch && proficiencyMatch[1]) {
        const extractedValue = parseFloat(proficiencyMatch[1]);
        if (!isNaN(extractedValue)) {
          if (extractedValue > 0 && extractedValue <= 1) {
            proficiency = extractedValue;
          } else if (extractedValue > 0 && extractedValue <= 100) {
            proficiency = extractedValue / 100; // Convert percentage to decimal
          }
        }
      }
    }
  });
  
  // Ensure we have at least some default values
  if (strengths.length === 0) strengths.push("General subject knowledge");
  if (weaknesses.length === 0) weaknesses.push("Specific topic areas");
  if (recommendedTopics.length === 0) recommendedTopics.push("Key concepts");
  if (!improvementSuggestions) {
    improvementSuggestions = "Focus on reviewing the topics you found challenging and practice with more questions.";
  }
  
  // Format the final result
  return {
    metrics: {
      totalQuestions: metrics.totalQuestions,
      correctAnswers: metrics.correctAnswers,
      accuracy: ((metrics.correctAnswers / metrics.totalQuestions) * 100).toFixed(2),
      averageResponseTime: metrics.averageResponseTime,
    },
    analysis: {
      strengths,
      weaknesses,
      recommendedTopics,
      improvementSuggestions,
    },
    proficiency
  };
}

// Extract subject area from quiz questions
function extractSubjectArea(answers: UserAnswer[]): string {
  // Try to determine the subject from questions
  const allText = answers.map(a => a.question || '').join(' ');
  const commonSubjects = [
    'Mathematics', 'Science', 'History', 'Geography', 'Literature',
    'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Programming',
    'Art', 'Music', 'Economics', 'Business', 'PDF', 'Font'
  ];
  
  for (const subject of commonSubjects) {
    if (allText.includes(subject)) {
      return subject;
    }
  }
  
  // Default fallback
  return 'General Knowledge';
}

// Group questions by topic for strength/weakness analysis
function groupQuestionsByTopic(answers: UserAnswer[]): Array<{topic: string, correctRate: number}> {
  // This is a simplified implementation that could be enhanced with NLP
  const topics = new Map<string, {correct: number, total: number}>();
  
  // Try to extract keywords from questions
  answers.forEach(answer => {
    if (!answer.question) return;
    
    // Very simple keyword extraction (could be improved)
    const words = answer.question.split(/\s+/)
      .filter(word => word.length > 4)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => !['what', 'which', 'where', 'when', 'explain', 'describe'].includes(word.toLowerCase()));
    
    // Take the most relevant words as potential topics
    const potentialTopics = words.slice(0, 2);
    
    potentialTopics.forEach(topic => {
      if (!topic) return;
      
      if (!topics.has(topic)) {
        topics.set(topic, {correct: 0, total: 0});
      }
      
      const topicData = topics.get(topic)!;
      topicData.total += 1;
      if (answer.isCorrect) {
        topicData.correct += 1;
      }
    });
  });
  
  // Convert to array and calculate rates
  return Array.from(topics.entries())
    .map(([topic, data]) => ({
      topic,
      correctRate: data.correct / data.total
    }))
    .filter(item => item.topic) // Remove empty topics
    .sort((a, b) => b.correctRate - a.correctRate); // Sort by correctness
}

// Create a fallback analysis in case the Assistants API fails
function createFallbackAnalysis(answers: UserAnswer[], totalQuizTime: number | null) {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const accuracy = (correctAnswers / totalQuestions) * 100;
  
  let avgResponseTime;
  if (totalQuizTime) {
    avgResponseTime = Math.round(totalQuizTime / totalQuestions);
  } else {
    avgResponseTime = answers.length 
      ? Math.round(answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length)
      : 10;
  }
  
  // Calculate proficiency score between 0.2 and 0.8
  const proficiency = Math.min(0.8, Math.max(0.2, correctAnswers / totalQuestions));
  
  return {
    metrics: {
      totalQuestions,
      correctAnswers,
      accuracy: accuracy.toFixed(2),
      averageResponseTime: totalQuizTime 
        ? `${avgResponseTime.toFixed(1)} seconds per question (${totalQuizTime} seconds total)` 
        : `${avgResponseTime.toFixed(1)} seconds`,
    },
    analysis: {
      strengths: ["Understanding of key concepts", "Application of principles"],
      weaknesses: ["Areas requiring deeper study", "Time management"],
      recommendedTopics: ["Core principles", "Practice questions"],
      improvementSuggestions: "Focus on reviewing challenging topics and practicing with timed exercises.",
    },
    proficiency
  };
} 