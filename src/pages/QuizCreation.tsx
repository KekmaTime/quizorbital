import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/components/ui/use-toast";
import { quizAPI } from "@/services/api";
import { FileUpload } from "@/components/FileUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { documentAPI } from "@/services/api";

const QuizCreation = () => {
  const [title, setTitle] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [activeTab, setActiveTab] = useState("select");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch user's documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoadingDocuments(true);
      try {
        // Use the documentAPI service
        const response = await documentAPI.getDocuments();
        
        if (response && response.data) {
          setDocuments(response.data);
          
          // If we have documents but none selected, select the first one
          if (response.data.length > 0 && !documentId) {
            setDocumentId(response.data[0].id);
          }
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your documents. Please try refreshing the page."
        });
        setDocuments([]);
      } finally {
        setLoadingDocuments(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentId) {
      toast({
        variant: "destructive",
        title: "Missing document",
        description: "Please select a document for your quiz.",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Call the actual API to generate a quiz
      const response = await quizAPI.generateQuiz({
        document_id: documentId,
        title: title || "Untitled Quiz",
        num_questions: numQuestions,
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced',
        question_types: ['multiple-choice', 'true-false', 'fill-blank']
      });
      
      // Check if we have a valid quiz ID
      if (!response.data || !response.data.id) {
        throw new Error("No quiz ID returned from server");
      }
      
      toast({
        title: "Quiz created",
        description: "Your quiz has been successfully created.",
      });
      
      // Navigate to the quiz taking page with the actual quiz ID
      navigate(`/quiz/${response.data.id}`);
    } catch (error: any) {
      console.error("Failed to create quiz:", error);
      
      // More detailed error message
      const errorMessage = error.response?.data?.error || 
                          "There was an error creating your quiz.";
      
      toast({
        variant: "destructive",
        title: "Failed to create quiz",
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle document upload success
  const handleDocumentUploaded = (newDocument: any) => {
    if (newDocument && newDocument.id) {
      setDocuments(prevDocuments => [...prevDocuments, newDocument]);
      setDocumentId(newDocument.id);
      setActiveTab("select");
      toast({
        title: "Document uploaded",
        description: "Your document has been successfully uploaded."
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create a New Quiz</h1>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your quiz"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Document</Label>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Select Document</TabsTrigger>
                  <TabsTrigger value="upload">Upload New Document</TabsTrigger>
                </TabsList>
                <TabsContent value="select" className="pt-4">
                  {loadingDocuments ? (
                    <p className="text-sm text-gray-500">Loading your documents...</p>
                  ) : (
                    <Select value={documentId} onValueChange={setDocumentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents.length > 0 ? (
                          documents.map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.title}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-docs" disabled>
                            No documents available. Upload one first.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {documents.length === 0 && !loadingDocuments && (
                    <p className="text-sm text-red-500 mt-1">
                      No documents available. Please upload one using the "Upload New Document" tab.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="upload" className="pt-4">
                  <FileUpload onSuccess={handleDocumentUploaded} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numQuestions">Number of Questions: {numQuestions}</Label>
              <Slider
                id="numQuestions"
                min={1}
                max={20}
                step={1}
                value={[numQuestions]}
                onValueChange={(value) => setNumQuestions(value[0])}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
              disabled={isLoading || !documentId}
            >
              {isLoading ? "Creating Quiz..." : "Create Quiz"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizCreation; 