import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StudentDashboard } from "../../components/StudentDashboard";
import { User, Resume, Comment, UserType } from "../App";
import * as firestore from "firebase/firestore";

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  onSnapshot: jest.fn(() => () => { }),
}));

jest.mock("../firebaseConfig", () => ({}));

jest.mock("../../components/Navigation", () => ({
  NavigationBar: ({ user }: any) => <div>Navigation for {user.name}</div>,
}));

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

describe("StudentDashboard Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders NavigationBar and welcome message", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[baseResume]} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/Navigation for Test Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Test Student/i)).toBeInTheDocument();
  });

  it("renders the Upload New card", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[baseResume]} />
        </MemoryRouter>
      );
    });
    expect(screen.getByText(/Upload New/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Resume/i)).toBeInTheDocument();
  });

  it("shows notification banner when unresolved comments exist (from Firestore mock)", async () => {
    const mockUnsub = jest.fn();
    jest.spyOn(firestore, "onSnapshot").mockImplementationOnce((q, cb: any) => {
      q;
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

    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[]} />
        </MemoryRouter>
      );
    });

    await waitFor(() =>
      expect(
        screen.getByText(/2 unresolved comments/i)
      ).toBeInTheDocument()
    );
  });

  it("hides notification banner when no unresolved comments", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[baseResume]} />
        </MemoryRouter>
      );
    });
    expect(screen.queryByText(/unresolved comment/i)).not.toBeInTheDocument();
  });

  it("renders pending, in-review, reviewed, and approved statuses", async () => {
    const resumes = makeResumes(["pending", "in-review", "reviewed", "approved"]);
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={resumes} />
        </MemoryRouter>
      );
    });

    expect(screen.getByText(/pending-resume/i)).toBeInTheDocument();
    expect(screen.getByText(/in-review-resume/i)).toBeInTheDocument();
    expect(screen.getByText(/reviewed-resume/i)).toBeInTheDocument();
    expect(screen.getByText(/approved-resume/i)).toBeInTheDocument();
  });

  it("caps unresolved comment badge at 9+", async () => {
    const resumeWithManyComments: Resume = {
      ...baseResume,
      comments: Array(12).fill(makeComment()),
    };
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[resumeWithManyComments]} />
        </MemoryRouter>
      );
    });
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("shows loading state when Firestore data not yet loaded", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[]} />
        </MemoryRouter>
      );
    });
    expect(screen.getByText(/Loading your resumes/i)).toBeInTheDocument();
  });

  it("handles Firestore snapshot error gracefully", async () => {
    jest.spyOn(firestore, "onSnapshot").mockImplementationOnce((_q, observer: any) => {
      if (observer?.error) {
        observer.error(new Error("Firestore failed"));
      }
      return jest.fn();
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[]} />
        </MemoryRouter>
      );
    });

    await waitFor(() =>
      expect(
        screen.getByText(/Loading your resumes/i)
      ).toBeInTheDocument()
    );
  });

  it("renders correctly when user is missing id (simulating undefined user branch)", async () => {
    const anonUser: User = {
      id: "",
      name: "",
      email: "",
      type: "student" as UserType,
    };
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={anonUser} resumes={[]} />
        </MemoryRouter>
      );
    });
    expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
  });

  it("navigates when clicking a resume card", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[baseResume]} />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/resume.pdf/i)).toBeInTheDocument();
    });

    const fileNameElement = screen.getByText(/resume.pdf/i);
    const cardContent = fileNameElement.closest('[class*="CardContent"]') || fileNameElement.closest('.p-0');
    expect(cardContent).toBeInTheDocument();

    const card = cardContent?.parentElement;
    const clickableOverlay = card?.querySelector('.absolute.inset-0.z-10.cursor-pointer');

    if (clickableOverlay) {
      await act(async () => {
        fireEvent.click(clickableOverlay);
      });
      expect(mockNavigate).toHaveBeenCalledWith("/resume/1");
    } else {
      await act(async () => {
        fireEvent.click(fileNameElement);
      });
      expect(mockNavigate).toHaveBeenCalled();
    }
  });

  it("handles reviewed resumes with comments", async () => {
    const reviewedResume: Resume = {
      ...baseResume,
      status: "reviewed",
      reviewerName: "Reviewer A",
      comments: [makeComment({ text: "Needs work" })],
    };
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[reviewedResume]} />
        </MemoryRouter>
      );
    });
    expect(screen.getByText(/Reviewed by: Reviewer A/i)).toBeInTheDocument();
    expect(screen.getByText(/1 comment/i)).toBeInTheDocument();
  });

  it("handles approved resume with correct badge", async () => {
    const approvedResume: Resume = {
      ...baseResume,
      status: "approved",
      reviewerName: "Reviewer B",
    };
    await act(async () => {
      render(
        <MemoryRouter>
          <StudentDashboard user={mockUser} resumes={[approvedResume]} />
        </MemoryRouter>
      );
    });
    expect(screen.getByText(/Approved/i)).toBeInTheDocument();
  });
});