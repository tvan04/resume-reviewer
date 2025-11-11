import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationBar } from "./Navigation";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { User, Resume } from "../src/App";
import { ImageWithFallback } from "./ImageWithFallback";
import app from "../src/firebaseConfig";
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

interface StudentDashboardProps {
  user: User;
  resumes: Resume[]; // kept for backward compatibility; Firestore results take precedence
}

export function StudentDashboard({
  user,
  resumes: propResumes,
}: StudentDashboardProps) {
  const navigate = useNavigate();
  const db = getFirestore(app);

  const [fsResumes, setFsResumes] = useState<Resume[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // notification: count unresolved comments across student's resumes
  const [unresolvedCommentsCount, setUnresolvedCommentsCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnresolvedCommentsCount(0);
      return;
    }

    const q = query(
      collection(db, "resumes"),
      where("studentId", "==", user.id)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let count = 0;
        snapshot.docs.forEach((d) => {
          const data = d.data() as any;
          const comments = Array.isArray(data.comments) ? data.comments : [];
          comments.forEach((c: any) => {
            if (!c.resolved) count += 1;
          });
        });
        setUnresolvedCommentsCount(count);
      },
      () => setUnresolvedCommentsCount(0)
    );
    return () => {
      if (typeof unsub === "function") {
        unsub();
      } else if (unsub && typeof (unsub as any).unsubscribe === "function") {
        (unsub as any).unsubscribe();
      }
    };
  }, [db, user?.id]);

  useEffect(() => {
    if (!user || !user.id) {
      setFsResumes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      // query resumes for the current student, newest first
      const q = query(
        collection(db, "resumes"),
        where("studentId", "==", user.id)
      );

      const unsub = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const items: Resume[] = snapshot.docs.map((doc) => {
            const data = doc.data() as any;
            return {
              id: data.id ?? doc.id,
              fileName: data.fileName ?? "Untitled",
              studentId: data.studentId ?? user.id,
              studentName: data.studentName ?? user.name,
              uploadDate: data.uploadDate ?? new Date().toISOString(),
              status: data.status ?? "pending",
              reviewerId: data.reviewerId ?? undefined,
              reviewerName: data.reviewerName ?? undefined,
              comments: (data.comments ?? []) as any[],
              version: data.version ?? 1,
              // keep any extra fields for downstream usage
              ...data,
            } as Resume;
          });
          setFsResumes(items);
          setLoading(false);
        },
        (err) => {
          console.error(
            "[StudentDashboard] failed to subscribe to resumes",
            err
          );
          setFetchError((err as any)?.message || "Failed to load resumes");
          setLoading(false);
        }
      );
      return () => {
        if (typeof unsub === "function") {
          unsub();
        } else if (unsub && typeof (unsub as any).unsubscribe === "function") {
          (unsub as any).unsubscribe();
        }
      };
    } catch (err) {
      console.error(
        "[StudentDashboard] unexpected error fetching resumes",
        err
      );
      setFetchError((err as any)?.message || "Failed to load resumes");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, user?.id]);

  const getStatusIcon = (status: Resume["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in-review":
        return <AlertCircle className="w-4 h-4" />;
      case "reviewed":
        return <CheckCircle className="w-4 h-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getUnresolvedCount = (r: Resume) =>
    (r.comments ?? []).filter((c: any) => !c.resolved).length;

  // Prefer Firestore results if available, otherwise fall back to prop
  const allResumes = fsResumes ?? propResumes ?? [];

  const yourResumes = allResumes.filter((r) => r.status === "pending");
  const submittedResumes = allResumes.filter((r) => r.status === "in-review");
  const reviewedResumes = allResumes.filter((r) =>
    ["reviewed", "approved"].includes(r.status)
  );

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={() => navigate("/login")} />

      <div className="px-[79px] pt-[20px] pb-16">
        {/* Welcome Section */}
        <div className="mb-12">
          {unresolvedCommentsCount > 0 && (
            <div className="mb-6 p-4 rounded bg-red-50 border border-red-100 text-sm flex items-center justify-between">
              <div>
                <strong className="mr-2">Action required:</strong>
                You have {unresolvedCommentsCount} unresolved comment{unresolvedCommentsCount !== 1 ? "s" : ""} — please review and respond.
              </div>
            </div>
          )}
          <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-6">
            Welcome, {user.name}
          </h1>

          <div className="flex gap-4 mb-8">
            <Button
              variant="default"
              onClick={() => navigate("/upload")}
              className="px-6 py-3 text-2xl"
            >
              Build Resume from Template
            </Button>
            <Button
              variant="secondary"
              className="bg-[#e6e6e6] text-black px-6 py-3 text-2xl"
            >
              Print Uploaded Resume
            </Button>
          </div>
        </div>

        {/* optional loading / error */}
        {loading && <p className="mb-6 text-gray-500">Loading your resumes…</p>}
        {fetchError && <p className="mb-6 text-red-600">Error: {fetchError}</p>}

        {/* Your Resumes Section */}
        <section className="mb-16">
          <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
            Your Resumes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yourResumes.map((resume) => {
              const unresolved = getUnresolvedCount(resume);
              return (
                <Card
                  key={resume.id}
                  className="relative cursor-pointer hover:shadow-lg transition-shadow border border-black"
                  onClick={() => navigate(`/resume/${resume.id}`)}
                >
                  <CardContent className="p-0">
                    {unresolved > 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold"
                          aria-label={`${unresolved} unresolved comment${unresolved !== 1 ? "s" : ""}`}
                        >
                          {unresolved > 9 ? "9+" : unresolved}
                        </span>
                      </div>
                    )}
                    <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                      {resume.downloadURL ? (
                        <object
                          data={resume.downloadURL}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                        >
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={resume.fileName}
                            className="w-full h-full object-cover"
                          />
                        </object>
                      ) : (
                        <ImageWithFallback
                          src="/placeholder-resume.png"
                          alt={resume.fileName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-sm truncate">
                        {resume.fileName}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formatDate(
                          typeof resume.uploadDate === 'string'
                            ? resume.uploadDate
                            : resume.uploadDate?.toDate?.().toISOString() ?? ''
                        )
                        }
                      </p>
                      <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          {resume.status.charAt(0).toUpperCase() +
                            resume.status.slice(1).replace("-", " ")}
                        </span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Upload New Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border border-black border-dashed"
              onClick={() => navigate("/upload")}
            >
              <CardContent className="p-0">
                <div className="h-64 border-b border-black border-dashed flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-black">
                      Upload New
                    </h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium text-sm text-center">
                    Add New Resume
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Submitted For Review Section */}
        {submittedResumes.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Submitted For Review
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submittedResumes.map((resume) => {
                const unresolved = getUnresolvedCount(resume);
                return (
                  <Card
                    key={resume.id}
                    className="relative cursor-pointer hover:shadow-lg transition-shadow border border-black"
                    onClick={() => navigate(`/resume/${resume.id}`)}
                  >
                    <CardContent className="p-0">
                      {unresolved > 0 && (
                        <div className="absolute top-3 right-3 z-10">
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold"
                            aria-label={`${unresolved} unresolved comment${unresolved !== 1 ? "s" : ""}`}
                          >
                            {unresolved > 9 ? "9+" : unresolved}
                          </span>
                        </div>
                      )}
                      <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                        {resume.downloadURL ? (
                          <object
                            data={resume.downloadURL}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                          >
                            <ImageWithFallback
                              src="/placeholder-resume.png"
                              alt={resume.fileName}
                              className="w-full h-full object-cover"
                            />
                          </object>
                        ) : (
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={resume.fileName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-sm truncate">
                          {resume.fileName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Reviewer: {resume.reviewerName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(
                            typeof resume.uploadDate === 'string'
                              ? resume.uploadDate
                              : resume.uploadDate?.toDate?.().toISOString() ?? ''
                          )
                          }
                        </p>
                        <Badge
                          className={`mt-2 ${getStatusColor(resume.status)}`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(resume.status)}
                            In Review
                          </span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Reviewed Resumes Section */}
        {reviewedResumes.length > 0 && (
          <section>
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Reviewed Resumes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewedResumes.map((resume) => (
                <Card
                  key={resume.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow border border-black"
                  onClick={() => navigate(`/resume/${resume.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                      {resume.downloadURL ? (
                        <object
                          data={resume.downloadURL}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                        >
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={resume.fileName}
                            className="w-full h-full object-cover"
                          />
                        </object>
                      ) : (
                        <ImageWithFallback
                          src="/placeholder-resume.png"
                          alt={resume.fileName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-sm truncate">
                        {resume.fileName}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Reviewed by: {resume.reviewerName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(
                          typeof resume.uploadDate === 'string'
                            ? resume.uploadDate
                            : resume.uploadDate?.toDate?.().toISOString() ?? ''
                        )
                        }
                      </p>
                      <Badge
                        className={`mt-2 ${getStatusColor(resume.status)}`}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          {resume.status === "approved"
                            ? "Approved"
                            : "Reviewed"}
                        </span>
                      </Badge>
                      {resume.comments.length > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {resume.comments.length} comment
                          {resume.comments.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}