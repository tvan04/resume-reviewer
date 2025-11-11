import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReviewScreen } from "../../components/ReviewScreen";

// ---- MOCK NAVIGATION ----
const mockNavigate = jest.fn();
const mockUseParams = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
}));

// ---- MOCK REPO FUNCTIONS ----
const mockSubscribeToResume = jest.fn();
const mockAddCommentToResume = jest.fn();
const mockEditCommentInResume = jest.fn();
const mockDeleteCommentFromResume = jest.fn();
const mockUpdateResumeStatus = jest.fn();

jest.mock("../../components/resumeRepo", () => ({
  subscribeToResume: (...args: any[]) => mockSubscribeToResume(...args),
  addCommentToResume: (...args: any[]) => mockAddCommentToResume(...args),
  editCommentInResume: (...args: any[]) => mockEditCommentInResume(...args),
  deleteCommentFromResume: (...args: any[]) => mockDeleteCommentFromResume(...args),
  updateResumeStatus: (...args: any[]) => mockUpdateResumeStatus(...args),
}));

jest.mock("../../components/Navigation", () => ({
  NavigationBar: ({ user }: any) => <div data-testid="nav">Nav for {user.name}</div>,
}));

jest.mock("../../components/ImageWithFallback", () => ({
  ImageWithFallback: ({ alt }: any) => <img alt={alt} />,
}));

jest.mock("../../src/firebaseConfig", () => ({}));

// ---- MOCK DATA ----
const mockUser = {
  id: "reviewer1",
  name: "Reviewer One",
  email: "reviewer@test.com",
  type: "reviewer" as const,
};

const mockResume = {
  id: "resume123",
  fileName: "resume.pdf",
  studentName: "Alice",
  uploadDate: new Date().toISOString(),
  version: 2,
  status: "pending",
  comments: [
    {
      id: "c1",
      text: "Looks good",
      authorId: "reviewer1",
      authorName: "Reviewer One",
      createdAt: new Date().toISOString(),
      resolved: false,
      replies: [],
    },
  ],
  sharedWithIds: ["reviewer1"],
  downloadURL: "https://example.com/resume.pdf",
};

// ---- TESTS ----
describe("ReviewScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockUseParams.mockReturnValue({ id: "resume123" });
    mockSubscribeToResume.mockReturnValue(() => {});
    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading resume/i)).toBeInTheDocument();
  });

  it("shows error when no resume id", async () => {
    mockUseParams.mockReturnValue({ id: undefined });
    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Resume not found/i)).toBeInTheDocument();
      expect(screen.getByText(/Back to Dashboard/i)).toBeInTheDocument();
    });
  });

  it("renders resume details after successful subscription", async () => {
    mockUseParams.mockReturnValue({ id: "resume123" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Reviewing: resume.pdf/i)).toBeInTheDocument();
      expect(screen.getByText(/Student: Alice/i)).toBeInTheDocument();
      expect(screen.getByText(/Resume Details/i)).toBeInTheDocument();
      expect(screen.getByText(/Add Feedback/i)).toBeInTheDocument();
      expect(screen.getByText(/Comments \(1\)/i)).toBeInTheDocument();
    });
  });

  it("calls addCommentToResume when adding comment", async () => {
    mockUseParams.mockReturnValue({ id: "resume123" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByPlaceholderText(/Provide constructive feedback/i));

    fireEvent.change(screen.getByPlaceholderText(/Provide constructive feedback/i), {
      target: { value: "Great job!" },
    });
    fireEvent.click(screen.getByText(/Add Comment/i));

    await waitFor(() => {
      expect(mockAddCommentToResume).toHaveBeenCalledWith(
        "resume123",
        expect.objectContaining({
          text: "Great job!",
          authorId: "reviewer1",
          authorName: "Reviewer One",
        })
      );
    });
  });

  it("handles status change via dropdown", async () => {
    mockUseParams.mockReturnValue({ id: "resume123" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/Reviewing: resume.pdf/i));

    const selectTrigger = screen.getByRole("combobox");
    fireEvent.click(selectTrigger);
    // pick the first "Reviewed" — the one in the dropdown menu, not the button
    const reviewedOptions = screen.getAllByText(/^Reviewed$/i);
    fireEvent.click(reviewedOptions[0]);

    await waitFor(() => {
      expect(mockUpdateResumeStatus).toHaveBeenCalledWith("resume123", "reviewed");
    });
  });

  it("handles subscription error", async () => {
    mockUseParams.mockReturnValue({ id: "resume123" });
    mockSubscribeToResume.mockImplementation((_id, _onNext, onError) => {
      onError("Firestore error");
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Resume not found/i)).toBeInTheDocument();
      expect(screen.getByText(/Firestore error/i)).toBeInTheDocument();
    });
  });

  it("allows editing an existing comment", async () => {
    mockUseParams.mockReturnValue({ id: "resume123" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/Looks good/i));
    fireEvent.click(screen.getByText(/Edit/i));

    const textarea = screen.getByDisplayValue(/Looks good/i);
    fireEvent.change(textarea, { target: { value: "Updated comment" } });
    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(mockEditCommentInResume).toHaveBeenCalledWith("resume123", "c1", "Updated comment");
    });
  });

  it("navigates back to dashboard", async () => {
    mockUseParams.mockReturnValue({ id: "resume123" });
    mockSubscribeToResume.mockImplementation((_id, onNext) => {
      onNext(mockResume);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewScreen user={mockUser} onAddComment={jest.fn()} onStatusUpdate={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => screen.getByText(/Back to Dashboard/i));
    fireEvent.click(screen.getByText(/Back to Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith("/reviewer");
  });
});
