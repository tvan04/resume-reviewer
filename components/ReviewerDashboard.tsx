// Contributors:
//  Luke Arvey - 2 Hours
//  Ridley Wills - 3 Hours
//  Tristan Van - 3 Hours

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationBar } from "./Navigation";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { User, Resume } from "../src/App";
import { ImageWithFallback } from "./ImageWithFallback";
import app from "../src/firebaseConfig";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
} from "firebase/firestore";

interface ReviewerDashboardProps {
  user: User;
  resumes: Resume[]; // kept for backward compatibility
  onLogout: () => void;
}

export function ReviewerDashboard({ user, resumes: propResumes, onLogout }: ReviewerDashboardProps) {
  const navigate = useNavigate();
  const db = getFirestore(app);

  const [fsResumes, setFsResumes] = useState<Resume[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);

    try {
      const q = query(collection(db, "resumes"), orderBy("uploadDate", "desc"));
      const unsub = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const items: Resume[] = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: data.id ?? d.id,
              fileName: data.fileName ?? "Untitled",
              studentId: data.studentId ?? "",
              studentName: data.studentName ?? "",
              uploadDate: data.uploadDate ?? new Date().toISOString(),
              status: data.status ?? "pending",
              reviewerId: data.reviewerId ?? undefined,
              reviewerName: data.reviewerName ?? undefined,
              comments: (data.comments ?? []) as any[],
              version: data.version ?? 1,
              downloadURL: data.downloadURL,
              storagePath: data.storagePath,
              ...data,
            } as Resume;
          });
          setFsResumes(items);
          setLoading(false);
        },
        (err) => {
          console.error("[ReviewerDashboard] failed to subscribe to resumes", err);
          setFetchError((err as any)?.message || "Failed to load resumes");
          setLoading(false);
        }
      );

      return () => unsub();
    } catch (err) {
      console.error("[ReviewerDashboard] unexpected error fetching resumes", err);
      setFetchError((err as any)?.message || "Failed to load resumes");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const allResumes = fsResumes ?? propResumes ?? [];

  const resumesInProgress = allResumes.filter((r) => r.status === "in-review" && r.reviewerId === user.id);
  const newSubmissions = allResumes.filter((r) => r.status === "pending");
  const approvedResumes = allResumes.filter((r) => r.status === "approved");

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

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading resumes…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={onLogout} />

      <div className="px-[79px] pt-[20px] pb-16">
        <div className="mb-12">
          <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-2">
            Welcome, {user.name}
          </h1>
          <p className="text-[24px] text-[rgba(0,0,0,0.75)] mb-8">All uploaded resumes</p>
        </div>

        {fetchError && <p className="mb-6 text-red-600">Error: {fetchError}</p>}

        {/* Resumes in Progress */}
        {resumesInProgress.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">Resumes in Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumesInProgress.map((resume) => (
                <Card key={resume.id} className="cursor-pointer hover:shadow-lg transition-shadow border border-black" onClick={() => navigate(`/review/${resume.id}`)}>
                  <CardContent className="p-0">
                    <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                      {resume.downloadURL ? (
                        <object data={resume.downloadURL} type="application/pdf" width="100%" height="100%">
                          <ImageWithFallback src="/placeholder-resume.png" alt={resume.fileName} className="w-full h-full object-cover" />
                        </object>
                      ) : (
                        <ImageWithFallback src="/placeholder-resume.png" alt={resume.fileName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-sm truncate">{resume.fileName}</p>
                      <p className="text-xs text-gray-600 mt-1">Student: {resume.studentName}</p>
                      <p className="text-xs text-gray-600">Submitted: {formatDateTime(resume.uploadDate)}</p>
                      <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          In Progress
                        </span>
                      </Badge>
                      {resume.comments.length > 0 && <p className="text-xs text-blue-600 mt-1">{resume.comments.length} comment{resume.comments.length !== 1 ? "s" : ""} added</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Newly Submitted */}
        <section className="mb-16">
          <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">New Submissions</h2>
          {newSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newSubmissions.map((resume) => (
                <Card key={resume.id} className="cursor-pointer hover:shadow-lg transition-shadow border border-black" onClick={() => navigate(`/review/${resume.id}`)}>
                  <CardContent className="p-0">
                    <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                      {resume.downloadURL ? (
                        <object data={resume.downloadURL} type="application/pdf" width="100%" height="100%">
                          <ImageWithFallback src="/placeholder-resume.png" alt={resume.fileName} className="w-full h-full object-cover" />
                        </object>
                      ) : (
                        <ImageWithFallback src="/placeholder-resume.png" alt={resume.fileName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <p className="font-medium text-sm truncate">{resume.fileName}</p>
                      <p className="text-xs text-gray-600 mt-1">Student: {resume.studentName}</p>
                      <p className="text-xs text-gray-600">Submitted: {formatDateTime(resume.uploadDate)}</p>
                      <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(resume.status)}
                          Pending Review
                        </span>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">No new submissions</h3>
              <p className="text-gray-500">New resume submissions will appear here for review.</p>
            </div>
          )}
        </section>

        {/* Approved Resumes */}
        <section>
          <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">Approved Resumes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedResumes.map((resume) => (
              <Card key={resume.id} className="cursor-pointer hover:shadow-lg transition-shadow border border-black" onClick={() => navigate(`/review/${resume.id}`)}>
                <CardContent className="p-0">
                  <div className="h-64 bg-gray-100 border-b border-black flex items-center justify-center">
                    {resume.downloadURL ? (
                      <object data={resume.downloadURL} type="application/pdf" width="100%" height="100%">
                        <ImageWithFallback src="/placeholder-resume.png" alt={resume.fileName} className="w-full h-full object-cover" />
                      </object>
                    ) : (
                      <ImageWithFallback src="/placeholder-resume.png" alt={resume.fileName} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-sm truncate">{resume.fileName}</p>
                    <p className="text-xs text-gray-600 mt-1">Student: {resume.studentName}</p>
                    <p className="text-xs text-gray-600">Submitted: {formatDateTime(resume.uploadDate)}</p>
                    <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(resume.status)}
                        {resume.status === "approved" ? "Approved" : "Reviewed"}
                      </span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}