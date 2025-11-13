import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UploadScreen } from "../../components/UploadScreen";


// ---- mock Firebase ----
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(() => ({ id: "mockDocId" })),
  setDoc: jest.fn(),
  getDocs: jest.fn(() => ({
    docs: [
      {
        id: "rev1",
        data: () => ({ name: "Reviewer One", email: "r1@test.com" }),
      },
    ],
  })),
  query: jest.fn(),
  where: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(),
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(() => ({
    on: jest.fn((event, progressFn, errorFn, successFn) => {
      if (event === "state_changed") {
        progressFn({ bytesTransferred: 50, totalBytes: 100 });
        successFn(); // simulate success immediately
        errorFn; // no error
      }
    }),
  })),
  getDownloadURL: jest.fn(() =>
    Promise.resolve("https://mock-storage/download.pdf")
  ),
}));

// ---- mock NavigationBar ----
jest.mock("../../components/Navigation", () => ({
  NavigationBar: () => <div data-testid="mock-nav">Mock Nav</div>,
}));

// ---- mock router navigate ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("UploadScreen", () => {
  const mockUser = {
  id: "u1",
  name: "Test User",
  email: "t@t.com",
  type: "student" as const,
};
  const mockOnUpload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderUploadScreen = () =>
  render(
    <MemoryRouter>
      <UploadScreen user={mockUser} onUpload={mockOnUpload} />
    </MemoryRouter>
  );


  it("renders main UI and reviewers", async () => {
    render(
      <MemoryRouter>
        <UploadScreen user={mockUser} onUpload={mockOnUpload} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("mock-nav")).toBeInTheDocument();
    expect(screen.getByText(/Upload Resume/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Reviewer One/i)).toBeInTheDocument());
  });

  it("filters reviewers based on search input", async () => {
    render(
      <MemoryRouter>
        <UploadScreen user={mockUser} onUpload={mockOnUpload} />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText("Reviewer One")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/Search reviewers/i), {
      target: { value: "zzz" },
    });
    expect(screen.getByText(/No reviewers found/i)).toBeInTheDocument();
  });

  it("shows error for invalid file type", async () => {
    render(
      <MemoryRouter>
        <UploadScreen user={mockUser} onUpload={mockOnUpload} />
      </MemoryRouter>
    );

    const uploadButton = screen.getByRole("button", { name: /upload files/i });
    uploadButton;
    const file = new File(["bad"], "resume.txt", { type: "text/plain" });

    const hiddenInput = document.getElementById("file-input") as HTMLInputElement;
    Object.defineProperty(hiddenInput, "files", {
      value: [file],
    });

    fireEvent.change(hiddenInput);

    await waitFor(() =>
      expect(screen.getByText(/Only PDF files are supported/i)).toBeInTheDocument()
    );
  });

  it("handles PDF upload successfully", async () => {
    render(
      <MemoryRouter>
        <UploadScreen user={mockUser} onUpload={mockOnUpload} />
      </MemoryRouter>
    );

    // wait for reviewer load
    await waitFor(() => expect(screen.getByText("Reviewer One")).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("Reviewer One")); // select reviewer

    const pdfFile = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    const hiddenInput = document.getElementById("file-input") as HTMLInputElement;
    Object.defineProperty(hiddenInput, "files", { value: [pdfFile] });
    fireEvent.change(hiddenInput);

    await waitFor(() => expect(mockOnUpload).toHaveBeenCalled());
    expect(screen.getByText(/Upload Complete/i)).toBeInTheDocument();
  });

    it("handles drag-and-drop events visually", async () => {
  await act(async () => {
    renderUploadScreen();
  });

  const dropZone = screen.getByText(/drag & drop files/i).closest("div")!;
  const file = new File(["dummy"], "resume.pdf", { type: "application/pdf" });

  await act(async () => {
    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });
  });

  expect(dropZone).toBeInTheDocument();
});


  it("navigates back to student dashboard", () => {
    render(
      <MemoryRouter>
        <UploadScreen user={mockUser} onUpload={mockOnUpload} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Back to Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith("/student");
  });
});
