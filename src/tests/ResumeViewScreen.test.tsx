import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ResumeViewScreen } from "../../components/ResumeViewScreen";

// ---- Define mock variables FIRST ----
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockDeleteDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockSubscribeToResume = jest.fn();
const mockAddReplyToComment = jest.fn();
const mockToggleCommentResolved = jest.fn();
const mockGetDocs = jest.fn().mockResolvedValue({ docs: [] });
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();
const mockFsDoc = jest.fn();
const mockTimestampNow = jest.fn(() => "mockTimestamp");

// ---- Suppress act() warnings ----
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((msg) => {
    if (typeof msg === "string" && msg.includes("act")) {
      return; // ignore React act() warnings
    }
    // Otherwise, print the message normally using the original console
    process.stderr.write(msg + "\n");
  });
  window.alert = jest.fn();
});


// ---- MOCK ROUTER ----
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// ---- MOCK FIRESTORE ----
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  doc: (...args: any[]) => mockFsDoc(...args),
  fsDoc: (...args: any[]) => mockFsDoc(...args),
  deleteDoc: (...args: any[]) => mockDeleteDoc(...args),
  updateDoc: (...args: any[]) => mockUpdateDoc(...args),
  collection: jest.fn(),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: { now: () => mockTimestampNow() },
  arrayUnion: (...args: any[]) => args,
  arrayRemove: (...args: any[]) => args,
}));

// ---- MOCK STORAGE ----
jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
}));

// ---- MOCK resumeRepo ----
jest.mock("../../components/resumeRepo", () => ({
  subscribeToResume: (...args: any[]) => mockSubscribeToResume(...args),
  addReplyToComment: (...args: any[]) => mockAddReplyToComment(...args),
  toggleCommentResolved: (...args: any[]) => mockToggleCommentResolved(...args),
}));

// ---- MOCK COMPONENTS ----
jest.mock("../../components/Navigation", () => ({
  NavigationBar: ({ user }: any) => <div data-testid="nav">Nav for {user.name}</div>,
}));

jest.mock("../../components/ImageWithFallback", () => ({
  ImageWithFallback: ({ alt }: any) => <img alt={alt} />,
}));

jest.mock("../../src/firebaseConfig", () => ({}));

// ---- MOCK DATA ----
const mockUser = {
  id: "student1",
  name: "Student One",
  email: "student@test.com",
  type: "student" as const,
};

const mockResume = {
  id: "r1",
  fileName: "resume.pdf",
  studentName: "Student One",
  uploadDate: new Date().toISOString(),
  version: 1,
  status: "pending",
  comments: [
    {
      id: "c1",
      text: "Fix formatting",
      authorId: "reviewer1",
      authorName: "Reviewer",
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    },
  ],
  sharedWithIds: [],
  downloadURL: "https://example.com/resume.pdf",
};

// ---- TESTS ----
describe("ResumeViewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockReturnValue(() => {});
    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading resume/i)).toBeInTheDocument();
  });

  it("shows Resume not found when no ID", async () => {
    mockUseParams.mockReturnValue({ id: undefined });
    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText(/Resume not found/i)).toBeInTheDocument()
    );
  });

  it("renders resume details after subscription", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getAllByText(/resume.pdf/i).length).toBeGreaterThan(0)
    );

    expect(
      screen.getByRole("button", { name: /Replace Resume/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Feedback \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Fix formatting/i)).toBeInTheDocument();
  });

  it("calls addReplyToComment when replying", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByPlaceholderText(/Write a reply/i));

    fireEvent.change(screen.getByPlaceholderText(/Write a reply/i), {
      target: { value: "Thanks!" },
    });
    fireEvent.click(screen.getByText(/Reply/i));

    await waitFor(() =>
      expect(mockAddReplyToComment).toHaveBeenCalledWith(
        "r1",
        "c1",
        expect.any(Object)
      )
    );
  });

  it("marks comment as resolved", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/Mark Resolved/i));
    fireEvent.click(screen.getByText(/Mark Resolved/i));

    await waitFor(() =>
      expect(mockToggleCommentResolved).toHaveBeenCalledWith("r1", "c1", true)
    );
  });

  it("handles replace resume flow", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    const fakeFile = new File(["data"], "newResume.pdf", {
      type: "application/pdf",
    });
    mockUploadBytes.mockResolvedValue({ ref: {} });
    mockGetDownloadURL.mockResolvedValue("https://example.com/newResume.pdf");

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getAllByRole("button", { name: /Replace Resume/i }).length
      ).toBeGreaterThan(0)
    );

    const replaceButton = screen.getByRole("button", {
      name: /Replace Resume/i,
    });

    const fileInput = document.getElementById("replaceFileInput") as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    Object.defineProperty(fileInput, "files", { value: [fakeFile] });
    fireEvent.change(fileInput);

    fireEvent.click(replaceButton);

    await waitFor(() => expect(mockUpdateDoc).toHaveBeenCalled());
  });

  it("shows error message when Firestore subscription fails", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, _next, onError) => {
      onError("Firestore failed");
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByText(/failed/i)).toBeInTheDocument()
    );
  });

  it("renders fallback image when downloadURL is missing", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    const resumeNoURL = { ...mockResume, downloadURL: "" };
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(resumeNoURL);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.getByAltText(/resume.pdf/i)).toBeInTheDocument()
    );
  });

  it("alerts when replacing with non-PDF file", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    window.alert = jest.fn();

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    const badFile = new File(["text"], "resume.txt", { type: "text/plain" });
    const fileInput = document.getElementById("replaceFileInput") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { value: [badFile] });
    fireEvent.change(fileInput);

    await waitFor(() => {
      fireEvent.click(screen.getAllByRole("button", { name: /Replace Resume/i })[0]);
    });

    expect(window.alert).toHaveBeenCalledWith("Please upload a PDF file.");
  });


  it("shows alert when uploadBytes throws an error", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });
    mockUploadBytes.mockRejectedValueOnce(new Error("Upload failed"));
    window.alert = jest.fn();

    const fakeFile = new File(["data"], "resume.pdf", { type: "application/pdf" });

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    const fileInput = document.getElementById("replaceFileInput") as HTMLInputElement;
    Object.defineProperty(fileInput, "files", { value: [fakeFile] });
    fireEvent.change(fileInput);

    fireEvent.click(screen.getAllByRole("button", { name: /Replace Resume/i })[0]);

    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(
        "There was an error replacing the resume. Please try again."
      )
    );
  });

  it("does not show Replace Resume for reviewer", async () => {
    const reviewerUser = { ...mockUser, type: "reviewer" as const };
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ResumeViewScreen user={reviewerUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(screen.queryByText(/Replace Resume/i)).not.toBeInTheDocument()
    );
  });

  it("alerts when assignReviewer fails", async () => {
    mockUseParams.mockReturnValue({ id: "r1" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "rev1",
          data: () => ({ name: "Reviewer 1", email: "r1@test.com", role: "reviewer" }),
        },
      ],
    });

    mockUpdateDoc.mockRejectedValueOnce(new Error("Firestore failure"));

    render(
      <MemoryRouter>
        <ResumeViewScreen user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByRole("combobox"));
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "rev1" } });

    const assignButton = screen.getByRole("button", { name: /Assign Reviewer/i });
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Failed to assign reviewer. Please try again.");
    });
  });
});
