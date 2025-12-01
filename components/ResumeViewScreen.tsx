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
  X as XIcon,
  Plus as PlusIcon,
  Info as InfoIcon,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { User, Resume } from "../src/App";
import app, { storage } from "../src/firebaseConfig";
import { getFirestore, doc as fsDoc, deleteDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { subscribeToResume, addReplyToComment, toggleCommentResolved } from "./resumeRepo";
import { collection, getDocs, query, where, updateDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const formatDate = (dateValue: any) => {
  if (!dateValue) return "Unknown date";

  const date =
    typeof dateValue === "string"
      ? new Date(dateValue)
      : (dateValue as any).toDate
        ? (dateValue as any).toDate()
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

type BannerType = "success" | "info" | "error";

export function ResumeViewScreen({ user, resumes }: ResumeViewScreenProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const db = getFirestore(app);

  // Firestore-loaded resume
  const [fsResume, setFsResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);

  // per-comment reply inputs
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // Active pin popup (for inline comments)
  const [activePin, setActivePin] = useState<null | {
    id: string;
    text: string;
    x: number;
    y: number;
    resolved?: boolean;
  }>(null);


  // Reviewers directory + UI state (mirrors UploadScreen)
  const [reviewers, setReviewers] = useState<{ id: string; name: string; email?: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  // Replace Resume states
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Tiny banner state
  const [banner, setBanner] = useState<{ type: BannerType; message: string } | null>(null);
  const showBanner = (message: string, type: BannerType = "info", ms = 4000) => {
    setBanner({ type, message });
    window.clearTimeout((showBanner as any)._t);
    (showBanner as any)._t = window.setTimeout(() => setBanner(null), ms);
  };
  const dismissBanner = () => setBanner(null);

  // Fetch reviewers from Firestore (role === 'reviewer')
  useEffect(() => {
    const fetchReviewers = async () => {
      try {
        const qUsers = query(collection(db, "users"), where("role", "==", "reviewer"));
        const querySnapshot = await getDocs(qUsers);
        const reviewerList = querySnapshot.docs.map((docSnap) => {
          const data = docSnap.data() as any;
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

  // Subscribe to this resume doc
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
        setLoadError((err as any)?.message || "Failed to load resume");
        setFsResume(null);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  // fallback to props if Firestore result missing
  const resumeFromProps = useMemo(() => resumes.find((r) => r.id === id), [id, resumes]);
  const resume: Resume | null = fsResume ?? resumeFromProps ?? null;

  // Convenience: set of reviewer IDs who have access
  const sharedIds = (resume?.sharedWithIds ?? []) as string[];

  // Names of reviewers who have access (derived from directory)
  const sharedReviewerNames = useMemo(() => {
    if (!resume || reviewers.length === 0) return [];
    return reviewers.filter((r) => sharedIds.includes(r.id)).map((r) => r.name);
  }, [resume, reviewers, sharedIds]);

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
    if (!newFile || !resume) return;

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

      // update local immediately
      setFsResume({
        ...resume,
        fileName: newFile.name,
        downloadURL: newURL,
        uploadDate: newUploadDate as any,
        version: (resume.version || 1) + 1,
      });

      setNewFile(null);
      showBanner("Resume replaced successfully.", "success");
    } catch (error) {
      console.error("Error replacing resume:", error);
      showBanner("There was an error replacing the resume.", "error", 6000);
    } finally {
      setUploading(false);
    }
  };

  // --- Access Management ---

  const toggleSelectToAdd = (id: string) => {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addSelectedReviewers = async () => {
    if (!resume || selectedToAdd.length === 0) return;
    try {
      const resumeRef = fsDoc(db, "resumes", resume.id);

      // Only add reviewers not already in sharedWithIds
      const toAdd = selectedToAdd.filter((rid) => !sharedIds.includes(rid));
      if (toAdd.length === 0) {
        setSelectedToAdd([]);
        return;
      }

      await updateDoc(resumeRef, {
        sharedWithIds: arrayUnion(...toAdd),
      });

      // local UI update
      setFsResume({
        ...resume,
        sharedWithIds: [...sharedIds, ...toAdd],
      } as any);

      setSelectedToAdd([]);
      showBanner(
        `${toAdd.length} reviewer${toAdd.length === 1 ? "" : "s"} added.`,
        "success"
      );
    } catch (err) {
      console.error("Error adding reviewers:", err);
      showBanner("Failed to add reviewers. Please try again.", "error", 6000);
    }
  };

  const revokeReviewer = async (reviewerId: string, reviewerName?: string) => {
    if (!resume) return;
    try {
      const resumeRef = fsDoc(db, "resumes", resume.id);
      await updateDoc(resumeRef, {
        sharedWithIds: arrayRemove(reviewerId),
      });

      // local UI update
      setFsResume({
        ...resume,
        sharedWithIds: sharedIds.filter((id) => id !== reviewerId),
      } as any);

      showBanner(
        `Access revoked for ${reviewerName || "reviewer"}.`,
        "info"
      );
    } catch (err) {
      console.error("Error revoking reviewer:", err);
      showBanner("Failed to revoke access. Please try again.", "error", 6000);
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
      showBanner("Failed to add reply.", "error", 6000);
    }
  };

  const markResolved = async (commentId: string) => {
    if (!resume) return;
    try {
      await toggleCommentResolved(resume.id, commentId, true);
      showBanner("Comment marked as resolved.", "success");
    } catch {
      showBanner("Failed to mark resolved.", "error", 6000);
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

  const resolvedComments = (resume.comments ?? []).filter((c) => c.resolved);
  const unresolvedComments = (resume.comments ?? []).filter((c) => !c.resolved);

  // Filter directory for Add UI: show all reviewers, but visually mark ones who already have access
  const filteredReviewers = reviewers.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {getStatusMessage(resume.status)}{" "}
            {sharedReviewerNames.length > 0 && (
              <span>
                Shared with: <strong>{sharedReviewerNames.join(", ")}</strong>
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
                  <div className="relative bg-gray-100 rounded-lg max-h-[800px] overflow-auto">

                    {/* PDF Viewer */}
                    <object
                      data={resume.downloadURL}
                      type="application/pdf"
                      width="100%"
                      height="1200px"
                      className="pointer-events-none"
                      style={{ zIndex: 1, position: "relative" }}
                    />

                    {/* INLINE PINS FROM REVIEWERS */}
                    {resume.comments
                      .filter((c) => typeof c.x === "number" && typeof c.y === "number")
                      .map((c) => {
                        const pinColor = c.resolved ? "bg-green-600" : "bg-red-600";
                        const x = c.x as number;
                        const y = c.y as number;

                        return (
                          <div
                            key={c.id}
                            style={{
                              position: "absolute",
                              top: y,
                              left: x,
                              transform: "translate(-50%, -50%)",
                              zIndex: 999999,
                            }}
                          >
                            <button
                              type="button"
                              className="group absolute -top-3 -left-3 w-6 h-6 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePin({
                                  id: c.id,
                                  text: c.text,
                                  x,
                                  y,
                                  resolved: c.resolved,
                                });
                              }}
                            >
                              <div
                                className={`
                                  w-3 h-3 rounded-full ${pinColor} shadow-md
                                  transition-all
                                  group-hover:scale-125
                                  group-hover:ring-2
                                  group-hover:ring-black/40
                                `}
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                }}
                              />
                            </button>
                          </div>
                        );
                      })}

                      {/* PIN POPUP (student + reviewer view) */}
                      {activePin && (
                        <div
                          className="absolute bg-white border shadow-xl rounded-md p-3 w-64 z-[1000000]"
                          style={{
                            top: activePin.y,
                            left: activePin.x + 40, // offset slightly to the right of the pin
                            transform: "translate(-50%, -50%)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Close (X) */}
                          <button
                            className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                            onClick={() => setActivePin(null)}
                          >
                            ✕
                          </button>

                          {/* Text description */}
                          <p className="text-sm mb-4 pr-5">{activePin.text}</p>

                          {/* Resolve button (students only, and only if not already resolved) */}
                          {user.type === "student" && !activePin.resolved && (
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await markResolved(activePin.id);
                                  setActivePin(null);
                                }}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolve
                              </Button>
                            </div>
                          )}

                          {/* If already resolved, just show a note */}
                          {activePin.resolved && (
                            <p className="text-xs text-green-600 font-medium mt-2">
                              This comment has been marked as resolved.
                            </p>
                          )}
                        </div>
                      )}
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

                {/* Replace Resume (student only) */}
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

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Feedback ({(resume.comments ?? []).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(resume.comments ?? []).length > 0 ? (
                  <div className="space-y-4">
                    {unresolvedComments.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-red-600 mb-3">
                          Action Required ({unresolvedComments.length})
                        </h4>
                        {unresolvedComments.map((comment: any) => (
                          <div key={comment.id} className="border-l-4 border-red-200 pl-4 mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                  <UserIcon className="w-3 h-3" />
                                  {comment.authorName}
                                </p>
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
                              {(comment.replies ?? []).map((reply: any) => (
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
                        <h4 className="font-medium text-sm text-green-600 mb-3">
                          Resolved ({resolvedComments.length})
                        </h4>
                        {resolvedComments.map((comment: any) => (
                          <div key={comment.id} className="border-l-2 border-green-200 pl-4 mb-4 opacity-75">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm flex items-center gap-2">
                                  <UserIcon className="w-3 h-3" />
                                  {comment.authorName}
                                </p>
                                <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Resolved
                              </Badge>
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

            {/* Manage Access (student only) */}
            {user.type === "student" && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tiny banner for success/error/info */}
                  {banner && (
                    <div
                      className={[
                        "flex items-start justify-between gap-3 rounded-md p-3 text-sm border",
                        banner.type === "success" ? "bg-green-50 border-green-200 text-green-800" :
                          banner.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
                            "bg-blue-50 border-blue-200 text-blue-800",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        <InfoIcon className="w-4 h-4 mt-[2px]" />
                        <span>{banner.message}</span>
                      </div>
                      <button
                        aria-label="Dismiss"
                        className="opacity-70 hover:opacity-100"
                        onClick={dismissBanner}
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Current Access */}
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Current reviewers</p>
                    {sharedIds.length === 0 ? (
                      <p className="text-sm text-gray-500">No reviewers have access yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {reviewers
                          .filter((r) => sharedIds.includes(r.id))
                          .map((r) => (
                            <span
                              key={r.id}
                              className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                            >
                              {r.name}
                              <button
                                aria-label={`Revoke ${r.name}`}
                                title={`Revoke ${r.name}`}
                                className="hover:text-blue-900"
                                onClick={() => {
                                  // Confirm alert before revoking (disruptive action)
                                  if (window.confirm(`Remove ${r.name}'s access to this resume?`)) {
                                    revokeReviewer(r.id, r.name);
                                  }
                                }}
                              >
                                <XIcon className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Add Reviewers */}
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium text-gray-600 mb-2">Add reviewers</p>
                    <input
                      type="text"
                      placeholder="Search reviewers…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm mb-3"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                      {filteredReviewers.length === 0 ? (
                        <p className="text-sm text-gray-500">No reviewers found.</p>
                      ) : (
                        filteredReviewers.map((r) => {
                          const alreadyHasAccess = sharedIds.includes(r.id);
                          return (
                            <label
                              key={r.id}
                              className={`flex items-center gap-2 cursor-pointer ${alreadyHasAccess ? "opacity-60" : ""}`}
                              title={alreadyHasAccess ? "Already has access" : ""}
                            >
                              <input
                                type="checkbox"
                                disabled={alreadyHasAccess}
                                checked={selectedToAdd.includes(r.id)}
                                onChange={() => toggleSelectToAdd(r.id)}
                              />
                              <span>{r.name}</span>
                              {alreadyHasAccess && (
                                <span className="text-[10px] text-gray-500">(has access)</span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>
                    <Button
                      className="mt-3 w-full"
                      onClick={addSelectedReviewers}
                      disabled={selectedToAdd.length === 0}
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Selected
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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