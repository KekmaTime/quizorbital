import { toast } from "@/components/ui/use-toast";
import { DifficultyLevel, QuestionType, PreAssessmentResults, QuestionTypeDistribution } from "./types";
import OpenAI from "openai";

// Initialize OpenAI client with API key from environment variables
export let openai: OpenAI;

// Function declarations for mock functions
function generateMockQuestions({ content, difficulty, count, questionTypes }: { 
  content: string;
  difficulty: string | DifficultyLevel;
  count: number;
  questionTypes: QuestionType[];
}) {
  console.log("Generating mock questions:", count);
  const questions = [];
  
  // Extract some keywords from content for more relevant mock questions
  const contentKeywords = content
    .split(/\s+/)
    .filter(word => word.length > 4)
    .slice(0, 20);
  
  // If no keywords found, use default ones
  const keywords = contentKeywords.length > 0 
    ? contentKeywords 
    : ['concept', 'learning', 'knowledge', 'education', 'study', 'material', 'question', 'answer', 'quiz'];
  
  // Map difficulty to numeric value
  const difficultyLevel = typeof difficulty === 'string' 
    ? difficulty.toLowerCase() 
    : difficulty;
  
  const difficultyValue = {
    'beginner': 1,
    'easy': 2,
    'medium': 3,
    'hard': 4,
    'expert': 5
  }[difficultyLevel] || 3;
  
  // Generate the requested number of questions
  for (let i = 0; i < count; i++) {
    // Determine question type (use provided types or default to multiple choice)
    const questionType = (questionTypes && questionTypes[i % questionTypes.length]) || 'multiple-choice';
    
    // Get a random keyword for question content
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    let question;
    
    switch (questionType) {
      case 'multiple-choice':
        question = {
          id: `mock-${i+1}`,
          question: `Which of the following best describes the concept of "${keyword}"?`,
          type: 'multiple-choice',
          options: [
            { id: 'a', text: `A fundamental aspect of ${keyword}` },
            { id: 'b', text: `A secondary characteristic of ${keyword}` },
            { id: 'c', text: `An advanced application of ${keyword}` },
            { id: 'd', text: `A historical development of ${keyword}` }
          ],
          correctAnswer: 'a',
          explanation: `The answer is (a) because it represents the most accurate description of ${keyword}.`,
          difficulty: difficultyLevel
        };
        break;
        
      case 'true-false':
        question = {
          id: `mock-${i+1}`,
          question: `${keyword} is considered a fundamental concept in this field.`,
          type: 'true-false',
          options: [
            { id: 'true', text: 'True' },
            { id: 'false', text: 'False' }
          ],
          correctAnswer: 'true',
          explanation: `This statement is true because ${keyword} forms a core principle in the subject.`,
          difficulty: difficultyLevel
        };
        break;
        
      case 'multiple-select':
        question = {
          id: `mock-${i+1}`,
          question: `Which of the following are associated with ${keyword}? Select all that apply.`,
          type: 'multiple-select',
          options: [
            { id: 'a', text: `Primary components` },
            { id: 'b', text: `Key characteristics` },
            { id: 'c', text: `Unrelated elements` },
            { id: 'd', text: `Historical background` }
          ],
          correctAnswer: 'a,b,d',
          explanation: `Options (a), (b), and (d) are correct because they are directly related to ${keyword}.`,
          difficulty: difficultyLevel
        };
        break;
        
      case 'descriptive':
        question = {
          id: `mock-${i+1}`,
          question: `Explain the concept of ${keyword} and its significance.`,
          type: 'descriptive',
          correctAnswer: `${keyword} is an important concept that refers to the fundamental principles and applications in this field. It has significant implications for understanding the broader context.`,
          explanation: `A good answer should cover what ${keyword} is, its key characteristics, and why it matters.`,
          difficulty: difficultyLevel
        };
        break;
        
      default:
        // Fallback to multiple choice
        question = {
          id: `mock-${i+1}`,
          question: `What is the primary purpose of ${keyword}?`,
          type: 'multiple-choice',
          options: [
            { id: 'a', text: `To improve understanding` },
            { id: 'b', text: `To provide structure` },
            { id: 'c', text: `To demonstrate application` },
            { id: 'd', text: `To assess knowledge` }
          ],
          correctAnswer: 'a',
          explanation: `The answer is (a) because the main purpose of ${keyword} is to enhance understanding.`,
          difficulty: difficultyLevel
        };
    }
    
    questions.push(question);
  }
  
  return questions;
}

