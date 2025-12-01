// import { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { NavigationBar } from './Navigation';
// import { Button } from './ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import { Textarea } from './ui/textarea';
// import { Badge } from './ui/badge';
// import { Separator } from './ui/separator';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from './ui/select';
// import {
//   FileText,
//   MessageSquare,
//   CheckCircle,
//   Clock,
//   Send,
//   ArrowLeft,
//   Download,
//   Printer,
// } from 'lucide-react';
// import { ImageWithFallback } from './ImageWithFallback';
// import { User, Resume, Comment } from '../src/App';
// import {
//   addCommentToResume,
//   subscribeToResume,
//   editCommentInResume,
//   deleteCommentFromResume,
//   updateResumeStatus,
// } from './resumeRepo';

// interface ReviewScreenProps {
//   user: User;
//   onAddComment: (resumeId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>) => void;
//   onStatusUpdate: (resumeId: string, status: Resume['status']) => void;
// }



// export function ReviewScreen({
//   user,
//   onAddComment: _onAddComment, // unused, we write directly to Firestore
//   onStatusUpdate: _onStatusUpdate, // unused, we write directly to Firestore
// }: ReviewScreenProps) {
//   const [newComment, setNewComment] = useState('');
//   const navigate = useNavigate();
//   const { id } = useParams<{ id: string }>();

//   const [fsResume, setFsResume] = useState<Resume | null>(null);
//   const [loading, setLoading] = useState<boolean>(!!id);
//   const [loadError, setLoadError] = useState<string | null>(null);
//   const [selectedStatus, setSelectedStatus] = useState<Resume['status']>('pending');

//   const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
//   const [popupText, setPopupText] = useState("");

//   // When a pin is clicked
//   const [activePin, setActivePin] = useState<null | {
//     id: string;
//     text: string;
//     x: number;
//     y: number;
//     resolved: boolean;
//   }>(null);

//   // Popup text for editing
//   const [pinEditText, setPinEditText] = useState("");

//   // Whether you clicked “edit” inside pin popup
//   const [editingPin, setEditingPin] = useState(false);

//   const [inlineComments, setInlineComments] = useState<
//     { id: string; text: string; x: number; y: number; resolved?: boolean }[]
//   >([]);



//   // For editing reviewer comments
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editText, setEditText] = useState('');

//   useEffect(() => {
//     let unsub: (() => void) | undefined;

//     if (!id) {
//       setLoading(false);
//       setLoadError('No resume id');
//     } else {
//       setLoading(true);
//       setLoadError(null);

//       unsub = subscribeToResume(
//         id,
//         (loaded) => {
//           setFsResume(loaded);
//           setSelectedStatus(loaded?.status ?? "pending");

//           setInlineComments(
//             (loaded?.comments
//               ?.filter((c): c is Comment & { x: number; y: number } =>
//                 typeof c.x === "number" && typeof c.y === "number"
//               ) ?? [])
//           );

//           setLoading(false);
//         },
//         (err) => {
//           setLoadError(err);
//           setFsResume(null);
//           setLoading(false);
//         }
//       );
//     }

//     return () => {
//       if (unsub) unsub();
//     };
//   }, [id]);

//   const resume = fsResume;

//   const handleAddComment = async () => {
//     if (!resume) return;
//     if (newComment.trim()) {
//       try {
//         await addCommentToResume(resume.id, {
//           text: newComment.trim(),
//           authorId: user.id,
//           authorName: user.name,
//           resolved: false,
//         });
//         setNewComment('');
//       } catch (e) {
//         alert('Failed to add comment');
//       }
//     }
//   };

//   const handleStatusChange = async (status: Resume['status']) => {
//     if (!resume) return;
//     setSelectedStatus(status);
//     try {
//       await updateResumeStatus(resume.id, status);
//     } catch {
//       alert('Failed to update status');
//     }
//   };

//   const startEdit = (commentId: string, currentText: string) => {
//     setEditingId(commentId);
//     setEditText(currentText);
//   };

