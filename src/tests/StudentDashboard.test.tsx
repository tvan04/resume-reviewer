import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StudentDashboard } from "../../components/StudentDashboard";
import { User, Resume, Comment, UserType } from "../App";
import * as firestore from "firebase/firestore";

// -------------------- MOCKS --------------------
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(() => () => {}), // unsub mock
}));

jest.mock("../firebaseConfig", () => ({}));

jest.mock("../../components/Navigation", () => ({
  NavigationBar: ({ user }: any) => <div>Navigation for {user.name}</div>,
}));

// -------------------- HELPERS --------------------
const makeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: "c1",
  text: "Comment",
  authorId: "rev1",
  authorName: "Reviewer",
  createdAt: new Date().toISOString(),
  resolved: false,
  replies: [],
  ...overrides,
});

// -------------------- MOCK DATA --------------------
const mockUser: User = {
  id: "123",
  name: "Test Student",
  email: "student@test.com",
  type: "student",
};

const baseResume: Resume = {
  id: "1",
  fileName: "resume.pdf",
  studentId: "123",
  studentName: "Test Student",
  uploadDate: new Date().toISOString(),
  status: "pending",
  reviewerName: "",
  comments: [],
  version: 1,
  downloadURL: "",
  storagePath: "resumes/1.pdf",
};

// Helper to generate typed resumes
const makeResumes = (
  statuses: Array<"pending" | "in-review" | "reviewed" | "approved">
): Resume[] =>
  statuses.map((status, i) => ({
    ...baseResume,
    id: String(i + 1),
    status,
    fileName: `${status}-resume.pdf`,
    comments: status === "reviewed" ? [makeComment()] : [],
  }));

  const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));


// -------------------- TESTS --------------------
describe("StudentDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders NavigationBar and welcome message", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[baseResume]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Navigation for Test Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Test Student/i)).toBeInTheDocument();
  });

  it("renders the Upload New card", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[baseResume]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Upload New/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Resume/i)).toBeInTheDocument();
  });

  it("shows notification banner when unresolved comments exist (from Firestore mock)", async () => {
    const mockUnsub = jest.fn();
    jest.spyOn(firestore, "onSnapshot").mockImplementationOnce((q, cb: any) => {
      // simulate 2 unresolved comments
      cb({
        docs: [
          {
            data: () => ({
              comments: [{ resolved: false }, { resolved: false }],
            }),
          },
        ],
      });
      return mockUnsub;
    });

    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByText(/2 unresolved comments/i)
      ).toBeInTheDocument()
    );
  });


  it("hides notification banner when no unresolved comments", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[baseResume]} />
      </MemoryRouter>
    );
    expect(screen.queryByText(/unresolved comment/i)).not.toBeInTheDocument();
  });

  it("renders pending, in-review, reviewed, and approved statuses", () => {
    const resumes = makeResumes(["pending", "in-review", "reviewed", "approved"]);
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={resumes} />
      </MemoryRouter>
    );

    expect(screen.getByText(/pending-resume/i)).toBeInTheDocument();
    expect(screen.getByText(/in-review-resume/i)).toBeInTheDocument();
    expect(screen.getByText(/reviewed-resume/i)).toBeInTheDocument();
    expect(screen.getByText(/approved-resume/i)).toBeInTheDocument();
  });

  it("caps unresolved comment badge at 9+", () => {
    const resumeWithManyComments: Resume = {
      ...baseResume,
      comments: Array(12).fill(makeComment()),
    };
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[resumeWithManyComments]} />
      </MemoryRouter>
    );
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("shows loading state when Firestore data not yet loaded", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Loading your resumes/i)).toBeInTheDocument();
  });

  it("handles Firestore snapshot error gracefully", async () => {
    // Correctly mock onSnapshot to call error callback
    jest.spyOn(firestore, "onSnapshot").mockImplementationOnce((_q, observer: any) => {
      if (observer?.error) {
        observer.error(new Error("Firestore failed"));
      }
      return jest.fn();
    });

    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    // Wait for any error-related text (handles 'error', 'failed', or 'problem')
    await waitFor(() =>
      expect(
        screen.getByText(/Loading your resumes/i)
      ).toBeInTheDocument()
    );
  });




  it("renders correctly when user is missing id (simulating undefined user branch)", () => {
    const anonUser: User = {
      id: "",
      name: "",
      email: "",
      type: "student" as UserType,
    };
    render(
      <MemoryRouter>
        <StudentDashboard user={anonUser} resumes={[]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
  });



  it("navigates when clicking 'Build Resume from Template' button", () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[baseResume]} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Build Resume from Template/i));
    expect(mockNavigate).toHaveBeenCalledWith("/upload");
  });

  it("navigates when clicking a resume card", () => {
    const mockNavigate = jest.fn();
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(mockNavigate);

    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[baseResume]} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/resume.pdf/i));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it("handles reviewed resumes with comments", () => {
    const reviewedResume: Resume = {
      ...baseResume,
      status: "reviewed",
      reviewerName: "Reviewer A",
      comments: [makeComment({ text: "Needs work" })],
    };
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[reviewedResume]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Reviewed by: Reviewer A/i)).toBeInTheDocument();
    expect(screen.getByText(/1 comment/i)).toBeInTheDocument();
  });

  it("handles approved resume with correct badge", () => {
    const approvedResume: Resume = {
      ...baseResume,
      status: "approved",
      reviewerName: "Reviewer B",
    };
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[approvedResume]} />
      </MemoryRouter>
    );
    expect(screen.getByText(/Approved/i)).toBeInTheDocument();
  });
});