function evaluateMockAnswer({ question, userAnswer }: any) {
  // Determine if the answer is correct based on question type
  let isCorrect = false;
  let feedback = '';
  let score = 0;
  
  try {
    if (!question || !userAnswer) {
      return {
        isCorrect: false,
        feedback: "Invalid question or answer.",
        explanation: "No valid input was provided for evaluation.",
        nextDifficulty: "easier"
      };
    }
    
    switch (question.type) {
      case 'multiple-choice':
      case 'true-false':
        isCorrect = userAnswer === question.correctAnswer;
        feedback = isCorrect 
          ? "Correct! Good job." 
          : `Incorrect. The correct answer is ${question.correctAnswer}.`;
        break;
        
      case 'multiple-select':
        // Sort both arrays to ensure order doesn't matter
        const correctAnswers = question.correctAnswer.split(',').sort().join(',');
        const userAnswers = userAnswer.split(',').sort().join(',');
        isCorrect = correctAnswers === userAnswers;
        feedback = isCorrect 
          ? "Correct! You selected all the right options." 
          : `Incorrect. The correct selections are: ${question.correctAnswer}.`;
        break;
        
      case 'descriptive':
        // For descriptive questions, check if answer has minimum length
        // and contains some keywords from correct answer
        const minWords = 5;
        const userWords = userAnswer.trim().split(/\s+/).length;
        
        // Extract keywords from correct answer
        const correctKeywords = question.correctAnswer
          .toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 4)
          .slice(0, 5);
        
        // Count how many keywords are in user answer
        const userAnswerLower = userAnswer.toLowerCase();
        const matchedKeywords = correctKeywords.filter(keyword => 
          userAnswerLower.includes(keyword)
        );
        
        // Calculate a score based on keywords matched and length
        const keywordScore = matchedKeywords.length / Math.max(1, correctKeywords.length);
        const lengthScore = Math.min(1, userWords / minWords);
        score = (keywordScore * 0.7) + (lengthScore * 0.3);
        
        // Mark as correct if score is decent
        isCorrect = score >= 0.5;
        
        feedback = isCorrect 
          ? "Your answer contains several key points and demonstrates understanding." 
          : "Your answer is missing important elements or is too brief.";
        break;
        
      default:
        isCorrect = false;
        feedback = "Could not evaluate this type of question.";
    }
    
    return {
      isCorrect,
      score: isCorrect ? 1 : 0,
      feedback,
      explanation: question.explanation || "No explanation available.",
      nextDifficulty: isCorrect ? "harder" : "easier"
    };
  } catch (error) {
    console.error("Error in mock answer evaluation:", error);
    return {
      isCorrect: false,
      feedback: "An error occurred while evaluating your answer.",
      explanation: "The system encountered an issue with this question.",
      nextDifficulty: "same"
    };
  }
}

function analyzeMockPerformance({ answers, totalQuizTime = null }: { answers: any[], totalQuizTime?: number | null }) {
  // Basic metrics calculation
  const totalQuestions = answers.length || 5;
  const correctAnswers = answers.filter(a => a.isCorrect).length || 3;
  const accuracy = (correctAnswers / totalQuestions) * 100;
  
  // Use total quiz time if provided, otherwise use sum of individual times
  let avgResponseTime;
  if (totalQuizTime) {
    // Convert to milliseconds for consistency
    avgResponseTime = Math.round(totalQuizTime * 1000 / totalQuestions);
  } else {
    avgResponseTime = answers.length 
      ? Math.round(answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length)
      : 10000; // Default 10 seconds in ms
  }
  
  // Calculate a mock proficiency score between 0.2 and 0.8
  const proficiency = Math.min(0.8, Math.max(0.2, correctAnswers / totalQuestions));
  
  return {
    metrics: {
      totalQuestions,
      correctAnswers,
      accuracy: accuracy.toFixed(2),
      averageResponseTime: totalQuizTime 
        ? `${(totalQuizTime / totalQuestions).toFixed(1)} seconds per question (${totalQuizTime} seconds total)` 
        : `${(avgResponseTime / 1000).toFixed(1)} seconds`,
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

try {
  // Get API key from environment variable
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("OpenAI API key not found in environment variables. Using mock functions.");
    throw new Error("API key not found");
  }
  
  openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for browser environments
  });
  console.log("OpenAI client initialized successfully");
} catch (error) {
  console.error("Failed to initialize OpenAI client:", error);
  // Create a dummy client that will be replaced with mock functions
  openai = {} as OpenAI;
}