//   const saveEdit = async () => {
//     if (!resume || !editingId) return;
//     try {
//       await editCommentInResume(resume.id, editingId, editText.trim());
//       setEditingId(null);
//       setEditText('');
//     } catch {
//       alert('Failed to edit comment');
//     }
//   };

//   const removeComment = async (commentId: string) => {
//     if (!resume) return;
//     if (!confirm('Delete this comment?')) return;
//     try {
//       await deleteCommentFromResume(resume.id, commentId);
//     } catch {
//       alert('Failed to delete comment');
//     }
//   };

//   const formatDate = (dateString: string) =>
//     new Date(dateString).toLocaleString('en-US', {
//       weekday: 'short',
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric',
//       hour: 'numeric',
//       minute: '2-digit',
//     });

//   const getStatusColor = (status: Resume['status']) => {
//     switch (status) {
//       case 'pending':
//         return 'bg-yellow-100 text-yellow-800';
//       case 'in-review':
//         return 'bg-blue-100 text-blue-800';
//       case 'reviewed':
//         return 'bg-green-100 text-green-800';
//       case 'approved':
//         return 'bg-green-100 text-green-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-white flex items-center justify-center">
//         <p className="text-gray-600">Loading resume…</p>
//       </div>
//     );
//   }

//   if (!resume) {
//     return (
//       <div className="min-h-screen bg-white flex flex-col items-center justify-center">
//         <p className="text-lg text-gray-600">Resume not found.</p>
//         {loadError && <p className="text-sm text-red-600 mt-2">{loadError}</p>}
//         <Button onClick={() => navigate('/reviewer')} className="mt-4">Back to Dashboard</Button>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-white">
//       <NavigationBar user={user} onLogout={() => navigate('/login')} />
      
//       <div className="px-[79px] pt-[20px] pb-16">
//         {/* Header */}
//         <div className="flex items-center justify-between mb-8">
//           <div className="flex items-center gap-4">
//             <Button
//               variant="outline"
//               onClick={() => navigate('/reviewer')}
//               className="flex items-center gap-2"
//             >
//               <ArrowLeft className="w-4 h-4" />
//               Back to Dashboard
//             </Button>
//             <div>
//               <h1 className="text-3xl font-bold text-black">
//                 Reviewing: {resume.fileName}
//               </h1>
//               <p className="text-lg text-gray-600">
//                 Student: {resume.studentName}
//               </p>
//             </div>
//           </div>
          
//           <div className="flex items-center gap-4">
//             <Badge className={getStatusColor(selectedStatus)}>
//               {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1).replace('-', ' ')}
//             </Badge>
            
//             <Select value={selectedStatus} onValueChange={handleStatusChange}>
//               <SelectTrigger className="w-48">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="pending">Pending</SelectItem>
//                 <SelectItem value="in-review">In Review</SelectItem>
//                 <SelectItem value="reviewed">Reviewed</SelectItem>
//                 <SelectItem value="approved">Approved</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Resume Viewer */}
//           <div className="lg:col-span-2">
//             <Card>
//               <CardHeader>
//                 <div className="flex items-center justify-between">
//                   <CardTitle className="flex items-center gap-2">
//                     <FileText className="w-5 h-5" />
//                     Resume Preview
//                   </CardTitle>
//                   <div className="flex gap-2">
//                     {resume.downloadURL ? (
//                       <>
//                         <a href={resume.downloadURL} target="_blank" rel="noreferrer">
//                           <Button variant="outline" size="sm">
//                             <Download className="w-4 h-4 mr-2" />
//                             Download
//                           </Button>
//                         </a>
//                         <a href={resume.downloadURL} target="_blank" rel="noreferrer">
//                           <Button variant="outline" size="sm">
//                             <Printer className="w-4 h-4 mr-2" />
//                             Print
//                           </Button>
//                         </a>
//                       </>
//                     ) : (
//                       <>
//                         <Button variant="outline" size="sm">
//                           <Download className="w-4 h-4 mr-2" />
//                           Download
//                         </Button>
//                         <Button variant="outline" size="sm">
//                           <Printer className="w-4 h-4 mr-2" />
//                           Print
//                         </Button>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </CardHeader>
//               <CardContent>
//                 <div className="relative bg-gray-100 min-h-[800px] rounded-lg flex items-center justify-center">
//                   {resume.downloadURL && (
//                     <>
//                       <object
//                         id="resume-pdf"
//                         data={resume.downloadURL}
//                         type="application/pdf"
//                         width="100%"
//                         height="800"
//                         aria-label={resume.fileName}
//                       />

