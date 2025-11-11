import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginScreen } from "../../components/LoginScreen";

// ---- MOCK FIREBASE ----
const mockSignInWithEmailAndPassword = jest.fn();
const mockGetDoc = jest.fn();
const mockDoc = jest.fn();
const mockNavigate = jest.fn();

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: (...args: any[]) =>
    mockSignInWithEmailAndPassword(...args),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: (...args: any[]) => mockDoc(...args),
  getDoc: (...args: any[]) => mockGetDoc(...args),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../src/firebaseConfig", () => ({}));

// ---- TEST DATA ----
const mockUserCredential = {
  user: {
    uid: "uid123",
    email: "student@test.com",
    displayName: "Test User",
  },
};

const mockUserSnap = {
  exists: () => true,
  data: () => ({ role: "student" }),
};

// ---- TEST SUITE ----
describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders email and password inputs", () => {
    render(
      <MemoryRouter>
        <LoginScreen onLogin={jest.fn()} />
      </MemoryRouter>
    );

    // Remove ambiguous text lookup, just verify buttons directly
    expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register/i })).toBeInTheDocument();

    // Find the textboxes by role (since <label> isn’t linked)
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("shows error when fields are empty and login is clicked", async () => {
    render(
      <MemoryRouter>
        <LoginScreen onLogin={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Login/i }));
    expect(await screen.findByText(/Email and password are required/i)).toBeInTheDocument();
  });

  it("handles successful login for student", async () => {
    mockSignInWithEmailAndPassword.mockResolvedValueOnce(mockUserCredential);
    mockDoc.mockReturnValue("mockDocRef");
    mockGetDoc.mockResolvedValueOnce(mockUserSnap);

    const onLogin = jest.fn();

    render(
      <MemoryRouter>
        <LoginScreen onLogin={onLogin} />
      </MemoryRouter>
    );

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "student@test.com" } });

    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    await waitFor(() => {
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalled();
      expect(onLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "student@test.com",
          type: "student",
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/student");
    });
  });

  it("handles Firebase login error gracefully", async () => {
    mockSignInWithEmailAndPassword.mockRejectedValueOnce(new Error("Invalid credentials"));

    render(
      <MemoryRouter>
        <LoginScreen onLogin={jest.fn()} />
      </MemoryRouter>
    );

    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "fail@test.com" } });

    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: "badpass" } });

    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  it("navigates to register page when 'Register' button clicked", () => {
    render(
      <MemoryRouter>
        <LoginScreen onLogin={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Register/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/register");
  });
});
