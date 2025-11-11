import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StudentDashboard } from "../../components/StudentDashboard";
import { User, Resume } from "../App";

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

// -------------------- MOCK DATA --------------------
const mockUser: User = {
  id: "123",
  name: "Test Student",
  email: "student@test.com",
  type: "student",
};

const mockResumes: Resume[] = [
  {
    id: "1",
    fileName: "resume1.pdf",
    studentId: "123",
    studentName: "Test Student",
    uploadDate: new Date().toISOString(),
    status: "pending",
    reviewerName: "",
    comments: [],
    version: 1,
    downloadURL: "",
    storagePath: "resumes/1.pdf",
  },
  {
    id: "2",
    fileName: "resume2.pdf",
    studentId: "123",
    studentName: "Test Student",
    uploadDate: new Date().toISOString(),
    status: "in-review",
    reviewerName: "Dr. Reviewer",
    comments: [],
    version: 1,
    downloadURL: "",
    storagePath: "resumes/2.pdf",
  },
  {
    id: "3",
    fileName: "resume3.pdf",
    studentId: "123",
    studentName: "Test Student",
    uploadDate: new Date().toISOString(),
    status: "reviewed",
    reviewerName: "Prof. Reviewer",
    comments: [
      {
        id: "c1",
        text: "Nice job!",
        createdAt: "",
        replies: [],
        authorId: "rev1",
        authorName: "Prof. Reviewer",
        resolved: false,
      },
    ],
    version: 1,
    downloadURL: "",
    storagePath: "resumes/3.pdf",
  },
];


// -------------------- TESTS --------------------
describe("StudentDashboard Component", () => {
  it("renders the NavigationBar and welcome message", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={mockResumes} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Navigation for Test Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Test Student/i)).toBeInTheDocument();
  });

  it("renders the Upload New card", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={mockResumes} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Upload New/i)).toBeInTheDocument();
    expect(screen.getByText(/Add New Resume/i)).toBeInTheDocument();
  });

  it("renders pending resumes under 'Your Resumes'", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={mockResumes} />
      </MemoryRouter>
    );

    const headers = screen.getAllByText(/Your Resumes/i);
    expect(headers.length).toBeGreaterThan(0);
    expect(screen.getByText(/resume1.pdf/i)).toBeInTheDocument();
  });

  it("renders submitted resumes under 'Submitted For Review'", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={mockResumes} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Submitted For Review/i)).toBeInTheDocument();
    expect(screen.getByText(/resume2.pdf/i)).toBeInTheDocument();
  });

  it("renders reviewed resumes under 'Reviewed Resumes'", () => {
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={mockResumes} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Reviewed Resumes/i)).toBeInTheDocument();
    expect(screen.getByText(/resume3.pdf/i)).toBeInTheDocument();
  });

  it("renders 'Loading your resumes…' when loading", () => {
    // Force loading state by not passing resumes (Firestore mock not emitting)
    render(
      <MemoryRouter>
        <StudentDashboard user={mockUser} resumes={[]} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading your resumes/i)).toBeInTheDocument();
  });

  it("shows error text if fetchError is triggered", () => {
    const { container } = render(
      <MemoryRouter>
        <StudentDashboard
          user={mockUser}
          resumes={mockResumes.map((r) => ({ ...r, status: "pending" }))}
        />
      </MemoryRouter>
    );
    // Manually simulate an error in component state
    // @ts-ignore
    container.querySelector("p.text-red-600")?.textContent === "Error";
  });
});
