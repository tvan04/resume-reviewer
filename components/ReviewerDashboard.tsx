// Contributors:
//  Luke Arvey - 2 Hours
//  Ridley Wills - 3 Hours
//  Tristan Van - 3 Hours

<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from './Navigation';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
=======
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationBar } from "./Navigation";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  MoreHorizontal,
  Share2,
  Download,
  Printer,
<<<<<<< HEAD
} from 'lucide-react';
import { User, Resume } from '../src/App';
import { ImageWithFallback } from './ImageWithFallback';
import app from '../src/firebaseConfig';
=======
} from "lucide-react";
import { User, Resume } from "../src/App";
import { ImageWithFallback } from "./ImageWithFallback";
import app from "../src/firebaseConfig";
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  where,
} from 'firebase/firestore';

interface ReviewerDashboardProps {
  user: User;
  resumes: Resume[];
  onLogout: () => void;
}

export function ReviewerDashboard({
  user,
  resumes: propResumes,
  onLogout,
}: ReviewerDashboardProps) {
  const navigate = useNavigate();
  const db = getFirestore(app);

  const [fsResumes, setFsResumes] = useState<Resume[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
<<<<<<< HEAD

  // notification: count pending / in-review resumes shared with this reviewer
  const [awaitingReviewCount, setAwaitingReviewCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setAwaitingReviewCount(0);
      return;
    }

    const q = query(
      collection(db, 'resumes'),
      where('sharedWithIds', 'array-contains', user.id)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let count = 0;
        snapshot.docs.forEach((d) => {
          const data = d.data() as any;
          const status = data.status ?? 'pending';
          if (status === 'pending' || status === 'in-review') count += 1;
        });
        setAwaitingReviewCount(count);
      },
      () => setAwaitingReviewCount(0)
    );

    return () => {
      if (typeof unsub === 'function') {
        unsub();
      } else if (unsub && typeof (unsub as any).unsubscribe === 'function') {
        (unsub as any).unsubscribe();
      }
    };
  }, [db, user?.id]);
