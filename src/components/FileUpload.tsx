import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a PDF file");
        setFile(null);
      }
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setUploadComplete(true);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleReset = () => {
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setError(null);
  };

  return (
    <Card className="w-full max-w-xl mx-auto backdrop-blur-sm bg-white/80">
      <CardHeader>
        <CardTitle>Upload Learning Material</CardTitle>
        <CardDescription>
          Upload a PDF document to generate personalized quiz questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!file && !uploadComplete && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-all relative"
          >
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Drag & Drop your PDF here</h3>
              <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
              <p className="text-xs text-gray-400">Supported format: PDF</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {file && !uploadComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-purple-500 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              {!uploading && (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpload}>
                    Upload
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}

        {uploadComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 p-4 rounded-lg flex items-center"
          >
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-800">Upload Complete!</p>
              <p className="text-sm text-green-600">Your PDF has been successfully uploaded.</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Upload Another
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};
