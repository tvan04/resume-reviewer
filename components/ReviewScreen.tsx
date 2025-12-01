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
  MapPin
} from 'lucide-react';

import { User, Resume, Comment } from '../src/App';

import {
  addCommentToResume,
  subscribeToResume,
  editCommentInResume,
  deleteCommentFromResume,
  updateResumeStatus,
} from './resumeRepo';

interface ReviewScreenProps {
  user: User;
  onAddComment: (resumeId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>) => void;
  onStatusUpdate: (resumeId: string, status: Resume['status']) => void;
}

export function ReviewScreen({
  user,
}: ReviewScreenProps) {

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [fsResume, setFsResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Resume['status']>('pending');

  const [newComment, setNewComment] = useState('');

  // Inline pin logic
  const [addPinMode, setAddPinMode] = useState(false);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [popupText, setPopupText] = useState("");

  const [activePin, setActivePin] = useState<null | {
    id: string;
    text: string;
    x: number;
    y: number;
    resolved: boolean;
  }>(null);

  const [pinEditText, setPinEditText] = useState("");
  const [editingPin, setEditingPin] = useState(false);

  // For sidebar comment editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    let unsub: undefined | (() => void);

    if (!id) {
      setLoading(false);
      setLoadError("No resume id");
      return;
    }

    unsub = subscribeToResume(
      id,
      (res) => {
        setFsResume(res);
        setSelectedStatus(res?.status ?? "pending");
        setLoading(false);
      },
      (err) => {
        setLoadError(err);
        setFsResume(null);
        setLoading(false);
      }
    );

    return () => unsub?.();
  }, [id]);

  const resume = fsResume;

  // ===========================
  // Regular Comments (Sidebar)
  // ===========================
  const handleAddComment = async () => {
    if (!resume || !newComment.trim()) return;

    await addCommentToResume(resume.id, {
      text: newComment.trim(),
      authorId: user.id,
      authorName: user.name,
      resolved: false,
    });

    setNewComment('');
  };

  const handleStatusChange = async (status: Resume['status']) => {
    if (!resume) return;
    setSelectedStatus(status);
    await updateResumeStatus(resume.id, status);
  };

  const saveEdit = async () => {
    if (!resume || !editingId) return;

    await editCommentInResume(resume.id, editingId, editText.trim());
    setEditingId(null);
    setEditText('');
  };

  const removeComment = async (commentId: string) => {
    if (!resume) return;

    if (!confirm("Delete this comment?")) return;

    await deleteCommentFromResume(resume.id, commentId);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString('en-US', {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });

  const getStatusColor = (status: Resume['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-review': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ===========================
  // Loading / Missing Resume
  // ===========================
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading resume...</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">Resume not found.</p>
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        <Button onClick={() => navigate('/reviewer')} className="mt-4">Back</Button>
      </div>
    );
  }

  // ===========================
  // MAIN UI RETURN
  // ===========================
  return (
    <div className="min-h-screen bg-white">
      <NavigationBar user={user} onLogout={() => navigate("/login")} />

      <div className="px-[79px] pt-[20px] pb-16">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/reviewer")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            <div>
              <h1 className="text-3xl font-bold text-black">Reviewing: {resume.fileName}</h1>
              <p className="text-lg text-gray-600">Student: {resume.studentName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge className={getStatusColor(selectedStatus)}>
              {selectedStatus.replace('-', ' ')}
            </Badge>

            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-review">In Review</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: PDF Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resume Preview
                </CardTitle>

                {/* ADD PIN BUTTON */}
                <Button
                  variant={addPinMode ? "default" : "outline"}
                  className="flex items-center gap-2 mt-3"
                  onClick={() => {
                    setAddPinMode(!addPinMode);
                    setPopupPos(null);
                    setActivePin(null);
                  }}
                >
                  <MapPin className="w-4 h-4" />
                  {addPinMode ? "Click PDF to place pin..." : "Add Pin"}
                </Button>

                
                <div className="flex gap-2">
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

                </div>


              </CardHeader>

              <CardContent>
                <div className="relative bg-gray-100 rounded-lg min-h-[800px] overflow-auto">
                  

                  {/* PDF Viewer */}
                  <object
                    id="resume-pdf"
                    data={resume.downloadURL}
                    type="application/pdf"
                    width="100%"
                    height="1000px"
                    className="rounded-md"
                  />

                  {/* EXISTING PINS */}
                  {resume.comments
                    .filter(c => typeof c.x === 'number' && typeof c.y === 'number')
                    .map((c) => (
                      <div
                        key={c.id}
                        style={{
                          position: "absolute",
                          top: c.y,
                          left: c.x,
                          transform: "translate(-50%, -50%)",
                          zIndex: 20,
                        }}
                      >
                        <div
                          className="group absolute -top-3 -left-3 w-6 h-6 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePin({ id: c.id, text: c.text, x: c.x!, y: c.y!, resolved: c.resolved, });
                            setPinEditText(c.text);
                            setEditingPin(false);
                            setPopupPos(null);
                          }}
                        >
                          <div
                            className={`
                              w-3 h-3 rounded-full shadow-md
                              ${c.resolved ? "bg-green-600" : "bg-red-600"}
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
                        </div>
                      </div>
                    ))}

                  {/* PIN POPUP */}
                  {activePin && (
                    <div
                      className="absolute bg-white border shadow-xl rounded-md p-3 w-64 z-50"
                      style={{
                        top: activePin.y,
                        left: activePin.x + 40,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="absolute top-1 right-1 text-gray-500 hover:text-gray-700"
                        onClick={() => setActivePin(null)}
                      >
                        ✕
                      </button>

                      {!editingPin && (
                        <>
                          <p className="text-sm mb-4 pr-5">{activePin.text}</p>
                          <div className="flex justify-between mt-3">
                            <button
                              className="text-xs px-2 py-1 bg-gray-200 rounded"
                              onClick={() => setEditingPin(true)}
                            >
                              Edit
                            </button>

                            <button
                              className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                              onClick={() => {
                                deleteCommentFromResume(resume.id, activePin.id);
                                setActivePin(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}

                      {editingPin && (
                        <>
                          <textarea
                            className="w-full border rounded p-2 text-sm"
                            rows={3}
                            value={pinEditText}
                            onChange={(e) => setPinEditText(e.target.value)}
                          />

                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                              onClick={() => {
                                editCommentInResume(resume.id, activePin.id, pinEditText.trim());
                                setActivePin(null);
                                setEditingPin(false);
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ADD PIN MODE OVERLAY */}
                  {addPinMode && (
                    <div
                      className="absolute inset-0 z-40 cursor-crosshair"
                      onClick={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - bounds.left;
                        const y = e.clientY - bounds.top;
                        setPopupPos({ x, y });
                        setPopupText("");
                        setActivePin(null);
                      }}
                    />
                  )}

                  {/* NEW PIN POPUP */}
                  {popupPos && (
                    <div
                      className="absolute z-50 bg-white shadow-xl border rounded-md p-3 w-64"
                      style={{
                        top: popupPos.y,
                        left: popupPos.x,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <textarea
                        className="w-full border rounded p-2 text-sm"
                        rows={3}
                        placeholder="Write comment…"
                        value={popupText}
                        onChange={(e) => setPopupText(e.target.value)}
                      />

                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          className="px-2 py-1 text-xs bg-gray-200 rounded"
                          onClick={() => setPopupPos(null)}
                        >
                          Cancel
                        </button>

                        <button
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
                          disabled={!popupText.trim()}
                          onClick={async () => {
                            if (!popupText.trim()) return;

                            await addCommentToResume(resume.id, {
                              text: popupText.trim(),
                              authorId: user.id,
                              authorName: user.name,
                              resolved: false,
                              x: popupPos.x,
                              y: popupPos.y,
                            });

                            setPopupPos(null);
                            setPopupText("");
                            setAddPinMode(false);
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR: Comments + Quick Actions */}
          <div className="space-y-6">

            {/* Resume Info */}
            <Card>
              <CardHeader><CardTitle>Resume Details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm"><strong>File Name: </strong>{resume.fileName}</p>
                <p className="text-sm"><strong>Student: </strong>{resume.studentName}</p>
                <p className="text-sm"><strong>Uploaded: </strong>
                  {formatDate(
                    typeof resume.uploadDate === 'string'
                      ? resume.uploadDate
                      : resume.uploadDate?.toDate?.().toISOString() ?? ""
                  )}
                </p>
                <p className="text-sm"><strong>Version:</strong> v{resume.version}</p>
              </CardContent>
            </Card>

            {/* Add Comment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Add Feedback
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write feedback..."
                  rows={4}
                />

                <Button
                  className="w-full"
                  disabled={!newComment.trim()}
                  onClick={handleAddComment}
                >
                  <Send className="w-4 h-4 mr-2" /> Add Comment
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
                {resume.comments.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">
                    No comments yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {resume.comments.map((c) => (
                      <div key={c.id} className="pl-4 border-l-2 border-blue-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{c.authorName}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(
                                typeof resume.uploadDate === "string"
                                  ? resume.uploadDate
                                  : resume.uploadDate?.toDate?.().toISOString() ?? ""
                              )}
                            </p>
                          </div>

                          {c.authorId === user.id && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingId(c.id);
                                  setEditText(c.text);
                                }}
                              >
                                Edit
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeComment(c.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>

                        {editingId === c.id ? (
                          <div className="space-y-2">
                            <Textarea
                              rows={3}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={saveEdit}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm">{c.text}</p>
                        )}

                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>

              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={selectedStatus === "reviewed"}
                  onClick={() => handleStatusChange("reviewed")}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Reviewed
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={selectedStatus === "approved"}
                  onClick={() => handleStatusChange("approved")}
                >
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Approve Resume
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={selectedStatus === "in-review"}
                  onClick={() => handleStatusChange("in-review")}
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
