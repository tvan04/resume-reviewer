import React, { useState, useCallback } from "react";
import { Navigation } from "./Navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { User, Resume, Screen } from "../src/App";
import svgPaths from "../public/svg";

interface UploadScreenProps {
  user: User;
  onUpload: (resume: Omit<Resume, "id" | "uploadDate" | "version">) => void;
  onNavigate: (screen: Screen, resumeId?: string) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export function UploadScreen({
  user,
  onUpload,
  onNavigate,
}: UploadScreenProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | undefined => {
    // Check file type
    if (file.type !== "application/pdf") {
      return "Only PDF files are supported. Please convert your resume to PDF format.";
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB.";
    }

    return undefined; // Return undefined instead of null
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);

      newFiles.push({
        file,
        progress: 0,
        status: error ? "error" : "uploading",
        error, // This is now compatible with `string | undefined`
      });
    }

    setUploadFiles(newFiles);

    if (newFiles.some((f) => !f.error)) {
      startUpload(newFiles.filter((f) => !f.error));
    }
  };

  const startUpload = async (validFiles: UploadFile[]) => {
    setIsUploading(true);

    for (const uploadFile of validFiles) {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));

        setUploadFiles((prev) =>
          prev.map((f) => (f.file === uploadFile.file ? { ...f, progress } : f))
        );
      }

      // Mark as complete
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.file === uploadFile.file ? { ...f, status: "success" } : f
        )
      );

      // Create resume record
      const resumeData: Omit<Resume, "id" | "uploadDate" | "version"> = {
        fileName: uploadFile.file.name,
        studentId: user.id,
        studentName: user.name,
        status: "pending",
        comments: [],
      };

      onUpload(resumeData);
    }

    setIsUploading(false);

    // Clear files after 2 seconds
    setTimeout(() => {
      setUploadFiles([]);
    }, 2000);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const removeFile = (fileToRemove: File) => {
    setUploadFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={() => onNavigate("login")}
      />

      <div className="px-[79px] pt-[20px] pb-16 ">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-4">
              Upload Resume
            </h1>
            <p className="text-xl text-gray-600">
              Share your resume with career advisors for feedback
            </p>
          </div>

          {/* Upload Area */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-[22px] font-semibold text-[#454545] mb-8">
                  Upload
                </h2>
              </div>

              {/* Drag and Drop Area */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
                  ${
                    isDragOver
                      ? "border-blue-400 bg-blue-50"
                      : "border-[rgba(8,133,134,0.3)] bg-[rgba(208,252,253,0.05)]"
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                {/* Upload Icon */}
                <div className="mb-6">
                  <svg
                    className="w-16 h-12 mx-auto"
                    fill="none"
                    preserveAspectRatio="none"
                    viewBox="0 0 69 60"
                  >
                    <g>
                      <path
                        d={svgPaths.p31ccb600}
                        fill="#404040"
                        stroke="#F9FFF9"
                        strokeWidth="0.3"
                      />
                      <path d={svgPaths.pa198180} fill="#404040" />
                      <path
                        d={svgPaths.p24cc4200}
                        fill="#404040"
                        stroke="#F9FFF9"
                        strokeWidth="0.3"
                      />
                      <g>
                        <path
                          d={svgPaths.p2f2c45f0}
                          fill="#404040"
                          stroke="#483EA8"
                          strokeWidth="0.3"
                        />
                        <path
                          d={svgPaths.p15180100}
                          fill="#404040"
                          stroke="#483EA8"
                          strokeWidth="0.3"
                        />
                      </g>
                    </g>
                  </svg>
                </div>

                <div className="mb-4">
                  <p className="text-[16px] font-semibold text-[#454545]">
                    <span className="text-[#454545]">
                      Drag & drop files or{" "}
                    </span>
                    <span className="text-neutral-700 underline">Browse</span>
                  </p>
                </div>

                <p className="text-[12px] text-[#676767]">
                  Supported formats: PDF only
                </p>
              </div>

              <input
                id="file-input"
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />

              {/* File List */}
              {uploadFiles.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="text-[14px] font-semibold text-[#676767]">
                    {isUploading ? "Uploading" : "Upload Complete"}
                  </h3>

                  {uploadFiles.map((uploadFile, index) => (
                    <div
                      key={index}
                      className="bg-white border border-[#e3e3e3] rounded p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {uploadFile.status === "success" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : uploadFile.status === "error" ? (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-600" />
                          )}
                          <span className="text-[12px] text-[#0f0f0f]">
                            {uploadFile.file.name}
                          </span>
                        </div>

                        {uploadFile.status !== "uploading" && (
                          <button
                            onClick={() => removeFile(uploadFile.file)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {uploadFile.status === "error" && uploadFile.error && (
                        <Alert className="mt-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            {uploadFile.error}
                          </AlertDescription>
                        </Alert>
                      )}

                      {uploadFile.status === "uploading" && (
                        <Progress
                          value={uploadFile.progress}
                          className="mt-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="mt-8 text-center">
                <Button
                  className="bg-neutral-700 text-white px-8 py-3 text-[14px] font-bold uppercase w-full max-w-md"
                  disabled={isUploading || uploadFiles.length === 0}
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  Upload Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Upload Instructions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  • Only PDF files are accepted to ensure consistent formatting
                </li>
                <li>• Maximum file size is 10MB</li>
                <li>• You can upload multiple versions of your resume</li>
                <li>
                  • After uploading, you can share your resume with career
                  advisors
                </li>
                <li>• Receive feedback and comments directly on your resume</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
