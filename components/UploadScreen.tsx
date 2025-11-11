// Contributors:
//  Luke Arvey - 3 Hours
//  Ridley Wills - 1 Hours
//  Tristan Van - 4 Hours

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationBar } from "./Navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription } from "./ui/alert";
import { FileText, X, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { User, Resume } from "../src/App";
import svgPaths from "../public/svg";
import app from "../src/firebaseConfig";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
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

interface Reviewer {
  id: string;
  name: string;
  email?: string;
}

export function UploadScreen({ user, onUpload }: UploadScreenProps) {
  const navigate = useNavigate();
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- new states ---
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<Reviewer[]>([]);
  const [loadingReviewers, setLoadingReviewers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- fetch reviewers from Firestore ---
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const q = query(collection(db, "users"), where("role", "==", "reviewer"));
        const querySnapshot = await getDocs(q);
        const reviewerList = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || "Unnamed Reviewer",
            email: data.email || "",
          };
        });
        setReviewers(reviewerList);
      } catch (error) {
        console.error("Error fetching reviewers:", error);
      } finally {
        setLoadingReviewers(false);
      }
    };

    fetchReviewers();
  }, [db]);

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
    const newFiles: UploadFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const error = validateFile(file);
      newFiles.push({
        file,
        progress: 0,
        status: error ? "error" : "success", // mark as "success" pre-upload-ready
        error,
      });
    }

    setUploadFiles(newFiles);
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
      return;
    }

    if (selectedReviewers.length === 0) {
      alert("Please select at least one reviewer before uploading.");
      return;
    }

    setIsUploading(true);

    for (const uploadFile of validFiles) {
      const file = uploadFile.file;

      try {
        const docRef = doc(collection(db, "resumes"));
        const resumeId = docRef.id;
        const path = `resumes/${resumeId}/${file.name}`;
        const sRef = storageRef(storage, path);
        const task = uploadBytesResumable(sRef, file);

        task.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadFiles((prev) =>
              prev.map((f) => (f.file === file ? { ...f, progress } : f))
            );
          },
          (error) => {
            setUploadFiles((prev) =>
              prev.map((f) =>
                f.file === file
                  ? { ...f, status: "error", error: (error as any)?.message || String(error) }
                  : f
              )
            );
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(sRef);
              const resumeDoc = {
                id: resumeId,
                fileName: file.name,
                studentId: user.id,
                studentName: user.name,
                uploadDate: new Date().toISOString(),
                status: "pending",
                sharedWith: selectedReviewers.map((r) => ({
                  id: r.id,
                  name: r.name,
                  email: r.email || null,
                })),
                sharedWithIds: selectedReviewers.map((r) => r.id), // 👈 ADD THIS LINE
                comments: [] as any[],
                version: 1,
                storagePath: path,
                downloadURL,
              };
              await setDoc(docRef, resumeDoc);
              setUploadFiles((prev) =>
                prev.map((f) =>
                  f.file === file ? { ...f, status: "success", progress: 100 } : f
                )
              );

              const payload: Omit<Resume, "id" | "uploadDate" | "version"> = {
                fileName: file.name,
                studentId: user.id,
                studentName: user.name,
                status: "pending",
                comments: [],
                downloadURL,
                storagePath: path,
              };
              onUpload(payload);
            } catch (err) {
              setUploadFiles((prev) =>
                prev.map((f) =>
                  f.file === file
                    ? { ...f, status: "error", error: (err as any)?.message || "Upload failed" }
                    : f
                )
              );
            }
          }
        );
      } catch (err) {
        console.error("[UploadScreen] unexpected upload setup error", err);
      }
    }

    setIsUploading(false);
    setTimeout(() => navigate("/student"), 1500);
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
    handleFileSelect(e.dataTransfer.files);
  }, []);

  const removeFile = (fileToRemove: File) => {
    setUploadFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const toggleReviewer = (reviewer: Reviewer) => {
    setSelectedReviewers((prev) =>
      prev.some((r) => r.id === reviewer.id)
        ? prev.filter((r) => r.id !== reviewer.id)
        : [...prev, reviewer]
    );
  };

  // Filter reviewers based on search
  const filteredReviewers = reviewers.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={() => navigate("/login")} />

      <div className="px-[79px] pt-[20px] pb-16 ">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => navigate("/student")}
              className="flex items-center gap-2 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>

            <div className="text-center">
              <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-4">
                Upload Resume
              </h1>
              <p className="text-xl text-gray-600">
                Share your resume with career advisors for feedback
              </p>
            </div>
          </div>

          {/* Reviewer Selection Card */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Select Reviewers</h2>

              {loadingReviewers ? (
                <p>Loading reviewers...</p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search reviewers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border rounded px-3 py-2 mb-4 text-sm"
                  />

                  {filteredReviewers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No reviewers found.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
                      {filteredReviewers.map((r) => (
                        <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedReviewers.some((sel) => sel.id === r.id)}
                            onChange={() => toggleReviewer(r)}
                          />
                          <span>{r.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}

              {selectedReviewers.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-1">Selected:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReviewers.map((r) => (
                      <span
                        key={r.id}
                        className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${isDragOver
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
                  className={`px-8 py-3 text-[14px] font-bold uppercase w-full max-w-md transition-colors ${uploadFiles.length > 0 && !isUploading
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-neutral-700 text-white"
                    }`}
                  disabled={isUploading}
                  onClick={() => {
                    if (uploadFiles.length === 0) {
                      document.getElementById("file-input")?.click(); // acts as "Browse"
                    } else {
                      const valid = uploadFiles.filter((f) => !f.error);
                      startUpload(valid); // 👈 manually trigger upload now
                    }
                  }}
                >
                  {uploadFiles.length === 0 ? "Select File(s)" : "Upload Files"}
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
