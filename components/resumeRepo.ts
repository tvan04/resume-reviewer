import app from '../src/firebaseConfig';
import {
  getFirestore,
  doc as fsDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
  deleteDoc,
} from 'firebase/firestore';
import { Resume, Comment, Reply } from '../src/App';

const db = getFirestore(app);

// SUBSCRIBE TO RESUME
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

      // Normalize Firestore Timestamps into ISO strings
      const normalized = {
        ...data,
        uploadDate:
          data.uploadDate instanceof Timestamp
            ? data.uploadDate.toDate().toISOString()
            : data.uploadDate ?? new Date().toISOString(),
        comments: Array.isArray(data.comments) ? data.comments : [],
        sharedWith: Array.isArray(data.sharedWith) ? data.sharedWith : [],
      };

      const resume: Resume = {
        id: data.id ?? snap.id,
        fileName: normalized.fileName ?? 'Untitled',
        studentId: normalized.studentId ?? '',
        studentName: normalized.studentName ?? '',
        uploadDate: normalized.uploadDate,
        status: normalized.status ?? 'pending',
        reviewerId: normalized.reviewerId ?? undefined,
        reviewerName: normalized.reviewerName ?? undefined,
        comments: normalized.comments,
        version: normalized.version ?? 1,
        downloadURL: normalized.downloadURL,
        storagePath: normalized.storagePath,
        sharedWith: normalized.sharedWith,
        ...normalized,
      };

      onData(resume);
    },
    (err) => {
      console.error('[subscribeToResume] error', err);
      onError?.(err.message || 'Failed to subscribe to resume');
    }
  );
}

// COMMENT HELPERS
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

// SHARING HELPERS
export async function updateResumeSharing(
  resumeId: string,
  sharedWith: { id: string; name: string }[]
) {
  const ref = fsDoc(db, 'resumes', resumeId);
  await updateDoc(ref, { sharedWith });
}

export async function addReviewerToResume(
  resumeId: string,
  reviewer: { id: string; name: string }
) {
  const ref = fsDoc(db, 'resumes', resumeId);
  await updateDoc(ref, {
    sharedWith: arrayUnion(reviewer),
  });
}

export async function removeReviewerFromResume(
  resumeId: string,
  reviewer: { id: string; name: string }
) {
  const ref = fsDoc(db, 'resumes', resumeId);
  await updateDoc(ref, {
    sharedWith: arrayRemove(reviewer),
  });
}

// ---------- Version history helpers ----------
export interface ResumeVersion {
  id?: string;
  versionNumber: number;
  fileName?: string;
  downloadURL?: string;
  storagePath?: string;
  uploadedAt?: any;
  uploadedBy?: string | null;
  note?: string;
}

/**
 * List versions for a resume (newest first)
 */
export async function listResumeVersions(resumeId: string): Promise<ResumeVersion[]> {
  const versionsRef = collection(db, 'resumes', resumeId, 'versions');
  const q = query(versionsRef, orderBy('versionNumber', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ResumeVersion[];
}

/**
 * Create a version record from the current resume doc.
 * Returns created version doc id.
 */
export async function createVersionFromCurrent(resumeId: string, note?: string) {
  const resumeRef = fsDoc(db, 'resumes', resumeId);
  const snap = await getDoc(resumeRef);
  if (!snap.exists()) throw new Error('Resume not found');

  const data = snap.data() as any;
  const versionPayload: Partial<ResumeVersion> = {
    versionNumber: data.version ?? 1,
    fileName: data.fileName,
    downloadURL: data.downloadURL,
    storagePath: data.storagePath,
    uploadedAt: data.uploadDate ?? serverTimestamp(),
    uploadedBy: data.studentId ?? null,
    note: note ?? undefined,
  };

  const versionsRef = collection(db, 'resumes', resumeId, 'versions');
  const added = await addDoc(versionsRef, versionPayload as any);
  return added.id;
}

/**
 * Restore a saved version as the current resume.
 * This creates a version for the current state (audit), then makes the selected version current.
 */
export async function restoreVersion(resumeId: string, versionId: string) {
  const resumeRef = fsDoc(db, 'resumes', resumeId);
  const versionRef = fsDoc(db, 'resumes', resumeId, 'versions', versionId);

  await runTransaction(db, async (tx) => {
    const resumeSnap = await tx.get(resumeRef);
    if (!resumeSnap.exists()) throw new Error('Resume not found');

    const versionSnap = await tx.get(versionRef);
    if (!versionSnap.exists()) throw new Error('Version not found');

    const current = resumeSnap.data() as any;
    const versionData = versionSnap.data() as any;

    // create an audit version for current state
    const versionsColl = collection(db, 'resumes', resumeId, 'versions');
    const newVersionDocRef = fsDoc(db, 'resumes', resumeId, 'versions', (await addDoc(versionsColl, {})).id);
    // Note: created a placeholder doc above to get an id; set below with real payload
    const auditPayload = {
      versionNumber: current.version ?? 1,
      fileName: current.fileName,
      downloadURL: current.downloadURL,
      storagePath: current.storagePath,
      uploadedAt: current.uploadDate ?? serverTimestamp(),
      uploadedBy: current.studentId ?? null,
      note: 'auto-created before restore',
    };
    tx.set(newVersionDocRef, auditPayload as any);

    // update resume doc to point to selected version file
    const newVersionNumber = (current.version ?? 1) + 1;
    tx.update(resumeRef, {
      fileName: versionData.fileName,
      downloadURL: versionData.downloadURL,
      storagePath: versionData.storagePath,
      uploadDate: serverTimestamp(),
      version: newVersionNumber,
    });
  });
}

/**
 * Delete a specific version (not the current resume).
 */
export async function deleteResumeVersion(resumeId: string, versionId: string) {
  const versionRef = fsDoc(db, 'resumes', resumeId, 'versions', versionId);
  await deleteDoc(versionRef);
}