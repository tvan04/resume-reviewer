// components/resumeRepo.ts
import app from '../src/firebaseConfig';
import {
  getFirestore,
  doc as fsDoc,
  getDoc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { Resume, Comment, Reply } from '../src/App';

const db = getFirestore(app);

export function subscribeToResume(
  resumeId: string,
  onData: (resume: Resume | null) => void,
  onError?: (msg: string) => void
) {
  const ref = fsDoc(db, 'resumes', resumeId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const data = snap.data() as any;
      const resume: Resume = {
        id: data.id ?? snap.id,
        fileName: data.fileName ?? 'Untitled',
        studentId: data.studentId ?? '',
        studentName: data.studentName ?? '',
        uploadDate: data.uploadDate ?? new Date().toISOString(),
        status: data.status ?? 'pending',
        reviewerId: data.reviewerId ?? undefined,
        reviewerName: data.reviewerName ?? undefined,
        comments: Array.isArray(data.comments) ? data.comments : [],
        version: data.version ?? 1,
        downloadURL: data.downloadURL,
        storagePath: data.storagePath,
        ...data,
      };
      onData(resume);
    },
    (err) => {
      console.error('[subscribeToResume] error', err);
      onError?.(err.message || 'Failed to subscribe to resume');
    }
  );
}

async function getResumeComments(resumeId: string) {
  const ref = fsDoc(db, 'resumes', resumeId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ref, comments: [] as Comment[] };
  const data = snap.data() as any;
  const comments = Array.isArray(data.comments) ? (data.comments as Comment[]) : [];
  return { ref, comments };
}

export async function addCommentToResume(
  resumeId: string,
  comment: Omit<Comment, 'id' | 'createdAt' | 'replies'>
) {
  const { ref, comments } = await getResumeComments(resumeId);
  const newComment: Comment = {
    ...comment,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    replies: [],
  };
  await updateDoc(ref, { comments: [...comments, newComment] });
}

export async function editCommentInResume(
  resumeId: string,
  commentId: string,
  newText: string
) {
  const { ref, comments } = await getResumeComments(resumeId);
  const updated = comments.map((c) => (c.id === commentId ? { ...c, text: newText } : c));
  await updateDoc(ref, { comments: updated });
}

export async function deleteCommentFromResume(resumeId: string, commentId: string) {
  const { ref, comments } = await getResumeComments(resumeId);
  const filtered = comments.filter((c) => c.id !== commentId);
  await updateDoc(ref, { comments: filtered });
}

export async function toggleCommentResolved(
  resumeId: string,
  commentId: string,
  resolved: boolean
) {
  const { ref, comments } = await getResumeComments(resumeId);
  const updated = comments.map((c) => (c.id === commentId ? { ...c, resolved } : c));
  await updateDoc(ref, { comments: updated });
}

export async function addReplyToComment(
  resumeId: string,
  commentId: string,
  reply: Omit<Reply, 'id' | 'createdAt'>
) {
  const { ref, comments } = await getResumeComments(resumeId);
  const updated = comments.map((c) => {
    if (c.id !== commentId) return c;
    const newReply: Reply = {
      ...reply,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return { ...c, replies: [...(c.replies || []), newReply] };
  });
  await updateDoc(ref, { comments: updated });
}

export async function updateResumeStatus(resumeId: string, status: Resume['status']) {
  const ref = fsDoc(db, 'resumes', resumeId);
  await updateDoc(ref, { status });
}