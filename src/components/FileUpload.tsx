
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploadedFile = e.dataTransfer.files[0];
      if (uploadedFile.type === "application/pdf") {
        setFile(uploadedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      if (uploadedFile.type === "application/pdf") {
        setFile(uploadedFile);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`relative rounded-lg border-2 border-dashed p-12 transition-all ${
          dragActive
            ? "border-primary bg-primary/10"
            : "border-gray-300 bg-white/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            Drag and drop your PDF file here, or click to select
          </p>
        </div>
      </div>
      {file && (
        <div className="mt-4 p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm">
          <p className="text-sm text-gray-600">Selected file: {file.name}</p>
        </div>
      )}
    </div>
  );
};
