import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from './Navigation';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  Plus,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  MoreHorizontal,
  Share2,
  Download,
  Printer,
} from 'lucide-react';
import { User, Resume } from '../src/App';
import { ImageWithFallback } from './ImageWithFallback';
import app from '../src/firebaseConfig';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  doc as fsDoc,
  deleteDoc,
} from 'firebase/firestore';

interface StudentDashboardProps {
  user: User;
  resumes: Resume[];
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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // notification: count unresolved comments across student's resumes
  const [unresolvedCommentsCount, setUnresolvedCommentsCount] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setUnresolvedCommentsCount(0);
      return;
    }

    const q = query(
      collection(db, 'resumes'),
      where('studentId', '==', user.id)
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
      if (typeof unsub === 'function') {
        unsub();
      } else if (unsub && typeof (unsub as any).unsubscribe === 'function') {
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
      const q = query(
        collection(db, 'resumes'),
        where('studentId', '==', user.id)
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          const items: Resume[] = snapshot.docs.map((doc) => {
            const data = doc.data() as any;
            return {
              id: data.id ?? doc.id,
              fileName: data.fileName ?? 'Untitled',
              studentId: data.studentId ?? user.id,
              studentName: data.studentName ?? user.name,
              uploadDate: data.uploadDate ?? new Date().toISOString(),
              status: data.status ?? 'pending',
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
          console.error('[StudentDashboard] failed to subscribe to resumes', err);
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
    } catch (err: any) {
      console.error('[StudentDashboard] unexpected error fetching resumes', err);
      setFetchError(err?.message || 'Failed to load resumes');
      setLoading(false);
    }
  }, [db, user?.id, user?.name]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Delete this resume? This cannot be undone.')) return;
    try {
      await deleteDoc(fsDoc(db, 'resumes', id));
    } catch (err) {
      console.error('[StudentDashboard] delete failed', err);
      alert('Failed to delete. Please try again.');
    }
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

  const getUnresolvedCount = (r: Resume) =>
    (r.comments ?? []).filter((c: any) => !c.resolved).length;

  // Prefer Firestore results if available, otherwise fall back to prop
  const allResumes = fsResumes ?? propResumes ?? [];

  // Filter resumes by status to avoid duplicates across sections
  const yourResumes = allResumes.filter((r) => r.status === 'pending');
  const submittedResumes = allResumes.filter((r) => r.status === 'in-review');
  const reviewedResumes = allResumes.filter((r) =>
    ['reviewed', 'approved'].includes(r.status)
  );

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={() => navigate('/login')} />

      <div className="px-[79px] pt-[20px] pb-16">
        {/* Welcome Section */}
        <div className="mb-12">
          {unresolvedCommentsCount > 0 && (
            <div className="mb-6 p-4 rounded bg-red-50 border border-red-100 text-sm flex items-center justify-between">
              <div>
                <strong className="mr-2">Action required:</strong>
                You have {unresolvedCommentsCount} unresolved comment{unresolvedCommentsCount !== 1 ? 's' : ''} — please review and respond.
              </div>
            </div>
          )}
          <h1 className="text-[64px] font-bold text-black tracking-[-1.28px] leading-normal mb-6">
            Welcome, {user.name}
          </h1>
        </div>

        {loading && <p className="mb-6 text-gray-500">Loading your resumes…</p>}
        {fetchError && <p className="mb-6 text-red-600">Error: {fetchError}</p>}

        {/* Your Resumes (all statuses) */}
        <section className="mb-16">
          <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
            Your Resumes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {yourResumes.map((r, idx) => {
              const uniqueKey = `your-${r.id}-${idx}`;
              const unresolved = getUnresolvedCount(r);
              return (
                <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black rounded-xl overflow-visible">
                  {unresolved > 0 && (
                    <div className="absolute top-3 right-3 z-10">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold"
                        aria-label={`${unresolved} unresolved comment${unresolved !== 1 ? 's' : ''}`}
                      >
                        {unresolved > 9 ? '9+' : unresolved}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute inset-0 z-10 cursor-pointer"
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('.action-zone')) return;
                      navigate(`/resume/${r.id}`);
                    }}
                  />
                  <CardContent className="p-0 overflow-shown rounded-xl">
                    <div className="relative h-64 bg-gray-100 overflow-hidden">
                      {r.downloadURL ? (
                        <embed
                          src={`${r.downloadURL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          type="application/pdf"
                          className="w-full h-full pointer-events-none"
                        />
                      ) : (
                        <ImageWithFallback
                          src="/placeholder-resume.png"
                          alt={r.fileName}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-white/95" />
                      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-white/95" />
                      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-2 bg-white/95" />
                    </div>

                    <div className="p-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.fileName}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatDate(
                            typeof r.uploadDate === 'string'
                              ? r.uploadDate
                              : r.uploadDate?.toDate?.().toISOString() ?? ''
                          )}
                        </p>
                        <Badge className={`mt-2 ${getStatusColor(r.status)}`}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(r.status)}
                            {r.status.charAt(0).toUpperCase() + r.status.slice(1).replace('-', ' ')}
                          </span>
                        </Badge>
                      </div>

                      <div className="relative z-20 flex items-center gap-2 shrink-0 action-zone">
                        <button
                          aria-label="Delete resume"
                          className="px-2 py-1 rounded border border-red-200 bg-white hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(r.id!);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>

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
                                  handleCopy(r.downloadURL);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Share2 className="w-4 h-4" /> Copy link
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(r.downloadURL);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Download className="w-4 h-4" /> Download
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrint(r.downloadURL);
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

            {/* Upload New Card */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow border border-black border-dashed"
              onClick={() => navigate('/upload')}
            >
              <CardContent className="p-0">
                <div className="h-64 border-b border-black border-dashed flex items-center justify-center">
                  <div className="text-center">
                    <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-black">Upload New</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-medium text-sm text-center">Add New Resume</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Submitted For Review */}
        {submittedResumes.length > 0 && (
          <section className="mb-16">
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Submitted For Review
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submittedResumes.map((r, idx) => {
                const uniqueKey = `submitted-${r.id}-${idx}`;
                const unresolved = getUnresolvedCount(r);
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black rounded-xl overflow-visible">
                    {unresolved > 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold"
                          aria-label={`${unresolved} unresolved comment${unresolved !== 1 ? 's' : ''}`}
                        >
                          {unresolved > 9 ? '9+' : unresolved}
                        </span>
                      </div>
                    )}
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('.action-zone')) return;
                        navigate(`/resume/${r.id}`);
                      }}
                    />
                    <CardContent className="p-0 overflow-shown rounded-xl">
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        {r.downloadURL ? (
                          <embed
                            src={`${r.downloadURL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="w-full h-full pointer-events-none"
                          />
                        ) : (
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={r.fileName}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-white/95" />
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-white/95" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-2 bg-white/95" />
                      </div>

                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{r.fileName}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Reviewer: {r.reviewerName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(
                              typeof r.uploadDate === 'string'
                                ? r.uploadDate
                                : r.uploadDate?.toDate?.().toISOString() ?? ''
                            )}
                          </p>
                          <Badge className={`mt-2 ${getStatusColor(r.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(r.status)}
                              In Review
                            </span>
                          </Badge>
                        </div>

                        <div className="relative z-20 flex items-center gap-2 shrink-0 action-zone">
                          <button
                            aria-label="Delete resume"
                            className="px-2 py-1 rounded border border-red-200 bg-white hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(r.id!);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>

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
                                    handleCopy(r.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Share2 className="w-4 h-4" /> Copy link
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(r.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Download className="w-4 h-4" /> Download
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(r.downloadURL);
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

        {/* Reviewed / Approved */}
        {reviewedResumes.length > 0 && (
          <section>
            <h2 className="text-[48px] font-semibold text-black tracking-[-0.96px] mb-8">
              Reviewed Resumes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviewedResumes.map((r, idx) => {
                const uniqueKey = `reviewed-${r.id}-${idx}`;
                const unresolved = getUnresolvedCount(r);
                return (
                  <Card key={uniqueKey} className="relative hover:shadow-lg transition-shadow border border-black rounded-xl overflow-visible">
                    {unresolved > 0 && (
                      <div className="absolute top-3 right-3 z-10">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-semibold"
                          aria-label={`${unresolved} unresolved comment${unresolved !== 1 ? 's' : ''}`}
                        >
                          {unresolved > 9 ? '9+' : unresolved}
                        </span>
                      </div>
                    )}
                    <div
                      className="absolute inset-0 z-10 cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('.action-zone')) return;
                        navigate(`/resume/${r.id}`);
                      }}
                    />
                    <CardContent className="p-0 overflow-shown rounded-xl">
                      <div className="relative h-64 bg-gray-100 overflow-hidden">
                        {r.downloadURL ? (
                          <embed
                            src={`${r.downloadURL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                            type="application/pdf"
                            className="w-full h-full pointer-events-none"
                          />
                        ) : (
                          <ImageWithFallback
                            src="/placeholder-resume.png"
                            alt={r.fileName}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-white/95" />
                        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-1 bg-white/95" />
                        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-2 bg-white/95" />
                      </div>

                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{r.fileName}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Reviewed by: {r.reviewerName}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatDate(
                              typeof r.uploadDate === 'string'
                                ? r.uploadDate
                                : r.uploadDate?.toDate?.().toISOString() ?? ''
                            )}
                          </p>
                          <Badge className={`mt-2 ${getStatusColor(r.status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(r.status)}
                              {r.status === 'approved' ? 'Approved' : 'Reviewed'}
                            </span>
                          </Badge>
                          {r.comments.length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              {r.comments.length} comment{r.comments.length !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>

                        <div className="relative z-20 flex items-center gap-2 shrink-0 action-zone">
                          <button
                            aria-label="Delete resume"
                            className="px-2 py-1 rounded border border-red-200 bg-white hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(r.id!);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>

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
                                    handleCopy(r.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Share2 className="w-4 h-4" /> Copy link
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(r.downloadURL);
                                    setOpenMenuId(null);
                                  }}
                                >
                                  <Download className="w-4 h-4" /> Download
                                </button>
                                <button
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrint(r.downloadURL);
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