import { toast } from "@/components/ui/use-toast";
import { openai } from "./openai";

// Interface for vector store creation
export interface VectorStoreCreateParams {
  name: string;
  fileId?: string;
  expirationDays?: number;
}

// Interface for file upload response
export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  error?: string;
  vectorStoreId?: string;
}

/**
 * Uploads a file to OpenAI and creates a vector store from it
 * @param file The file to upload
 * @param name The name for the vector store
 * @returns Promise with the upload response
 */
export async function uploadFileAndCreateVectorStore(
  file: File,
  name: string = "Quizorbis Study Material"
): Promise<FileUploadResponse> {
  try {
    // First upload the file to OpenAI
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "assistants");

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not found in environment variables");
    }

    const fileUploadResponse = await fetch("https://api.openai.com/v1/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      const errorData = await fileUploadResponse.json();
      throw new Error(errorData.error?.message || "Failed to upload file");
    }

    const fileData = await fileUploadResponse.json();
    const fileId = fileData.id;

    // Create a vector store with the uploaded file
    const vectorStoreResponse = await openai.vectorStores.create({
      name,
      file_ids: [fileId],
      expires_after: {
        anchor: "last_active_at",
        days: 7, // Default expiration policy
      }
      // Note: OpenAI may adjust chunking strategy automatically
      // If custom chunking is needed, update based on the latest API documentation
    });

    console.log("Vector store created:", vectorStoreResponse);

    // Return success response
    return {
      success: true,
      fileId,
      vectorStoreId: vectorStoreResponse.id,
    };
  } catch (error: any) {
    console.error("Error uploading file or creating vector store:", error);
    toast({
      title: "Error",
      description: error.message || "Failed to process your file",
      variant: "destructive",
    });

    return {
      success: false,
      error: error.message || "Failed to process your file",
    };
  }
}

/**
 * Gets the status of a vector store to check if all files are processed
 * @param vectorStoreId The vector store ID to check
 * @returns Boolean indicating if the vector store is ready
 */
export async function isVectorStoreReady(vectorStoreId: string): Promise<boolean> {
  try {
    const vectorStore = await openai.vectorStores.retrieve(vectorStoreId);
    
    // Check if all files are processed
    const { file_counts } = vectorStore;
    return file_counts.in_progress === 0;
  } catch (error) {
    console.error("Error checking vector store status:", error);
    return false;
  }
}

/**
 * Searches a vector store for relevant content
 * @param vectorStoreId The vector store ID to search
 * @param query The search query
 * @returns The search results
 */
export async function searchVectorStore(vectorStoreId: string, query: string) {
  try {
    // This is just a placeholder - in reality, you would use the file_search tool
    // through the Assistants API to access vector store content
    return {
      success: true,
      message: "Vector store search would happen via the Assistants API"
    };
  } catch (error: any) {
    console.error("Error searching vector store:", error);
    return {
      success: false,
      error: error.message
    };
  }
} 