// Interface for OpenAI API responses
export interface OpenAIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Function to handle OpenAI API calls
export async function callOpenAI(
  endpoint: string,
  payload: any
): Promise<OpenAIResponse> {
  try {
    console.log(`Calling OpenAI endpoint: ${endpoint}`);
    
    // For demo purposes, simulate an API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Return data based on the endpoint
    switch (endpoint) {
      case "generateQuestions":
        return await generateQuestions(payload);
      case "evaluateAnswer":
        return await evaluateAnswer(payload);
      case "analyzePerformance":
        return await analyzePerformance(payload);
      default:
        console.warn("Unknown endpoint:", endpoint);
        return {
          success: false,
          error: "Unknown endpoint",
        };
    }
  } catch (error: any) {
    console.error("OpenAI API call failed:", error);
    toast({
      title: "API Error",
      description: error.message || "Failed to communicate with AI service",
      variant: "destructive",
    });
    return {
      success: false,
      error: error.message || "Failed to communicate with AI service",
    };
  }
}

// Function to generate questions based on study material
async function generateQuestions({ 
  content, 
  numQuestions, 
  difficulty, 
  preAssessmentResults,
  vectorStoreId,
  questionTypeDistribution
}: { 
  content: string; 
  numQuestions: number;
  difficulty: DifficultyLevel;
  preAssessmentResults?: PreAssessmentResults | null;
  vectorStoreId?: string | null;
  questionTypeDistribution?: QuestionTypeDistribution[];
}): Promise<OpenAIResponse> {
  try {
    // If the content is too long, truncate it
    let truncatedContent = content;
    if (content && content.length > 10000) {
      truncatedContent = content.substring(0, 10000) + "...";
    }

    // Create a distribution of question types
    const questionTypes: QuestionType[] = [];
    
    // Validate the distribution - ensure we have percentages that add up properly
    const distribution = questionTypeDistribution ? [...questionTypeDistribution] : [
      { type: 'multiple-choice', percentage: 40 },
      { type: 'true-false', percentage: 20 },
      { type: 'multiple-select', percentage: 20 },
      { type: 'descriptive', percentage: 20 }
    ];
    
    // Check if distribution percentages are valid (sum > 0)
    const totalPercentage = distribution.reduce((sum, dist) => sum + dist.percentage, 0);
    if (totalPercentage <= 0) {
      console.warn("Invalid question type distribution - defaulting to standard mix");
      distribution.forEach((dist, index) => {
        dist.percentage = 25; // Equal distribution as fallback
      });
    }
    
    console.log("Using question type distribution:", distribution);
    
    // Calculate number of questions for each type
    distribution.forEach(dist => {
      const count = Math.max(1, Math.round((dist.percentage / 100) * numQuestions));
      for (let i = 0; i < count; i++) {
        questionTypes.push(dist.type as QuestionType);
      }
    });
    
    // Adjust array length to match numQuestions (in case of rounding issues)
    while (questionTypes.length < numQuestions) {
      questionTypes.push('multiple-choice');
    }
    while (questionTypes.length > numQuestions) {
      questionTypes.pop();
    }

    // Prepare the prompt for OpenAI
    const prompt = `
      You are an expert educator creating a quiz based on the provided study material.
      Please generate ${numQuestions} quiz questions with the following specifications:
      
      1. Difficulty level: ${difficulty}
      2. Question distribution: ${questionTypes.map((type, index) => `Question ${index+1}: ${type}`).join(', ')}
      
      CRITICALLY IMPORTANT INSTRUCTION:
      - Focus EXCLUSIVELY on the educational and subject matter content in the materials.
      - NEVER create questions about PDF formats, file metadata, encoding methods, fonts, 
        document structure, or any technical aspects of the document format.
      - If you cannot find sufficient relevant educational content, state this clearly
        rather than defaulting to questions about document technical specifications.
      - Questions must test understanding of the actual educational content only.
      
      For each question, provide:
      - A clear, complete question statement without abbreviations or ellipses
      - Make sure questions are fully written out and not cut off with "..."
      - Use proper formatting and clear language
      - Answer options (for multiple-choice, true-false, and multiple-select)
      - The correct answer(s)
      - A brief explanation of the answer
      
      Study Material:
      ${truncatedContent}
      
      Format your response as a valid JSON object with a 'questions' array.
      Each question should have: id, question, options (array with id and text), correctAnswer, explanation, difficulty, and type.
      For multiple-select questions, correctAnswer should be a comma-separated string of option ids.
      
      The response format should look like:
      {
        "questions": [
          {
            "id": "q1",
            "question": "What is...",
            "type": "multiple-choice",
            "options": [{"id": "a", "text": "Option A"}, {"id": "b", "text": "Option B"}],
            "correctAnswer": "a",
            "explanation": "Explanation here",
            "difficulty": "medium"
          },
          ...more questions...
        ]
      }
    `;

    // Call OpenAI API
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an educational AI expert at creating quiz questions. You always respond with valid JSON with a 'questions' array. Focus exclusively on the educational content in materials and never create questions about document formats or technical specifications."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      const responseContent = response.choices[0].message.content;
      if (!responseContent) {
        throw new Error("Empty response from OpenAI");
      }

      // Parse the response
      try {
        const parsedResponse = JSON.parse(responseContent);
        const questions = parsedResponse.questions || [];
        
        // Always provide fallback questions regardless of whether we got results
        // If we got less than requested or empty array, use mock ones to fill the gap
        if (questions.length < numQuestions) {
          console.log(`Only received ${questions.length}/${numQuestions} questions, adding mock questions`);
          
          // If we don't have enough questions, use mock ones to fill the gap
          const additionalQuestions = generateMockQuestions({
            content: truncatedContent, 
            difficulty, 
            count: numQuestions - questions.length, 
            questionTypes: questionTypes.slice(questions.length)
          });
          
          return {
            success: true,
            data: [...questions, ...additionalQuestions]
          };
        }
        
        return {
          success: true,
          data: questions
        };
      } catch (error) {
        console.error("Failed to parse OpenAI response:", error);
        console.log("Raw response:", responseContent);
        throw new Error("Failed to parse response from OpenAI");
      }
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw new Error("OpenAI API call failed");
    }
  } catch (error: any) {
    console.error("Error generating questions:", error);
    
    // Always provide fallback questions if any error occurs
    console.log("Falling back to mock questions");
    const mockQuestions = generateMockQuestions({ 
      content: content || "Sample content for mock questions", 
      difficulty, 
      count: numQuestions, 
      questionTypes: ['multiple-choice', 'true-false', 'multiple-select', 'descriptive']
    });
    
    return {
      success: true,
      data: mockQuestions
    };
  }
}