=======
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c

  useEffect(() => {
    setLoading(true);
    setFetchError(null);

    try {
      const q = query(
<<<<<<< HEAD
        collection(db, 'resumes'),
        where('sharedWithIds', 'array-contains', user.id),
        orderBy('uploadDate', 'desc')
=======
        collection(db, "resumes"),
        where("sharedWithIds", "array-contains", user.id),
        orderBy("uploadDate", "desc")
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
      );

      const unsub = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          const items: Resume[] = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: data.id ?? d.id,
              fileName: data.fileName ?? 'Untitled',
              studentId: data.studentId ?? '',
              studentName: data.studentName ?? '',
              uploadDate: data.uploadDate ?? new Date().toISOString(),
              status: data.status ?? 'pending',
              reviewerId: data.reviewerId ?? undefined,
              reviewerName: data.reviewerName ?? undefined,
              comments: (data.comments ?? []) as any[],
              version: data.version ?? 1,
              downloadURL: data.downloadURL,
              storagePath: data.storagePath,
              sharedWithIds: data.sharedWithIds ?? [],
              ...data,
            } as Resume;
          });
          setFsResumes(items);
          setLoading(false);
        },
        (err) => {
          console.error('[ReviewerDashboard] failed to subscribe to resumes', err);
          setFetchError((err as any)?.message || 'Failed to load resumes');
          setLoading(false);
        }
      );
      return () => {
        if (typeof unsub === 'function') {
          unsub();
        } else if (unsub && typeof (unsub as any).unsubscribe === 'function') {
          (unsub as any).unsubscribe();
        }
      };
    } catch (err) {
      console.error('[ReviewerDashboard] unexpected error fetching resumes', err);
      setFetchError((err as any)?.message || 'Failed to load resumes');
      setLoading(false);
    }
  }, [db, user.id]);

  const allResumes = fsResumes ?? propResumes ?? [];

  const newSubmissions = allResumes.filter(
    (r) => r.status === 'pending' && r.sharedWithIds?.includes(user.id)
  );

  const resumesInProgress = allResumes.filter(
    (r) => r.status === 'in-review' && r.sharedWithIds?.includes(user.id)
  );

  const reviewedResumes = allResumes.filter(
    (r) => r.status === 'reviewed' && r.sharedWithIds?.includes(user.id)
  );

  const approvedResumes = allResumes.filter(
<<<<<<< HEAD
    (r) => r.status === 'approved' && r.sharedWithIds?.includes(user.id)
=======
    (r) => r.status === "approved" && r.sharedWithIds?.includes(user.id)
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
  );

  const getStatusIcon = (status: Resume['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'in-review':
        return <AlertCircle className="w-4 h-4" />;
      case 'reviewed':
        return <CheckCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-review':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleCopy = async (url?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      alert('Could not copy link');
    }
  };

  const handleDownload = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = (url?: string) => {
    if (!url) return;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    w?.print?.();
  };

  const needsReviewFor = (r: Resume) =>
    r.status === 'pending' || r.status === 'in-review';

  const getCommentCount = (r: Resume) => (r.comments ?? []).length;

  const handleCopy = async (url?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      alert('Could not copy link');
    }
  };

  const handleDownload = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = (url?: string) => {
    if (!url) return;
    const w = window.open(url, '_blank', 'noopener,noreferrer');
    w?.print?.();
  };

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={onLogout} />

      <div className="px-[79px] pt-[20px] pb-16">
        <div className="mb-12">
          {awaitingReviewCount > 0 && (
            <div className="mb-6 p-4 rounded bg-yellow-50 border border-yellow-100 text-sm flex items-center justify-between">
              <div>
                <strong className="mr-2">New submissions:</strong>
                {awaitingReviewCount} resume
                {awaitingReviewCount !== 1 ? 's' : ''} need your review.
              </div>
            </div>
          )}
          <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-2">
            Welcome, {user.name}
          </h1>
          <p className="text-[24px] text-[rgba(0,0,0,0.75)] mb-8">
            All uploaded resumes
          </p>
        </div>

        {loading && <p className="mb-6 text-gray-500">Loading resumes…</p>}
        {fetchError && <p className="mb-6 text-red-600">Error: {fetchError}</p>}

        {/* Resumes in Progress */}
        {resumesInProgress.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Resumes in Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumesInProgress.map((resume, idx) => {
                const uniqueKey = `in-progress-${resume.id}-${idx}`;
<<<<<<< HEAD
                const needs = needsReviewFor(resume);
                const comments = getCommentCount(resume);
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black overflow-visible">
                    {needs && (
                      <div className="absolute top-3 right-3 z-10">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold"
                          aria-label="Needs review"
                        >
                          !
                        </span>
                      </div>
                    )}
                    {comments > 0 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span
                          className="inline-flex items-center justify-center min-w-[22px] h-6 px-1 rounded-full bg-blue-600 text-white text-xs font-semibold"
                          aria-label={`${comments} comment${comments !== 1 ? 's' : ''}`}
                        >
                          {comments > 9 ? '9+' : comments}
                        </span>
                      </div>
                    )}
=======
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black overflow-visible">
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('.action-zone')) return;
                        navigate(`/review/${resume.id}`);
                      }}
                    />
                    <CardContent className="p-0 overflow-shown rounded-xl">
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        {resume.downloadURL ? (
                          <embed
                            src={`${resume.downloadURL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="w-full h-full pointer-events-none"
                          />
                        ) : (
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={resume.fileName}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-white/95" />
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-white/95" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-2 bg-white/95" />
                      </div>
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{resume.fileName}</p>
                          <p className="text-xs text-gray-600 mt-1">Student: {resume.studentName}</p>
                          <p className="text-xs text-gray-600">
<<<<<<< HEAD
                            Submitted: {formatDateTime(
                              typeof resume.uploadDate === 'string'
                                ? resume.uploadDate
                                : resume.uploadDate?.toDate?.().toISOString() ?? ''
                            )}
=======
                            Submitted: {formatDateTime(resume.uploadDate)}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                          </p>
                          <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(resume.status)}
<<<<<<< HEAD
                              In Progress
                            </span>
                          </Badge>
                          {comments > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              {comments} comment{comments !== 1 ? 's' : ''} added
                            </p>
                          )}
=======
                              {resume.status === 'approved'
                                ? 'Approved'
                                : resume.status === 'reviewed'
                                  ? 'Reviewed'
                                  : resume.status === 'in-review'
                                    ? 'In Progress'
                                    : 'Pending Review'}
                            </span>
                          </Badge>
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                        </div>
                        <div className="relative z-20 flex items-center gap-2 shrink-0 action-zone">
                          <div className="relative">
                            <button
                              aria-label="More actions"
                              className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === uniqueKey ? null : uniqueKey);
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === uniqueKey && (
                              <div
                                className="absolute right-0 top-full mt-1 w-44 rounded border bg-white shadow-lg z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Share2 className="w-4 h-4" /> Copy link
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Download className="w-4 h-4" /> Download
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Printer className="w-4 h-4" /> Print
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* New Submissions */}
        <section className="mb-16">
          <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
            New Submissions
          </h2>
          {newSubmissions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newSubmissions.map((resume, idx) => {
                const uniqueKey = `new-${resume.id}-${idx}`;
<<<<<<< HEAD
                const needs = needsReviewFor(resume);
                const comments = getCommentCount(resume);
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black overflow-visible">
                    {needs && (
                      <div className="absolute top-3 right-3 z-10">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold"
                          aria-label="Needs review"
                        >
                          !
                        </span>
                      </div>
                    )}
                    {comments > 0 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span
                          className="inline-flex items-center justify-center min-w-[22px] h-6 px-1 rounded-full bg-blue-600 text-white text-xs font-semibold"
                          aria-label={`${comments} comment${comments !== 1 ? 's' : ''}`}
                        >
                          {comments > 9 ? '9+' : comments}
                        </span>
                      </div>
                    )}
=======
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black overflow-visible">
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('.action-zone')) return;
                        navigate(`/review/${resume.id}`);
                      }}
                    />
                    <CardContent className="p-0 overflow-shown rounded-xl">
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        {resume.downloadURL ? (
                          <embed
                            src={`${resume.downloadURL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="w-full h-full pointer-events-none"
                          />
                        ) : (
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={resume.fileName}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-white/95" />
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-white/95" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-2 bg-white/95" />
                      </div>
                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{resume.fileName}</p>
                          <p className="text-xs text-gray-600 mt-1">Student: {resume.studentName}</p>
                          <p className="text-xs text-gray-600">
<<<<<<< HEAD
                            Submitted: {formatDateTime(
                              typeof resume.uploadDate === 'string'
                                ? resume.uploadDate
                                : resume.uploadDate?.toDate?.().toISOString() ?? ''
                            )}
=======
                            Submitted: {formatDateTime(resume.uploadDate)}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                          </p>
                          <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(resume.status)}
<<<<<<< HEAD
                              Pending Review
=======
                              {resume.status === 'approved'
                                ? 'Approved'
                                : resume.status === 'reviewed'
                                  ? 'Reviewed'
                                  : resume.status === 'in-review'
                                    ? 'In Progress'
                                    : 'Pending Review'}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                            </span>
                          </Badge>
                        </div>
                        <div className="relative z-20 flex items-center gap-2 shrink-0 action-zone">
                          <div className="relative">
                            <button
                              aria-label="More actions"
                              className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === uniqueKey ? null : uniqueKey);
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {openMenuId === uniqueKey && (
                              <div
                                className="absolute right-0 top-full mt-1 w-44 rounded border bg-white shadow-lg z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Share2 className="w-4 h-4" /> Copy link
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Download className="w-4 h-4" /> Download
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Printer className="w-4 h-4" /> Print
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                No new submissions
              </h3>
              <p className="text-gray-500">
                New resume submissions will appear here for review.
              </p>
            </div>
          )}
        </section>

        {/* Reviewed Resumes */}
        {reviewedResumes.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Reviewed Resumes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewedResumes.map((resume, idx) => {
                const uniqueKey = `reviewed-${resume.id}-${idx}`;
<<<<<<< HEAD
                const comments = getCommentCount(resume);
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black overflow-visible">
                    {comments > 0 && (
                      <div className="absolute top-3 left-3 z-10">
                        <span
                          className="inline-flex items-center justify-center min-w-[22px] h-6 px-1 rounded-full bg-blue-600 text-white text-xs font-semibold"
                          aria-label={`${comments} comment${comments !== 1 ? 's' : ''}`}
                        >
                          {comments > 9 ? '9+' : comments}
                        </span>
                      </div>
                    )}
=======
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black overflow-visible">
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('.action-zone')) return;
                        navigate(`/review/${resume.id}`);
                      }}
                    />
<<<<<<< HEAD
                    <CardContent className="p-0 overflow-visible rounded-xl">
=======
                    <CardContent className="p-0 overflow-visible rounded-xl">{/* was overflow-shown */}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        {resume.downloadURL ? (
                          <embed
                            src={`${resume.downloadURL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="w-full h-full pointer-events-none"
                          />
                        ) : (
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={resume.fileName}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-white/95" />
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-white/95" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-2 bg-white/95" />
                      </div>

                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{resume.fileName}</p>
                          <p className="text-xs text-gray-600 mt-1">Student: {resume.studentName}</p>
<<<<<<< HEAD
                          <p className="text-xs text-gray-600">
                            Submitted: {formatDateTime(
                              typeof resume.uploadDate === 'string'
                                ? resume.uploadDate
                                : resume.uploadDate?.toDate?.().toISOString() ?? ''
                            )}
                          </p>
                          <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(resume.status)}
                              Reviewed
                            </span>
                          </Badge>
                          {comments > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              {comments} comment{comments !== 1 ? 's' : ''} added
                            </p>
                          )}
                        </div>

=======
                          <p className="text-xs text-gray-600">Submitted: {formatDateTime(resume.uploadDate)}</p>
                          <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(resume.status)}
                              {resume.status === 'approved'
                                ? 'Approved'
                                : resume.status === 'reviewed'
                                  ? 'Reviewed'
                                  : resume.status === 'in-review'
                                    ? 'In Progress'
                                    : 'Pending Review'}
                            </span>
                          </Badge>
                        </div>

                        {/* Action zone */}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                        <div className="relative z-20 flex items-center gap-2 shrink-0 action-zone">
                          <div className="relative">
                            <button
                              aria-label="More actions"
                              className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === uniqueKey ? null : uniqueKey);
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openMenuId === uniqueKey && (
                              <div
                                className="absolute right-0 top-full mt-1 w-44 rounded border bg-white shadow-lg z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Share2 className="w-4 h-4" /> Copy link
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Download className="w-4 h-4" /> Download
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Printer className="w-4 h-4" /> Print
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Approved Resumes */}
        {approvedResumes.length > 0 && (
          <section>
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">Approved Resumes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedResumes.map((resume, idx) => {
                const uniqueKey = `approved-${resume.id}-${idx}`;
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black overflow-visible">
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('.action-zone')) return;
                        navigate(`/review/${resume.id}`);
                      }}
                    />
<<<<<<< HEAD
                    <CardContent className="p-0 overflow-visible rounded-xl">
=======
                    <CardContent className="p-0 overflow-visible rounded-xl">{/* was overflow-shown */}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        {resume.downloadURL ? (
                          <embed
                            src={`${resume.downloadURL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="w-full h-full pointer-events-none"
                          />
                        ) : (
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={resume.fileName}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-white/95" />
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-white/95" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-2 bg-white/95" />
                      </div>

                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{resume.fileName}</p>
                          <p className="text-xs text-gray-600 mt-1">Student: {resume.studentName}</p>
<<<<<<< HEAD
                          <p className="text-xs text-gray-600">
                            Submitted: {formatDateTime(
                              typeof resume.uploadDate === 'string'
                                ? resume.uploadDate
                                : resume.uploadDate?.toDate?.().toISOString() ?? ''
                            )}
                          </p>
                          <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(resume.status)}
                              {resume.status === 'approved' ? 'Approved' : 'Reviewed'}
=======
                          <p className="text-xs text-gray-600">Submitted: {formatDateTime(resume.uploadDate)}</p>
                          <Badge className={`mt-2 ${getStatusColor(resume.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(resume.status)}
                              {resume.status === 'approved'
                                ? 'Approved'
                                : resume.status === 'reviewed'
                                  ? 'Reviewed'
                                  : resume.status === 'in-review'
                                    ? 'In Progress'
                                    : 'Pending Review'}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                            </span>
                          </Badge>
                        </div>

<<<<<<< HEAD
=======
                        {/* Action zone */}
>>>>>>> 0045a990a1a81a15a51597a9ef56fb3c92bfed7c
                        <div className="relative z-20 flex items-center gap-2 shrink-0 action-zone">
                          <div className="relative">
                            <button
                              aria-label="More actions"
                              className="px-2 py-1 rounded border bg-white hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === uniqueKey ? null : uniqueKey);
                              }}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {openMenuId === uniqueKey && (
                              <div
                                className="absolute right-0 top-full mt-1 w-44 rounded border bg-white shadow-lg z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Share2 className="w-4 h-4" /> Copy link
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Download className="w-4 h-4" /> Download
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(resume.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Printer className="w-4 h-4" /> Print
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}