import { openai } from "./openai";
import { toast } from "@/components/ui/use-toast";

// Cache for assistants and threads
let quizAssistantId: string | null = null;
const threadCache = new Map<string, string>();

/**
 * Creates or retrieves the Quiz Assistant
 */
export async function getOrCreateQuizAssistant() {
  try {
    // Return cached assistant if available
    if (quizAssistantId) {
      return { success: true, assistantId: quizAssistantId };
    }

    // Create a new assistant
    const assistant = await openai.beta.assistants.create({
      name: "Quizorbis Quiz Assistant",
      instructions: 
        "You are an expert educational assistant for the Quizorbis platform. " +
        "Your primary functions are: " +
        "1. Generate quiz questions based on study materials " +
        "2. Evaluate user answers, especially for descriptive questions " +
        "3. Analyze user performance and provide personalized feedback " +
        "Use the provided study materials to create relevant and accurate questions.",
      model: "gpt-4o",
      tools: [{ type: "file_search" }],
    });

    quizAssistantId = assistant.id;
    console.log("Created Quiz Assistant:", assistant.id);
    
    return { success: true, assistantId: assistant.id };
  } catch (error: any) {
    console.error("Error creating assistant:", error);
    toast({
      title: "Error",
      description: "Failed to initialize AI assistant",
      variant: "destructive",
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Creates a thread for a new quiz session
 * @param vectorStoreId Optional vector store ID to attach to the thread
 */
export async function createQuizThread(vectorStoreId?: string) {
  try {
    // Create thread options
    const options: any = {
      messages: [
        {
          role: "user",
          content: "I'm starting a new quiz session. Please help me generate relevant questions based on my study materials."
        }
      ]
    };

    // Add vector store if provided
    if (vectorStoreId) {
      options.tool_resources = {
        file_search: { 
          vector_store_ids: [vectorStoreId]
        }
      };
    }

    // Create the thread
    const thread = await openai.beta.threads.create(options);
    console.log("Created thread:", thread.id);
    
    return { success: true, threadId: thread.id };
  } catch (error: any) {
    console.error("Error creating thread:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generates quiz questions from study materials
 * @param threadId The thread ID
 * @param assistantId The assistant ID
 * @param numQuestions Number of questions to generate
 * @param difficulty Difficulty level (1-5)
 * @param questionTypes Types of questions to generate
 */
export async function generateQuizQuestions(
  threadId: string,
  assistantId: string,
  numQuestions: number = 5,
  difficulty: number = 3,
  questionTypes: string[] = ["multiple-choice", "true-false", "descriptive"]
) {
  try {
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: `Generate ${numQuestions} quiz questions from my study materials. 
        Difficulty level: ${difficulty}/5.
        Question types: ${questionTypes.join(", ")}.
        Format the response as a JSON array of question objects.`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Return run ID for polling
    return { success: true, runId: run.id };
  } catch (error: any) {
    console.error("Error generating questions:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Checks the status of a run
 * @param threadId The thread ID
 * @param runId The run ID
 */
export async function checkRunStatus(threadId: string, runId: string) {
  try {
    const run = await openai.beta.threads.runs.retrieve(threadId, runId);
    
    // If completed, get the messages
    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(threadId);
      const lastMessage = messages.data[0]; // Last message is the assistant's response
      
      if (lastMessage.role === "assistant" && lastMessage.content[0].type === "text") {
        return { 
          success: true, 
          status: run.status,
          content: lastMessage.content[0].text.value 
        };
      }
    }
    
    return { success: true, status: run.status };
  } catch (error: any) {
    console.error("Error checking run status:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Evaluates a user's answer
 * @param threadId The thread ID
 * @param assistantId The assistant ID
 * @param question The question
 * @param userAnswer The user's answer
 * @param correctAnswer The correct answer
 */
export async function evaluateAnswer(
  threadId: string,
  assistantId: string,
  question: string,
  userAnswer: string,
  correctAnswer: string
) {
  try {
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: `Evaluate this answer:
        Question: ${question}
        User's answer: ${userAnswer}
        Correct answer: ${correctAnswer}
        Provide a score from 0-100 and feedback.`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Return run ID for polling
    return { success: true, runId: run.id };
  } catch (error: any) {
    console.error("Error evaluating answer:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyzes user performance
 * @param threadId The thread ID
 * @param assistantId The assistant ID
 * @param userAnswers Array of user answers with scores
 */
export async function analyzePerformance(
  threadId: string,
  assistantId: string,
  userAnswers: any[]
) {
  try {
    // Add message to thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: `Analyze my quiz performance:
        ${JSON.stringify(userAnswers)}
        Provide strengths, weaknesses, and recommendations for improvement.`
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    // Return run ID for polling
    return { success: true, runId: run.id };
  } catch (error: any) {
    console.error("Error analyzing performance:", error);
    return { success: false, error: error.message };
  }
} 