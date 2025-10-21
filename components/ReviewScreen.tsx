import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavigationBar } from './Navigation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  Send,
  ArrowLeft,
  Download,
  Printer,
} from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { User, Resume, Comment } from '../src/App';
import app from '../src/firebaseConfig';
import { getFirestore, doc as fsDoc, getDoc } from 'firebase/firestore';

interface ReviewScreenProps {
  user: User;
  onAddComment: (resumeId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>) => void;
  onStatusUpdate: (resumeId: string, status: Resume['status']) => void;
}

export function ReviewScreen({ user, onAddComment, onStatusUpdate }: ReviewScreenProps) {
  const [newComment, setNewComment] = useState('');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const db = getFirestore(app);

  const [fsResume, setFsResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Resume['status']>('pending');

  useEffect(() => {
    let mounted = true;
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    const ref = fsDoc(db, 'resumes', id);
    getDoc(ref)
      .then((snap) => {
        if (!mounted) return;
        if (!snap.exists()) {
          setFsResume(null);
          setLoadError('Resume not found');
        } else {
          const data = snap.data() as any;
          const loaded: Resume = {
            id: data.id ?? snap.id,
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
            ...data,
          };
          setFsResume(loaded);
          setSelectedStatus(loaded.status);
        }
      })
      .catch((err) => {
        console.error('[ReviewScreen] failed to load resume', err);
        if (!mounted) return;
        setLoadError((err as any)?.message || 'Failed to load resume');
        setFsResume(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, db]);

  const resume = fsResume;

  useEffect(() => {
    if (resume) setSelectedStatus(resume.status);
  }, [resume]);

  const handleAddComment = () => {
    if (!resume) return;
    if (newComment.trim()) {
      onAddComment(resume.id, {
        text: newComment.trim(),
        authorId: user.id,
        authorName: user.name,
        resolved: false,
      });
      setNewComment('');
    }
  };

  const handleStatusChange = (status: Resume['status']) => {
    if (!resume) return;
    setSelectedStatus(status);
    onStatusUpdate(resume.id, status);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-review':
        return 'bg-blue-100 text-blue-800';
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        <Button onClick={() => navigate('/reviewer')} className="mt-4">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={() => navigate('/login')} />
      
      <div className="px-[79px] pt-[20px] pb-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/reviewer')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-black">
                Reviewing: {resume.fileName}
              </h1>
              <p className="text-lg text-gray-600">
                Student: {resume.studentName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(selectedStatus)}>
              {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace('-', ' ')}
            </Badge>
            
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resume Viewer */}
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
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 min-h-[800px] rounded-lg flex items-center justify-center">
                  {resume.downloadURL ? (
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
                  ) : (
                    <ImageWithFallback
                      src="/placeholder-resume-full.png"
                      alt={resume.fileName}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments and Actions Panel */}
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
                  <p className="text-sm font-medium text-gray-600">Student</p>
                  <p className="text-sm">{resume.studentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Uploaded</p>
                  <p className="text-sm">{formatDate(resume.uploadDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Version</p>
                  <p className="text-sm">v{resume.version}</p>
                </div>
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Add Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Provide constructive feedback to help the student improve their resume..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </CardContent>
            </Card>

            {/* Existing Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({resume.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resume.comments.length > 0 ? (
                  <div className="space-y-4">
                    {resume.comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-blue-200 pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{comment.authorName}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(comment.createdAt)}
                            </p>
                          </div>
                          {comment.resolved && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm mb-3">{comment.text}</p>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="ml-4 space-y-2 border-l border-gray-200 pl-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="bg-gray-50 p-2 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium text-xs">{reply.authorName}</p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(reply.createdAt)}
                                  </p>
                                </div>
                                <p className="text-sm">{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No comments yet</p>
                    <p className="text-sm">Add feedback to help the student improve their resume</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleStatusChange('reviewed')}
                  disabled={selectedStatus === 'reviewed'}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Reviewed
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleStatusChange('approved')}
                  disabled={selectedStatus === 'approved'}
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Approve Resume
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleStatusChange('in-review')}
                  disabled={selectedStatus === 'in-review'}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Continue Review
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}