//                       {/* INLINE COMMENT PINS */}
//                       {resume.comments
//                         .filter((c) => typeof c.x === "number" && typeof c.y === "number")
//                         .map((c) => (
//                           <div
//                             key={c.id}
//                             style={{
//                               position: "absolute",
//                               top: c.y,
//                               left: c.x,
//                               transform: "translate(-50%, -50%)",
//                               zIndex: 20,
//                             }}
//                           >
//                             {/* Invisible larger click area */}
//                             <div
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 setActivePin({
//                                   id: c.id,
//                                   text: c.text,
//                                   x: c.x!,
//                                   y: c.y!,
//                                   resolved: c.resolved ?? false,
//                                 });
//                                 setPinEditText(c.text);
//                                 setEditingPin(false);
//                               }}
//                               className="
//                                 group  
//                                 absolute 
//                                 -top-3 -left-3   /* expands click area */
//                                 w-6 h-6
//                                 cursor-pointer
//                               "
//                             >
//                               {/* The pin itself */}
//                               <div
//                                 className={`
//                                   w-3 h-3 rounded-full shadow-md 
//                                   transition-all 
//                                   ${c.resolved ? "bg-green-600" : "bg-red-600"} 
//                                   group-hover:scale-125 
//                                   group-hover:ring-2 
//                                   group-hover:ring-black/40 
//                                   group-hover:brightness-110
//                                 `}
//                                 style={{
//                                   position: "absolute",
//                                   top: "50%",
//                                   left: "50%",
//                                   transform: "translate(-50%, -50%)",
//                                 }}
//                               />
//                             </div>
//                           </div>

//                         ))}

//                       {/* PIN POPUP */}
//                       {activePin && (
//                         <div
//                           className="absolute z-30 bg-white border shadow-xl rounded-md p-3 w-64"
//                           style={{
//                             top: activePin.y,
//                             left: activePin.x + 40,
//                             transform: "translate(-50%, -50%)",
//                           }}
//                           onClick={(e) => e.stopPropagation()}
//                         >
//                           {/* CLOSE BUTTON */}
//                           <button
//                             className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 text-sm"
//                             onClick={() => {
//                               setActivePin(null);
//                               setEditingPin(false);
//                             }}
//                           >
//                             ✕
//                           </button>

//                           {/* Default view */}
//                           {!editingPin && (
//                             <>
//                               <p className="text-sm mb-4 pr-5">{activePin.text}</p>

//                               <div className="flex justify-between mt-3">
//                                 <button
//                                   className="text-xs px-2 py-1 bg-gray-200 rounded"
//                                   onClick={() => setEditingPin(true)}
//                                 >
//                                   Edit
//                                 </button>

//                                 <button
//                                   className="text-xs px-2 py-1 bg-red-500 text-white rounded"
//                                   onClick={() => {
//                                     deleteCommentFromResume(resume.id, activePin.id);
//                                     setActivePin(null);
//                                   }}
//                                 >
//                                   Delete
//                                 </button>
//                               </div>
//                             </>
//                           )}

//                           {/* Editing mode */}
//                           {editingPin && (
//                             <>
//                               <textarea
//                                 className="w-full border rounded p-2 text-sm"
//                                 rows={3}
//                                 value={pinEditText}
//                                 onChange={(e) => setPinEditText(e.target.value)}
//                               />

//                               <div className="flex justify-end gap-2 mt-2">
//                                 <button
//                                   className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
//                                   onClick={() => {
//                                     editCommentInResume(resume.id, activePin.id, pinEditText);
//                                     setActivePin(null);
//                                     setEditingPin(false);
//                                   }}
//                                 >
//                                   Save
//                                 </button>
//                               </div>
//                             </>
//                           )}
//                         </div>
//                       )}

//                       {/* Transparent click layer */}
//                       <div
//                         className="absolute inset-0 z-10"
//                         style={{ zIndex: 10 }}
//                         onClick={(e) => {
//                           const bounds = e.currentTarget.getBoundingClientRect();
//                           const x = e.clientX - bounds.left;
//                           const y = e.clientY - bounds.top;

//                           setPopupPos({ x, y }); // open the popup
//                           setPopupText("");      // reset text
//                         }}
//                       />
//                       {/* Inline comment popup */}
//                       {popupPos && (
//                         <div
//                           className="absolute z-20 bg-white shadow-xl border rounded-md p-3 w-64"
//                           style={{
//                             top: popupPos.y,
//                             left: popupPos.x,
//                             transform: "translate(-50%, -50%)",
//                           }}
//                         >
//                           <textarea
//                             className="w-full border rounded p-2 text-sm"
//                             rows={3}
//                             placeholder="Write comment…"
//                             value={popupText}
//                             onChange={(e) => setPopupText(e.target.value)}
//                           />

//                           <div className="flex justify-end gap-2 mt-2">
//                             <button
//                               className="px-2 py-1 text-xs bg-gray-200 rounded"
//                               onClick={() => setPopupPos(null)}
//                             >
//                               Cancel
//                             </button>

//                             <button
//                               className="px-2 py-1 text-xs bg-blue-600 text-white rounded"
//                               onClick={async () => {
//                                 if (!popupPos || !popupText.trim()) return;

//                                 await addCommentToResume(resume.id, {
//                                   text: popupText,
//                                   authorId: user.id,
//                                   authorName: user.name,
//                                   resolved: false,
//                                   x: popupPos.x,
//                                   y: popupPos.y
//                                 });

//                                 // reset UI
//                                 setPopupPos(null);
//                                 setPopupText("");
//                               }}
//                               disabled={!popupText.trim()}
//                             >
//                               Save
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </>
//                   )}

//                   {!resume.downloadURL && (
//                     <ImageWithFallback
//                       src="/placeholder-resume-full.png"
//                       alt={resume.fileName}
//                       className="max-w-full max-h-full object-contain"
//                     />
//                   )}
//                 </div>

//               </CardContent>
//             </Card>
//           </div>

//           {/* Comments and Actions Panel */}
//           <div className="space-y-6">
//             {/* Resume Info */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Resume Details</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">File Name</p>
//                   <p className="text-sm">{resume.fileName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Student</p>
//                   <p className="text-sm">{resume.studentName}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Uploaded</p>
//                   <p className="text-sm">{formatDate(
//                     typeof resume.uploadDate === 'string'
//                       ? resume.uploadDate
//                       : resume.uploadDate?.toDate?.().toISOString() ?? ''
//                   )
//                   }</p>
//                 </div>
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Version</p>
//                   <p className="text-sm">v{resume.version}</p>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Add Comment */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <MessageSquare className="w-5 h-5" />
//                   Add Feedback
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <Textarea
//                   placeholder="Provide constructive feedback to help the student improve their resume..."
//                   value={newComment}
//                   onChange={(e) => setNewComment(e.target.value)}
//                   rows={4}
//                 />
//                 <Button 
//                   onClick={handleAddComment}
//                   disabled={!newComment.trim()}
//                   className="w-full"
//                 >
//                   <Send className="w-4 h-4 mr-2" />
//                   Add Comment
//                 </Button>
//               </CardContent>
//             </Card>

//             {/* Existing Comments */}
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <MessageSquare className="w-5 h-5" />
//                   Comments ({resume.comments.length})
//                 </CardTitle>
//               </CardHeader>
//               <CardContent>
//                 {resume.comments.length > 0 ? (
//                   <div className="space-y-4">
//                     {resume.comments.map((comment) => (
//                       <div key={comment.id} className="border-l-2 border-blue-200 pl-4">
//                         <div className="flex items-start justify-between mb-2">
//                           <div>
//                             <p className="font-medium text-sm">{comment.authorName}</p>
//                             <p className="text-xs text-gray-500">
//                               {formatDate(
//                                 typeof resume.uploadDate === 'string'
//                                   ? resume.uploadDate
//                                   : resume.uploadDate?.toDate?.().toISOString() ?? ''
//                               )}
//                             </p>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             {comment.resolved && (
//                               <Badge variant="secondary" className="text-xs">
//                                 <CheckCircle className="w-3 h-3 mr-1" />
//                                 Resolved
//                               </Badge>
//                             )}
//                             {comment.authorId === user.id && (
//                               <>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => startEdit(comment.id, comment.text)}
//                                 >
//                                   Edit
//                                 </Button>
//                                 <Button
//                                   variant="ghost"
//                                   size="sm"
//                                   onClick={() => removeComment(comment.id)}
//                                 >
//                                   Delete
//                                 </Button>
//                               </>
//                             )}
//                           </div>
//                         </div>

//                         {editingId === comment.id ? (
//                           <div className="space-y-2">
//                             <Textarea
//                               value={editText}
//                               onChange={(e) => setEditText(e.target.value)}
//                               rows={3}
//                             />
//                             <div className="flex gap-2">
//                               <Button size="sm" onClick={saveEdit}>Save</Button>
//                               <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
//                             </div>
//                           </div>
//                         ) : (
//                           <p className="text-sm mb-3">{comment.text}</p>
//                         )}

//                         {/* Replies */}
//                         {comment.replies.length > 0 && (
//                           <div className="ml-4 space-y-2 border-l border-gray-200 pl-3">
//                             {comment.replies.map((reply) => (
//                               <div key={reply.id} className="bg-gray-50 p-2 rounded">
//                                 <div className="flex items-center gap-2 mb-1">
//                                   <p className="font-medium text-xs">{reply.authorName}</p>
//                                   <p className="text-xs text-gray-500">
//                                     {formatDate(
//                                         typeof resume.uploadDate === 'string'
//                                           ? resume.uploadDate
//                                           : resume.uploadDate?.toDate?.().toISOString() ?? ''
//                                       )}
//                                   </p>
//                                 </div>
//                                 <p className="text-sm">{reply.text}</p>
//                               </div>
//                             ))}
//                           </div>
//                         )}
                        
//                         <Separator className="mt-4" />
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-gray-500">
//                     <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
//                     <p>No comments yet</p>
//                     <p className="text-sm">Add feedback to help the student improve their resume</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Quick Actions */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Quick Actions</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <Button 
//                   variant="outline" 
//                   className="w-full"
//                   onClick={() => handleStatusChange('reviewed')}
//                   disabled={selectedStatus === 'reviewed'}
//                 >
//                   <CheckCircle className="w-4 h-4 mr-2" />
//                   Mark as Reviewed
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   className="w-full"
//                   onClick={() => handleStatusChange('approved')}
//                   disabled={selectedStatus === 'approved'}
//                 >
//                   <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
//                   Approve Resume
//                 </Button>
//                 <Button 
//                   variant="outline" 
//                   className="w-full"
//                   onClick={() => handleStatusChange('in-review')}
//                   disabled={selectedStatus === 'in-review'}
//                 >
//                   <Clock className="w-4 h-4 mr-2" />
//                   Continue Review
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// ============================
// ReviewScreen.tsx (UPDATED)
// ============================

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

import { ImageWithFallback } from './ImageWithFallback';
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
                            setActivePin({ id: c.id, text: c.text, x: c.x!, y: c.y! });
                            setPinEditText(c.text);
                            setEditingPin(false);
                            setPopupPos(null);
                          }}
                        >
                          <div
                            className="
                              w-3 h-3 rounded-full bg-red-600 shadow-md
                              transition-all
                              group-hover:scale-125
                              group-hover:ring-2
                              group-hover:ring-black/40
                            "
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
