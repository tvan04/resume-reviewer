import {
  subscribeToResume,
  addCommentToResume,
  editCommentInResume,
  deleteCommentFromResume,
  toggleCommentResolved,
  addReplyToComment,
  updateResumeStatus,
  updateResumeSharing,
  addReviewerToResume,
  removeReviewerFromResume,
} from "../../components/resumeRepo";

import {
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";

// ------------------------
// 🔧 Mock Firestore methods
// ------------------------
jest.mock("firebase/firestore", () => {
  class MockTimestamp {
    toDate() {
      return new Date();
    }
  }

  return {
    getFirestore: jest.fn(),
    doc: jest.fn(() => ({ id: "mockDocRef" })),
    getDoc: jest.fn(),
    onSnapshot: jest.fn(),
    updateDoc: jest.fn(),
    arrayUnion: jest.fn((v) => v),
    arrayRemove: jest.fn((v) => v),
    Timestamp: MockTimestamp,
  };
});



const mockGetDoc = getDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockOnSnapshot = onSnapshot as jest.Mock;

// ------------------------
// Mock crypto for UUIDs
// ------------------------
global.crypto = {
  randomUUID: jest.fn(() => "uuid-1234"),
} as any;

// ------------------------
// Common mock data
// ------------------------
const mockComment = {
  id: "c1",
  text: "Old comment",
  authorId: "r1",
  authorName: "Reviewer",
  createdAt: new Date().toISOString(),
  resolved: false,
  replies: [],
};

const mockSnap = (data: any) => ({
  exists: () => !!data,
  id: "resume1",
  data: () => data,
});

// ------------------------
// Tests
// ------------------------
describe("resumeRepo Firestore logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------
  // SUBSCRIBE TO RESUME
  // ------------------------
  it("calls onData with resume when snapshot exists", () => {
    const mockData = { fileName: "resume.pdf", uploadDate: new (Timestamp as any)() };
    const mockCb = jest.fn();
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      onNext(mockSnap(mockData));
      return jest.fn();
    });

    const unsub = subscribeToResume("resume1", mockCb);
    expect(mockCb).toHaveBeenCalledWith(expect.objectContaining({ fileName: "resume.pdf" }));
    expect(typeof unsub).toBe("function");
  });

  it("calls onData(null) when snapshot does not exist", () => {
    const mockCb = jest.fn();
    mockOnSnapshot.mockImplementation((_ref, onNext) => {
      onNext(mockSnap(null));
      return jest.fn();
    });

    subscribeToResume("resume1", mockCb);
    expect(mockCb).toHaveBeenCalledWith(null);
  });

  it("calls onError when snapshot errors", () => {
    const mockCb = jest.fn();
    const mockErr = jest.fn();
    mockOnSnapshot.mockImplementation((_ref, _next, onError) => {
      onError(new Error("Firestore failed"));
      return jest.fn();
    });

    subscribeToResume("resume1", mockCb, mockErr);
    expect(mockErr).toHaveBeenCalledWith("Firestore failed");
  });

  // ------------------------
  // COMMENT HELPERS
  // ------------------------
  it("adds a comment to resume", async () => {
    mockGetDoc.mockResolvedValue(mockSnap({ comments: [] }));
    await addCommentToResume("resume1", {
      text: "New Comment",
      authorId: "a1",
      authorName: "Alice",
      resolved: false,
    });
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      comments: [expect.objectContaining({ text: "New Comment" })],
    });
  });

  it("edits an existing comment", async () => {
    mockGetDoc.mockResolvedValue(mockSnap({ comments: [mockComment] }));
    await editCommentInResume("resume1", "c1", "Updated text");
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      comments: [expect.objectContaining({ text: "Updated text" })],
    });
  });

  it("deletes a comment", async () => {
    mockGetDoc.mockResolvedValue(mockSnap({ comments: [mockComment] }));
    await deleteCommentFromResume("resume1", "c1");
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), { comments: [] });
  });

  it("toggles comment resolved state", async () => {
    mockGetDoc.mockResolvedValue(mockSnap({ comments: [mockComment] }));
    await toggleCommentResolved("resume1", "c1", true);
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      comments: [expect.objectContaining({ resolved: true })],
    });
  });

  it("adds a reply to a comment", async () => {
    mockGetDoc.mockResolvedValue(mockSnap({ comments: [mockComment] }));
    await addReplyToComment("resume1", "c1", {
      authorId: "s1",
      authorName: "Student",
      text: "Thank you!",
    });
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      comments: [
        expect.objectContaining({
          replies: [expect.objectContaining({ text: "Thank you!" })],
        }),
      ],
    });
  });

  // ------------------------
  // RESUME STATUS + SHARING
  // ------------------------
  it("updates resume status", async () => {
    await updateResumeStatus("resume1", "reviewed");
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), { status: "reviewed" });
  });

  it("updates resume sharing list", async () => {
    await updateResumeSharing("resume1", [{ id: "r1", name: "Reviewer" }]);
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      sharedWith: [{ id: "r1", name: "Reviewer" }],
    });
  });

  it("adds a reviewer to resume using arrayUnion", async () => {
    await addReviewerToResume("resume1", { id: "r1", name: "Reviewer" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      sharedWith: arrayUnion({ id: "r1", name: "Reviewer" }),
    });
  });

  it("removes a reviewer from resume using arrayRemove", async () => {
    await removeReviewerFromResume("resume1", { id: "r1", name: "Reviewer" });
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), {
      sharedWith: arrayRemove({ id: "r1", name: "Reviewer" }),
    });
  });
});
