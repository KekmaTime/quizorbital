import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, AlertCircle, FileText, X } from "lucide-react";
import { documentAPI } from "@/services/api";

export const FileUpload = ({ onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);
      
      // Use the documentAPI service instead of direct fetch
      const response = await documentAPI.uploadDocument(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);
      
      // After successful upload, call the onSuccess prop with the document data
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess({
          id: response.data.document_id || response.data.id || response.data._id,
          title: response.data.title || file.name.replace('.pdf', '')
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setError('Failed to upload document. Please try again.');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setUploadComplete(false);
    setError(null);
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium">Upload Learning Material</h3>
            <p className="text-sm text-gray-500">Upload a PDF document to generate personalized quiz questions</p>
          </div>
          
          {error && (
            <div className="bg-red-50 p-3 rounded-md flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          {!file && !uploadComplete && (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload').click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click to select a PDF file</p>
              <input 
                id="file-upload" 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileChange}
              />
            </div>
          )}
          
          {file && !uploadComplete && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {uploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-500 text-right">{uploadProgress}%</p>
                </div>
              )}
              
              <div className="flex space-x-2 mt-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleReset}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          )}
          
          {uploadComplete && (
            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-medium text-green-800">Upload Complete!</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Your document has been successfully uploaded.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReset}
              >
                Upload Another Document
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};