// Function to evaluate user answers
async function evaluateAnswer({ 
  question, 
  userAnswer 
}: { 
  question: any; 
  userAnswer: string;
}): Promise<OpenAIResponse> {
  try {
    // For simple question types, we can evaluate directly
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const isCorrect = question.correctAnswer === userAnswer;
      
      return {
        success: true,
        data: {
          isCorrect,
          feedback: isCorrect 
            ? "Correct! Well done." 
            : `Incorrect. The correct answer is ${question.correctAnswer}.`,
          explanation: question.explanation,
          nextDifficulty: isCorrect ? "harder" : "easier",
        }
      };
    }
    
    // For multiple-select
    if (question.type === 'multiple-select') {
      // Sort both arrays to ensure order doesn't matter
      const correctAnswers = question.correctAnswer.split(',').sort().join(',');
      const userAnswers = userAnswer.split(',').sort().join(',');
      const isCorrect = correctAnswers === userAnswers;
      
      return {
        success: true,
        data: {
          isCorrect,
          feedback: isCorrect 
            ? "Correct! You selected all the right options." 
            : `Incorrect. The correct selections are: ${question.correctAnswer}.`,
          explanation: question.explanation,
          nextDifficulty: isCorrect ? "harder" : "easier",
        }
      };
    }
    
    // For descriptive questions, use OpenAI to evaluate
    if (question.type === 'descriptive') {
      const prompt = `
        Evaluate this answer to the following question. 
        The expected answer is: "${question.correctAnswer}"
        
        Question: ${question.question}
        User's answer: "${userAnswer}"
        
        Please evaluate the answer based on:
        1. Accuracy of the content
        2. Completeness of the response
        3. Understanding of the concepts
        
        Provide a score from 0 to 1 (where 1 is perfect), constructive feedback, and determine if the answer is essentially correct.
      `;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are an educational assessment expert. Provide fair and accurate evaluations of student answers."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        });
        
        const content = response.choices[0].message.content;
        if (!content) {
          throw new Error("Empty response from OpenAI");
        }
        
        try {
          const parsedResponse = JSON.parse(content);
          const score = parseFloat(parsedResponse.score) || 0;
          const isCorrect = score >= 0.7 || parsedResponse.isCorrect === true;
          
          return {
            success: true,
            data: {
              isCorrect,
              score,
              feedback: parsedResponse.feedback || (isCorrect ? "Good answer!" : "Your answer needs improvement."),
              explanation: question.explanation,
              nextDifficulty: isCorrect ? "harder" : "easier",
            }
          };
        } catch (error) {
          console.error("Failed to parse OpenAI evaluation response:", error);
          
          // This is the important fix - don't automatically set isCorrect to true
          // Instead, implement a simple but meaningful validation
          const userAnswerWords = userAnswer.trim().split(/\s+/).length;
          const minWords = 5;  // Require at least 5 words
          const isCorrect = userAnswerWords >= minWords && userAnswer.toLowerCase().includes(
            question.correctAnswer.substring(0, 15).toLowerCase()
          );
          
          return {
            success: true,
            data: {
              isCorrect,
              feedback: isCorrect 
                ? "Your answer contains some key elements." 
                : "Your answer seems incomplete or off-topic.",
              explanation: question.explanation,
              nextDifficulty: isCorrect ? "harder" : "easier",
            }
          };
        }
      } catch (error) {
        console.error("Error evaluating descriptive answer with OpenAI:", error);
        
        // Fallback evaluation method - same meaningful validation as above
        const userAnswerWords = userAnswer.trim().split(/\s+/).length;
        const minWords = 5;
        const isCorrect = userAnswerWords >= minWords && userAnswer.toLowerCase().includes(
          question.correctAnswer.substring(0, 15).toLowerCase()
        );
        
        return {
          success: true,
          data: {
            isCorrect,
            feedback: isCorrect 
              ? "Your answer contains some key elements." 
              : "Your answer is either too short or doesn't address the question.",
            explanation: question.explanation,
            nextDifficulty: isCorrect ? "harder" : "easier",
          }
        };
      }
    }
    
    // Default fallback
    return {
      success: true,
      data: evaluateMockAnswer({ question, userAnswer })
    };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    
    // Fallback to mock evaluation
    return {
      success: true,
      data: evaluateMockAnswer({ question, userAnswer })
    };
  }
}

