import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { NavigationBar } from "../../components/Navigation";

// ---- Mock router navigation ----
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// ---- Mock user data ----
const studentUser = {
  id: "s1",
  name: "Student One",
  email: "student@test.com",
  type: "student" as const,
};

const reviewerUser = {
  id: "r1",
  name: "Reviewer One",
  email: "reviewer@test.com",
  type: "reviewer" as const,
};

describe("NavigationBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders logo and navigation buttons", () => {
    render(
      <MemoryRouter>
        <NavigationBar user={studentUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Vanderbilt Resume Reviewer/i)).toBeInTheDocument();
    expect(screen.getByText(/About/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign in as Reviewer/i)).toBeInTheDocument();
    expect(screen.getByText(/Log Out/i)).toBeInTheDocument();
    expect(screen.getByText(/Account/i)).toBeInTheDocument();
  });

  it("navigates to student dashboard when logo is clicked for student", () => {
    render(
      <MemoryRouter>
        <NavigationBar user={studentUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Vanderbilt Resume Reviewer/i));
    expect(mockNavigate).toHaveBeenCalledWith("/student");
  });

  it("navigates to reviewer dashboard when logo is clicked for reviewer", () => {
    render(
      <MemoryRouter>
        <NavigationBar user={reviewerUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Vanderbilt Resume Reviewer/i));
    expect(mockNavigate).toHaveBeenCalledWith("/reviewer");
  });

  it("navigates to /student when About is clicked", () => {
    render(
      <MemoryRouter>
        <NavigationBar user={studentUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/About/i));
    expect(mockNavigate).toHaveBeenCalledWith("/student");
  });

  it("navigates to /reviewer when 'Sign in as Reviewer' is clicked", () => {
    render(
      <MemoryRouter>
        <NavigationBar user={studentUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Sign in as Reviewer/i));
    expect(mockNavigate).toHaveBeenCalledWith("/reviewer");
  });

  it("navigates to /student when 'Sign in as Student' is clicked", () => {
    render(
      <MemoryRouter>
        <NavigationBar user={reviewerUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Sign in as Student/i));
    expect(mockNavigate).toHaveBeenCalledWith("/student");
  });

  it("calls onLogout when Log Out button clicked", () => {
    const mockLogout = jest.fn();

    render(
      <MemoryRouter>
        <NavigationBar user={studentUser} onLogout={mockLogout} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Log Out/i));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("navigates to /account when Account button clicked", () => {
    render(
      <MemoryRouter>
        <NavigationBar user={studentUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Account/i));
    expect(mockNavigate).toHaveBeenCalledWith("/account");
  });
});
