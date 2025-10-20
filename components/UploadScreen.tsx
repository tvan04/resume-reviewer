import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationBar } from "./Navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { User, Resume } from "../src/App";
import svgPaths from "../public/svg";
import app from "../src/firebaseConfig";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

interface UploadScreenProps {
  user: User;
  onUpload: (resume: Omit<Resume, "id" | "uploadDate" | "version">) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export function UploadScreen({ user, onUpload }: UploadScreenProps) {
  const navigate = useNavigate();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // ---------------- Validation ----------------
  const validateFile = (file: File): string | undefined => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return "Only PDF files are supported. Please convert your resume to PDF format.";
    }
    if (file.size > 10 * 1024 * 1024) {
      return "File size must be less than 10MB.";
    }
    return undefined;
  };

  // ---------------- File Handling (with Firebase) ----------------
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    console.debug("[UploadScreen] selected files:", files.length);
    const newFiles: UploadFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      newFiles.push({
        file,
        progress: 0,
        status: error ? "error" : "uploading",
        error,
      });
    }

    setUploadFiles(newFiles);

    const valid = newFiles.filter((f) => f.status === "uploading");
    if (valid.length > 0) {
      startUpload(valid);
    }
  };

  const startUpload = async (validFiles: UploadFile[]) => {
    if (!user) {
      setUploadFiles((prev) =>
        prev.map((f) =>
          validFiles.find((v) => v.file === f.file)
            ? { ...f, status: "error", error: "You must be signed in to upload." }
            : f
        )
      );
      console.warn("[UploadScreen] upload blocked: no user signed in");
      return;
    }

    setIsUploading(true);

    for (const uploadFile of validFiles) {
      const file = uploadFile.file;

      try {
        // create a new document ref with an auto id
        const docRef = doc(collection(db, "resumes"));
        const resumeId = docRef.id;
        console.debug("[UploadScreen] creating resume doc", { resumeId, fileName: file.name, userId: user.id });

        const path = `resumes/${resumeId}/${file.name}`;
        const sRef = storageRef(storage, path);
        const task = uploadBytesResumable(sRef, file);

        // listen for progress
        task.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadFiles((prev) =>
              prev.map((f) => (f.file === file ? { ...f, progress } : f))
            );
          },
          (error) => {
            // upload error
            console.error("[UploadScreen] storage upload error", { file: file.name, error });
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.file === file ? { ...f, status: "error", error: (error as any)?.message || String(error) } : f
              )
            );
          },
          async () => {
            // upload complete
            try {
              const downloadURL = await getDownloadURL(sRef);
              console.debug("[UploadScreen] file uploaded, downloadURL obtained", { file: file.name, downloadURL });

              // build firestore document
              const resumeDoc = {
                id: resumeId,
                fileName: file.name,
                studentId: user.id,
                studentName: user.name,
                uploadDate: new Date().toISOString(),
                status: "pending",
                reviewerId: null,
                reviewerName: null,
                comments: [] as any[],
                version: 1,
                storagePath: path,
                downloadURL,
              };

              // write to Firestore
              try {
                await setDoc(docRef, resumeDoc as any);
                console.debug("[UploadScreen] resume doc written", { resumeId });
              } catch (writeErr) {
                console.error("[UploadScreen] failed to write resume doc to Firestore", { resumeId, file: file.name, writeErr });
                setUploadFiles((prev) =>
                  prev.map((f) =>
                    f.file === file ? { ...f, status: "error", error: (writeErr as any)?.message || "Failed to write resume metadata" } : f
                  )
                );
                return;
              }

              // update UI state for this file
              setUploadFiles((prev) =>
                prev.map((f) =>
                  f.file === file ? { ...f, status: "success", progress: 100 } : f
                )
              );

              // notify parent (keeps backward compatibility)
              const payload: Omit<Resume, "id" | "uploadDate" | "version"> = {
                fileName: file.name,
                studentId: user.id,
                studentName: user.name,
                status: "pending",
                comments: [],
                downloadURL,
                storagePath: path,
              };
              try {
                onUpload(payload);
              } catch (callbackErr) {
                console.error("[UploadScreen] onUpload callback threw", { callbackErr });
              }
            } catch (err) {
              console.error("[UploadScreen] error obtaining download URL or processing upload completion", { file: file.name, err });
              setUploadFiles((prev) =>
                prev.map((f) =>
                  f.file === file ? { ...f, status: "error", error: (err as any)?.message || "Upload completion failed" } : f
                )
              );
            }
          }
        );
      } catch (outerErr) {
        console.error("[UploadScreen] unexpected error during upload setup", { file: file.name, outerErr });
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, status: "error", error: (outerErr as any)?.message || "Upload failed" } : f
          )
        );
      }
    }

    setIsUploading(false);

    // Navigate to dashboard after a short delay so user can see result
    setTimeout(() => {
      navigate("/student");
    }, 1500);
  };

  // ---------------- Drag & Drop ----------------
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
    try {
      handleFileSelect(e.dataTransfer.files);
    } catch (err) {
      console.error("[UploadScreen] error handling drop event", err);
    }
  }, []);

  const removeFile = (fileToRemove: File) => {
    setUploadFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={() => navigate("/login")} />

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

          {/* Upload Card */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-[22px] font-semibold text-[#454545] mb-8">
                  Upload
                </h2>
              </div>

              {/* Drag and Drop */}
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-[rgba(8,133,134,0.3)] bg-[rgba(208,252,253,0.05)]"
                }`}
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

                <p className="text-[16px] font-semibold text-[#454545]">
                  Drag & drop files or{" "}
                  <span className="text-neutral-700 underline">Browse</span>
                </p>

                <p className="text-[12px] text-[#676767] mt-2">
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

              {/* Upload Status List */}
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
                        <Progress value={uploadFile.progress} className="mt-2" />
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
                <li>• Only PDF files are accepted to ensure consistent formatting</li>
                <li>• Maximum file size is 10MB</li>
                <li>• You can upload multiple versions of your resume</li>
                <li>• After uploading, you can share your resume with career advisors</li>
                <li>• Receive feedback and comments directly on your resume</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}