// Function to analyze user performance
async function analyzePerformance({ 
  answers,
  includeProficiency = false,
  totalQuizTime = null
}: { 
  answers: any[];
  includeProficiency?: boolean;
  totalQuizTime?: number | null;
}): Promise<OpenAIResponse> {
  try {
    // Check if answers is undefined or empty
    if (!answers || answers.length === 0) {
      console.warn("No answers to analyze");
      return {
        success: true,
        data: analyzeMockPerformance({ answers: [], totalQuizTime })
      };
    }
    
    // Basic metrics calculation
    const totalQuestions = answers.length;
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;
    
    // Calculate average response time
    // If totalQuizTime is provided, use it for a more accurate average
    let averageResponseTime; 
    if (totalQuizTime) {
      // Use the total quiz time divided by number of questions
      averageResponseTime = Math.round(totalQuizTime * 1000 / totalQuestions);
      console.log(`Using total quiz time: ${totalQuizTime}s for average calculation`);
    } else {
      // Fall back to sum of individual answer times
      const totalResponseTime = answers.reduce((total, answer) => total + answer.timeSpent, 0);
      averageResponseTime = Math.round(totalResponseTime * 1000 / totalQuestions);
    }
    
    // Prepare answer data for OpenAI
    const answerData = answers.map((answer, index) => {
      return {
        questionNumber: index + 1,
        question: answer.question,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        timeSpent: answer.timeSpent,
        difficulty: answer.difficulty || 'medium'
      };
    });
    
    // Call OpenAI for detailed analysis
    let prompt = `
      Analyze this quiz performance data:
      
      Total Questions: ${totalQuestions}
      Correct Answers: ${correctAnswers}
      Accuracy: ${accuracy.toFixed(2)}%
      Average Response Time: ${totalQuizTime ? `${totalQuizTime / totalQuestions} seconds per question (${totalQuizTime} seconds total)` : `${averageResponseTime / 1000} seconds`}
      
      Detailed Answers:
      ${JSON.stringify(answerData, null, 2)}
      
      Please provide:
      1. A list of strength areas (topics/concepts the user understands well)
      2. A list of weakness areas (topics/concepts that need improvement)
      3. A list of recommended topics to review
      4. Specific suggestions for improvement
    `;
    
    // Add proficiency prediction request if needed
    if (includeProficiency) {
      prompt += `
      5. A proficiency score between 0 and 1 (where 1 is expert-level mastery).
      
      For the proficiency score calculation, please consider:
      - Correct answer ratio (higher is better)
      - Response time (faster is better, but accuracy matters more)
      - Question difficulty (performing well on harder questions should count more)
      - Pattern of answers (consecutive correct answers indicate better mastery)
      
      The proficiency calculation should mimic a neural network that would consider these features.
      `;
    }
    
    prompt += `
      Format your response as a JSON object with the following structure:
      {
        "strengths": ["strength1", "strength2", ...],
        "weaknesses": ["weakness1", "weakness2", ...],
        "recommendedTopics": ["topic1", "topic2", ...],
        "improvementSuggestions": "detailed suggestions"
        ${includeProficiency ? ',"proficiency": 0.XX // number between 0-1' : ''}
      }
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an educational analytics expert. Provide insightful analysis of quiz performance data. If requested, calculate an accurate proficiency score based on the student's performance across multiple metrics."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    try {
      const parsedResponse = JSON.parse(content);
      
      const result = {
        metrics: {
          totalQuestions,
          correctAnswers,
          accuracy: accuracy.toFixed(2),
          averageResponseTime: totalQuizTime 
            ? `${(totalQuizTime / totalQuestions).toFixed(1)} seconds per question (${totalQuizTime} seconds total)` 
            : `${(averageResponseTime / 1000).toFixed(1)} seconds`,
        },
        analysis: {
          strengths: parsedResponse.strengths || ["General subject knowledge"],
          weaknesses: parsedResponse.weaknesses || ["Specific topic areas"],
          recommendedTopics: parsedResponse.recommendedTopics || ["Key concepts"],
          improvementSuggestions: parsedResponse.improvementSuggestions || 
            "Focus on reviewing the topics you found challenging and practice with more questions.",
        }
      };
      
      // Add proficiency if it was requested and provided
      if (includeProficiency && parsedResponse.proficiency !== undefined) {
        (result as any).proficiency = parsedResponse.proficiency;
      }
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error("Failed to parse OpenAI analysis response:", error);
      
      // Fallback to mock analysis
      return {
        success: true,
        data: analyzeMockPerformance({ answers, totalQuizTime })
      };
    }
  } catch (error) {
    console.error("Error analyzing performance:", error);
    
    // Fallback to mock analysis
    return {
      success: true,
      data: analyzeMockPerformance({ answers, totalQuizTime })
    };
  }
} 