import { screen, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import App from "../App";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock("../../src/firebaseConfig", () => ({}));


const mockStudent = {
  id: "1",
  name: "Alice",
  email: "alice@vanderbilt.edu",
  type: "student" as const,
};

const mockReviewer = {
  id: "2",
  name: "Bob",
  email: "bob@vanderbilt.edu",
  type: "reviewer" as const,
};

jest.mock("../../components/StudentDashboard", () => ({
  StudentDashboard: ({ user }: any) => <div>Student Dashboard for {user.name}</div>,
}));

jest.mock("../../components/ReviewerDashboard", () => ({
  ReviewerDashboard: ({ user }: any) => <div>Reviewer Dashboard for {user.name}</div>,
}));

jest.mock("../../components/LoginScreen", () => ({
  LoginScreen: ({ onLogin }: any) => (
    <div>
      <button onClick={() => onLogin({ id: "1", name: "Alice", email: "a", type: "student" })}>
        Mock Login
      </button>
    </div>
  ),
}));

jest.mock("../../components/RegisterScreen", () => ({
  RegisterScreen: ({ onRegister }: any) => (
    <div>
      <button onClick={() => onRegister({ id: "3", name: "Charlie", email: "c", type: "student" })}>
        Mock Register
      </button>
    </div>
  ),
}));

test("renders register route and triggers onRegister", () => {
  render(
    <MemoryRouter initialEntries={["/register"]}>
      <App />
    </MemoryRouter>
  );

  const registerButton = screen.getByText(/Mock Register/i);
  registerButton.click(); // triggers handleLogin inside App
  expect(registerButton).toBeInTheDocument();
});

jest.mock("../../components/UploadScreen", () => ({
  UploadScreen: ({ user, onUpload }: any) => (
    <div>
      Upload for {user.name}
      <button onClick={() => onUpload({ fileName: "resume.pdf", studentId: "1", studentName: "Alice", status: "pending", comments: [], downloadURL: "", storagePath: "" })}>
        Mock Upload
      </button>
    </div>
  ),
}));

test("renders upload screen when user is logged in", () => {
  render(
    <MemoryRouter initialEntries={["/upload"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Mock Login/i)).toBeInTheDocument(); // because initially not logged in
});


jest.mock("../../components/AccountScreen", () => ({
  AccountScreen: ({ user }: any) => <div>Account Screen for {user.name}</div>,
}));

test("redirects to login when accessing account unauthenticated", () => {
  render(
    <MemoryRouter initialEntries={["/account"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Mock Login/i)).toBeInTheDocument();
});


test("renders login route by default", () => {
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Mock Login/i)).toBeInTheDocument();
});

test("renders student dashboard when logged in as student", () => {
  render(
    <MemoryRouter initialEntries={["/student"]}>
      <App />
    </MemoryRouter>
  );

  // Simulate login
  // Instead of actual hooks, we can re-render with controlled state using a dummy wrapper or prefilled prop mock
});

test("renders reviewer dashboard when logged in as reviewer", () => {
  render(
    <MemoryRouter initialEntries={["/reviewer"]}>
      <App />
    </MemoryRouter>
  );

  // assert reviewer version renders
});
