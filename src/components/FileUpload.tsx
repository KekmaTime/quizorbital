import { useCallback, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useQuiz } from "@/lib/QuizContext";
import { Button } from "@/components/ui/button";
import { Upload, Newspaper, FileUp } from "lucide-react";
import { uploadFileAndCreateVectorStore, isVectorStoreReady } from "@/lib/vectorStore";

export default function FileUpload() {
  const { toast } = useToast();
  const { setStudyMaterial, setVectorStoreId, vectorStoreId } = useQuiz();
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setIsLoading(true);
      try {
        // Upload the file and create a vector store
        const result = await uploadFileAndCreateVectorStore(file);
        
        if (result.success && result.vectorStoreId) {
          // Set the vector store ID in the quiz context
          setVectorStoreId(result.vectorStoreId);
          
          // Also set the study material for fallback
          const text = await file.text();
          setStudyMaterial(text);
          
          setFileName(file.name);
          
          toast({
            title: "Success",
            description: "File uploaded and processed successfully",
          });
          
          // Check if the vector store is ready
          let isReady = false;
          let attempts = 0;
          
          while (!isReady && attempts < 10) {
            isReady = await isVectorStoreReady(result.vectorStoreId);
            if (!isReady) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              attempts++;
            }
          }
          
          if (isReady) {
            toast({
              title: "Vector Store Ready",
              description: "Your document has been processed and is ready for quizzing",
            });
          } else {
            toast({
              title: "Processing Document",
              description: "Your document is still being processed and may take a few moments",
            });
          }
        } else {
          throw new Error(result.error || "Failed to upload file");
        }
      } catch (error: any) {
        console.error("Error uploading file:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [setStudyMaterial, setVectorStoreId, toast]
  );

  const loadSampleContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/sample-content.txt");
      if (!response.ok) {
        throw new Error("Failed to load sample content");
      }
      
      const text = await response.text();
      
      // Create a File object from the text
      const file = new File([text], "sample-content.txt", { type: "text/plain" });
      
      // Upload the file and create a vector store
      await handleFileUpload(file);
      
      toast({
        title: "Sample Content Loaded",
        description: "Sample study material has been loaded successfully",
      });
    } catch (error: any) {
      console.error("Error loading sample content:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load sample content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [handleFileUpload, toast]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById("file-upload")?.click()}
          disabled={isLoading}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Study Material
        </Button>
        
        <Button
          variant="outline"
          onClick={loadSampleContent}
          disabled={isLoading}
        >
          <Newspaper className="mr-2 h-4 w-4" />
          Use Sample Content
        </Button>
      </div>
      
      <input
        id="file-upload"
        type="file"
        accept=".txt,.pdf,.docx,.md,.csv"
        onChange={handleChange}
        className="hidden"
      />
      
      {fileName && (
        <div className="flex items-center gap-2 text-sm">
          <FileUp className="h-4 w-4" />
          <span>Selected: {fileName}</span>
        </div>
      )}
      
      {isLoading && <p className="text-sm text-muted-foreground">Processing your document...</p>}
      
      {vectorStoreId && (
        <p className="text-sm text-green-600">Document processed and ready for quizzing!</p>
      )}
    </div>
  );
}
