import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RegisterScreen } from "../../components/RegisterScreen";

// ---- mock Firebase ----
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSetDoc = jest.fn();
const mockDoc = jest.fn();
const mockGetAuth = jest.fn();
const mockGetFirestore = jest.fn();
const mockServerTimestamp = jest.fn(() => "mock-timestamp");

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => mockGetAuth()),
  createUserWithEmailAndPassword: (...args: any[]) =>
    mockCreateUserWithEmailAndPassword(...args),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => mockGetFirestore()),
  doc: jest.fn((...args: any[]) => mockDoc(...args)),
  setDoc: jest.fn((...args: any[]) => mockSetDoc(...args)),
  serverTimestamp: jest.fn(() => mockServerTimestamp()),
}));

// ---- mock router navigate ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("RegisterScreen", () => {
  const mockOnRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function setup() {
    render(
      <MemoryRouter>
        <RegisterScreen onRegister={mockOnRegister} />
      </MemoryRouter>
    );
  }

  it("renders all form fields", () => {
    setup();
    expect(screen.getByText(/Create an account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviewer/i)).toBeInTheDocument();
  });

  it("shows error when email or password missing", async () => {
    setup();
    fireEvent.click(screen.getByText(/Create account/i));
    expect(await screen.findByText(/Email and password are required/i)).toBeInTheDocument();
  });

  it("shows error when password too short", async () => {
    setup();
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByText(/Create account/i));
    expect(await screen.findByText(/Password must be at least 6/i)).toBeInTheDocument();
  });

  it("registers successfully as student and navigates", async () => {
    setup();

    fireEvent.change(screen.getByLabelText(/Full name/i), { target: { value: "Student User" } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "student@test.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "123456" } });

    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: "uid1", email: "student@test.com" },
    });

    fireEvent.click(screen.getByText(/Create account/i));

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
      expect(mockOnRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "uid1",
          email: "student@test.com",
          type: "student",
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/student");
    });
  });

  it("registers successfully as reviewer and navigates", async () => {
    setup();

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "rev@test.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "123456" } });

    // switch role
    fireEvent.click(screen.getByText(/Reviewer/i));

    mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: "uid2", email: "rev@test.com" },
    });

    fireEvent.click(screen.getByText(/Create account/i));

    await waitFor(() => {
      expect(mockSetDoc).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/reviewer");
    });
  });

  it("handles registration failure gracefully", async () => {
    setup();

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "err@test.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "123456" } });

    mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(new Error("Registration failed."));

    fireEvent.click(screen.getByText(/Create account/i));

    expect(await screen.findByText(/Registration failed/i)).toBeInTheDocument();
  });

  it("navigates back to login", () => {
    setup();
    fireEvent.click(screen.getByText(/Back to Login/i));
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});
