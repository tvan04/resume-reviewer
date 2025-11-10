// Contributors:
//  Luke Arvey - 5 Hours
//  Ridley Wills - 5 Hours
//  Tristan Van - 5 Hours

import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NavigationBar } from "./Navigation";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
  ArrowLeft,
  Download,
  Printer,
  Share2,
  AlertCircle,
  User as UserIcon,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { User, Resume } from "../src/App";
import app, { storage } from "../src/firebaseConfig";
import { getFirestore, doc as fsDoc, deleteDoc } from "firebase/firestore";
import { subscribeToResume, addReplyToComment, toggleCommentResolved } from "./resumeRepo";
import { collection, getDocs, query, where, updateDoc, onSnapshot, doc, Timestamp } from "firebase/firestore";
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";



const formatDate = (dateValue: any) => {
  if (!dateValue) return "Unknown date";

  const date =
    typeof dateValue === "string"
      ? new Date(dateValue)
      : dateValue.toDate
      ? dateValue.toDate()
      : new Date(dateValue);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusIcon = (status: Resume["status"]) => {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />;
    case "in-review":
      return <AlertCircle className="w-4 h-4" />;
    case "reviewed":
    case "approved":
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStatusColor = (status: Resume["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in-review":
      return "bg-blue-100 text-blue-800";
    case "reviewed":
    case "approved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusMessage = (status: Resume["status"]) => {
  switch (status) {
    case "pending":
      return "Your resume is pending review.";
    case "in-review":
      return "Your resume is currently being reviewed.";
    case "reviewed":
      return "Your resume has been reviewed and is awaiting approval.";
    case "approved":
      return "Your resume has been approved!";
    default:
      return "Status unavailable.";
  }
};

interface ResumeViewScreenProps {
  user: User;
  resumes: Resume[]; // still accepted for fallback
}

export function ResumeViewScreen({ user, resumes }: ResumeViewScreenProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const db = getFirestore(app);

  // try to load resume from Firestore by id; fall back to props list
  const [fsResume, setFsResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);

  // per-comment reply inputs
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [reviewers, setReviewers] = useState<{ id: string; name: string }[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  // Replace Resume states
const [newFile, setNewFile] = useState<File | null>(null);
const [uploading, setUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);


  // Fetch reviewers from Firestore
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
      }
    };

    fetchReviewers();
  }, [db]);



  // Existing resume subscription 
  useEffect(() => {
    if (!id) {
      setFsResume(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const unsub = subscribeToResume(
      id,
      (loaded) => {
        setFsResume(loaded);
        setLoading(false);
      },
      (err) => {
        console.error("[ResumeViewScreen] failed to subscribe", err);
        setLoadError(err);
        setFsResume(null);
        setLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  // fallback: find resume from passed props if Firestore result missing
  const resumeFromProps = useMemo(() => resumes.find((r) => r.id === id), [id, resumes]);

  const resume: Resume | null = fsResume ?? resumeFromProps ?? null;

  // Get names of reviewers who have access
  const sharedReviewerNames = useMemo(() => {
    const sharedIds = resume?.sharedWithIds ?? [];
    if (sharedIds.length === 0 || reviewers.length === 0) return [];
    return reviewers
      .filter((r) => sharedIds.includes(r.id))
      .map((r) => r.name);
  }, [resume?.sharedWithIds, reviewers]);



  const go = (path: string) => navigate(path);

  const deleteResume = async () => {
    if (!resume || !resume.id) return;

    if (window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      try {
        await deleteDoc(fsDoc(db, "resumes", resume.id));
        alert("Resume deleted successfully.");
        go("/student");
      } catch (error) {
        console.error("[ResumeViewScreen] failed to delete resume", error);
        alert("Failed to delete resume. Please try again.");
      }
    }
  };

const handleReplaceResume = async () => {
  if (!newFile) return;
  if (!resume) return;

  if (newFile.type !== "application/pdf") {
    alert("Please upload a PDF file.");
    return;
  }
  if (newFile.size > 5 * 1024 * 1024) {
    alert("File must be less than 5 MB.");
    return;
  }

  try {
    setUploading(true);
    setUploadProgress(0);

    const storageRef = ref(storage, `resumes/${resume.id}/${newFile.name}`);
    const uploadTask = await uploadBytes(storageRef, newFile);
    const newURL = await getDownloadURL(uploadTask.ref);

    const resumeRef = fsDoc(db, "resumes", resume.id);
    const newUploadDate = Timestamp.now();

    await updateDoc(resumeRef, {
      fileName: newFile.name,
      downloadURL: newURL,
      uploadDate: newUploadDate,
      version: (resume.version || 1) + 1,
    });

    // Update local state instead of reloading
    setFsResume({
      ...resume,
      fileName: newFile.name,
      downloadURL: newURL,
      uploadDate: newUploadDate,
      version: (resume.version || 1) + 1,
    });

    setNewFile(null);
    alert("Resume replaced successfully!");
  } catch (error) {
    console.error("Error replacing resume:", error);
    alert("There was an error replacing the resume. Please try again.");
  } finally {
    setUploading(false);
  }
};



const assignReviewer = async () => {
  if (!resume || !selectedReviewer) return;

  try {
    const chosenReviewer = reviewers.find((r) => r.id === selectedReviewer);
    if (!chosenReviewer) return;

    const resumeRef = fsDoc(db, "resumes", resume.id);

    // 🔹 Add this reviewer to sharedWithIds (if not already there)
    await updateDoc(resumeRef, {
      sharedWithIds: arrayUnion(chosenReviewer.id),
    });

    // 🔹 Optionally update reviewer display name for UI purposes
    await updateDoc(resumeRef, {
      reviewerName: chosenReviewer.name,
    });

    alert(`Added ${chosenReviewer.name} as a reviewer.`);

    // Update local UI instantly
    setFsResume({
      ...resume,
      reviewerName: chosenReviewer.name,
      sharedWithIds: [...(resume.sharedWithIds || []), chosenReviewer.id],
    });
  } catch (error) {
    console.error("Error assigning reviewer:", error);
    alert("Failed to assign reviewer. Please try again.");
  }
};


  const handleReplyChange = (commentId: string, text: string) => {
    setReplyInputs((s) => ({ ...s, [commentId]: text }));
  };

  const handleReply = async (commentId: string) => {
    const text = replyInputs[commentId]?.trim();
    if (!resume || !text) return;
    try {
      await addReplyToComment(resume.id, commentId, {
        text,
        authorId: user.id,
        authorName: user.name,
      });
      setReplyInputs((s) => ({ ...s, [commentId]: "" }));
    } catch {
      alert("Failed to add reply");
    }
  };

  const markResolved = async (commentId: string) => {
    if (!resume) return;
    try {
      await toggleCommentResolved(resume.id, commentId, true);
    } catch {
      alert("Failed to mark resolved");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading resume…</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Resume not found.</p>
        {loadError && <p className="text-sm text-red-600 mt-2">{loadError}</p>}
        <Button onClick={() => go("/student")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const resolvedComments = resume.comments.filter((c) => c.resolved);
  const unresolvedComments = resume.comments.filter((c) => !c.resolved);

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={() => go("/login")} />

      <div className="px-[79px] pt-[20px] pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="mb-8">
            <div className="mb-4">
              <Button
                variant="outline"
                onClick={() => (user.type === "reviewer" ? go("/reviewer") : go("/student"))}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-black">{resume.fileName}</h1>
                <p className="text-lg text-gray-600">Uploaded {formatDate(resume.uploadDate)}</p>
              </div>

              <Badge className={`${getStatusColor(resume.status)} flex items-center gap-1`}>
                {getStatusIcon(resume.status)}
                {resume.status.charAt(0).toUpperCase() + resume.status.slice(1).replace("-", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Status Alert */}
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {getStatusMessage(resume.status)}
              {sharedReviewerNames.length > 0 && (
                <span>
                  {" "}
                  Shared with:{" "}
                  <strong>{sharedReviewerNames.join(", ")}</strong>
                </span>
              )}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resume Preview
                  </CardTitle>
                  <div className="flex gap-2">
                    {resume.downloadURL ? (
                      <>
                        <a href={resume.downloadURL} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </a>
                        <a href={resume.downloadURL} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm">
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </Button>
                        </a>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard?.writeText(resume.downloadURL)}
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                        {user.type === "student" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={deleteResume}
                          >
                            Delete Resume
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button variant="outline" size="sm">
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </Button>
                        <Button variant="outline" size="sm">
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                        {user.type === "student" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={deleteResume}
                          >
                            Delete Resume
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resume.downloadURL ? (
                  <div className="bg-gray-100 min-h-[800px] rounded-lg overflow-hidden">
                    <object
                      data={resume.downloadURL}
                      type="application/pdf"
                      width="100%"
                      height="800"
                      aria-label={resume.fileName}
                    >
                      <div className="p-6 text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          Your browser does not support inline PDFs.{" "}
                          <a href={resume.downloadURL} target="_blank" rel="noreferrer" className="underline">
                            Open the resume in a new tab
                          </a>
                          .
                        </p>
                      </div>
                    </object>
                  </div>
                ) : (
                  <div className="bg-gray-100 min-h-[800px] rounded-lg flex items-center justify-center">
                    <ImageWithFallback
                      src="/placeholder-resume-full.png"
                      alt={resume.fileName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                {/* Replace Resume Section (visible to student only) */}
                {user.type === "student" && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">Replace Resume</h3>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => document.getElementById("replaceFileInput")?.click()}
                        >
                          Browse for File
                        </Button>
                        {newFile && <span className="text-sm text-gray-700 truncate">{newFile.name}</span>}
                      </div>

                      <input
                        id="replaceFileInput"
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
                        className="hidden"
                      />
                      <Button
                        disabled={!newFile || uploading}
                        onClick={handleReplaceResume}
                        className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {uploading ? `Uploading... ${uploadProgress}%` : "Replace Resume"}
                      </Button>
                    </div>

                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Resume Info */}
            <Card>
              <CardHeader>
                <CardTitle>Resume Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">File Name</p>
                  <p className="text-sm">{resume.fileName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge className={`${getStatusColor(resume.status)} text-xs`}>
                    {resume.status.charAt(0).toUpperCase() + resume.status.slice(1).replace("-", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Uploaded</p>
                  <p className="text-sm">{formatDate(resume.uploadDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Version</p>
                  <p className="text-sm">v{resume.version}</p>
                </div>
                {sharedReviewerNames.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Shared With</p>
                    <p className="text-sm">{sharedReviewerNames.join(", ")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ Select Reviewer Section */}
            {user.type === "student" && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Reviewer</CardTitle>
                </CardHeader>
                <CardContent>
                  {reviewers.length > 0 ? (
                    <select
                      className="w-full border rounded p-2 text-sm"
                      value={selectedReviewer}
                      onChange={(e) => setSelectedReviewer(e.target.value)}
                    >
                      <option value="">-- Choose a Reviewer --</option>
                      {reviewers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">No reviewers available.</p>
                  )}

                  <Button
                    className="mt-3 w-full"
                    onClick={assignReviewer}
                    disabled={!selectedReviewer}
                  >
                    Assign Reviewer
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Feedback ({resume.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resume.comments.length > 0 ? (
                  <div className="space-y-4">
                    {unresolvedComments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-red-600 mb-3">Action Required ({unresolvedComments.length})</h4>
                        {unresolvedComments.map((comment) => (
                          <div key={comment.id} className="border-l-4 border-red-200 pl-4 mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2"><UserIcon className="w-3 h-3" />{comment.authorName}</p>
                                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                              </div>
                              {user.type === "student" && (
                                <Button variant="outline" size="sm" onClick={() => markResolved(comment.id)}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Mark Resolved
                                </Button>
                              )}
                            </div>
                            <p className="text-sm mb-3 bg-red-50 p-3 rounded">{comment.text}</p>

                            <div className="ml-4 space-y-2 border-l border-gray-200 pl-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="bg-blue-50 p-2 rounded">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-xs">{reply.authorName}</p>
                                    <p className="text-xs text-gray-500">{formatDate(reply.createdAt)}</p>
                                  </div>
                                  <p className="text-sm">{reply.text}</p>
                                </div>
                              ))}

                              {user.type === "student" && (
                                <div className="flex items-start gap-2">
                                  <textarea
                                    className="w-full border rounded p-2 text-sm"
                                    rows={2}
                                    placeholder="Write a reply..."
                                    value={replyInputs[comment.id] || ""}
                                    onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                                  />
                                  <Button variant="outline" size="sm" onClick={() => handleReply(comment.id)}>
                                    <Send className="w-3 h-3 mr-1" /> Reply
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {resolvedComments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-green-600 mb-3">Resolved ({resolvedComments.length})</h4>
                        {resolvedComments.map((comment) => (
                          <div key={comment.id} className="border-l-2 border-green-200 pl-4 mb-4 opacity-75">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2"><UserIcon className="w-3 h-3" />{comment.authorName}</p>
                                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs"><CheckCircle className="w-3 h-3 mr-1" />Resolved</Badge>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No feedback yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Version History */}
            <Card>
              <CardHeader>
                <CardTitle>Version History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div>
                      <p className="text-sm font-medium">v{resume.version} (Current)</p>
                      <p className="text-xs text-gray-600">{formatDate(resume.uploadDate)}</p>
                    </div>
                    <Badge variant="secondary">Latest</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}