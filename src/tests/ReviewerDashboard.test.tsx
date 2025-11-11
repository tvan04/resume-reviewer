import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ReviewerDashboard } from "../../components/ReviewerDashboard";

// ---- MOCKS ----
const mockNavigate = jest.fn();
const mockOnSnapshot = jest.fn();
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockOrderBy = jest.fn();
const mockWhere = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  where: (...args: any[]) => mockWhere(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
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
  id: "reviewer123",
  name: "John Reviewer",
  email: "john@test.com",
  type: "reviewer" as const,
};

const mockResumes = [
  {
    id: "1",
    fileName: "resume_pending.pdf",
    studentName: "Alice",
    sharedWithIds: ["reviewer123"],
    uploadDate: new Date().toISOString(),
    status: "pending",
    comments: [],
  },
  {
    id: "2",
    fileName: "resume_inreview.pdf",
    studentName: "Bob",
    sharedWithIds: ["reviewer123"],
    uploadDate: new Date().toISOString(),
    status: "in-review",
    comments: [],
  },
  {
    id: "3",
    fileName: "resume_reviewed.pdf",
    studentName: "Carol",
    sharedWithIds: ["reviewer123"],
    uploadDate: new Date().toISOString(),
    status: "reviewed",
    comments: [{ text: "Nice work" }],
  },
  {
    id: "4",
    fileName: "resume_approved.pdf",
    studentName: "Dave",
    sharedWithIds: ["reviewer123"],
    uploadDate: new Date().toISOString(),
    status: "approved",
    comments: [],
  },
];

const mockSnapshot = {
  docs: mockResumes.map((r) => ({
    id: r.id,
    data: () => r,
  })),
};

// ---- TESTS ----
describe("ReviewerDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockOnSnapshot.mockImplementationOnce(() => {
      // Simulate Firestore subscription, but don’t call callback
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewerDashboard user={mockUser} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading resumes/i)).toBeInTheDocument();
  });

  it("renders resumes by status correctly after snapshot", async () => {
    // Mock onSnapshot callback behavior
    mockOnSnapshot.mockImplementation((_query, onNext) => {
      onNext(mockSnapshot);
      return jest.fn(); // unsubscribe function
    });

    render(
      <MemoryRouter>
        <ReviewerDashboard user={mockUser} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome, John Reviewer/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Resumes in Progress/i)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /New Submissions/i, level: 2 })
    ).toBeInTheDocument();
    expect(screen.getByText(/Reviewed Resumes/i)).toBeInTheDocument();
    expect(screen.getByText(/Approved Resumes/i)).toBeInTheDocument();

    // Check presence of one of each type
    expect(screen.getByText(/resume_pending.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/resume_inreview.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/resume_reviewed.pdf/i)).toBeInTheDocument();
    expect(screen.getByText(/resume_approved.pdf/i)).toBeInTheDocument();
  });

  it("shows fallback message when no new submissions", async () => {
    const noPending = {
      docs: mockResumes
        .filter((r) => r.status !== "pending")
        .map((r) => ({ id: r.id, data: () => r })),
    };

    mockOnSnapshot.mockImplementation((_query, onNext) => {
      onNext(noPending);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewerDashboard user={mockUser} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No new submissions/i)).toBeInTheDocument();
    });
  });

  it("navigates to review page when clicking a resume card", async () => {
    mockOnSnapshot.mockImplementation((_query, onNext) => {
      onNext(mockSnapshot);
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewerDashboard user={mockUser} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/resume_pending.pdf/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/resume_pending.pdf/i));
    expect(mockNavigate).toHaveBeenCalledWith("/review/1");
  });

  it("handles Firestore error gracefully", async () => {
    mockOnSnapshot.mockImplementation((_query, _onNext, onError) => {
      onError(new Error("Firestore connection failed"));
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <ReviewerDashboard user={mockUser} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error: Firestore connection failed/i)).toBeInTheDocument();
    });
  });

  it("handles missing user ID gracefully", () => {
    const userWithoutId = { ...mockUser, id: undefined as any };

    mockOnSnapshot.mockImplementation(() => jest.fn());

    render(
      <MemoryRouter>
        <ReviewerDashboard user={userWithoutId} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    // Should not crash — verify that something basic renders
    expect(screen.getByText(/Loading resumes/i)).toBeInTheDocument();
  });


  it("cleans up subscription object correctly", async () => {
    const unsubscribeMock = jest.fn();
    mockOnSnapshot.mockImplementation((_query, onNext) => {
      onNext(mockSnapshot);
      return { unsubscribe: unsubscribeMock };
    });

    const { unmount } = render(
      <MemoryRouter>
        <ReviewerDashboard user={mockUser} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    unmount();
    expect(unsubscribeMock).toHaveBeenCalled();
  });


  it("shows awaiting review notification when pending resumes exist", async () => {
    const snapshotWithPending = {
      docs: mockResumes
        .filter((r) => r.status === "pending" || r.status === "in-review")
        .map((r) => ({ id: r.id, data: () => r })),
    };

    mockOnSnapshot
      // First useEffect (awaitingReviewCount)
      .mockImplementationOnce((_query, onNext) => {
        onNext(snapshotWithPending);
        return jest.fn();
      })
      // Second useEffect (resumes)
      .mockImplementationOnce((_query, onNext) => {
        onNext(snapshotWithPending);
        return jest.fn();
      });

    render(
      <MemoryRouter>
        <ReviewerDashboard user={mockUser} resumes={[]} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/New submissions:/i)).toBeInTheDocument();
    });
  });

});
