import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AccountScreen } from "../../components/AccountScreen";

// ---- MOCKS ----
const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../components/Navigation", () => ({
  NavigationBar: ({ user }: any) => (
    <div data-testid="nav">Navigation for {user.name}</div>
  ),
}));

jest.mock("../../components/ui/switch", () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      data-testid="mock-switch"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

// ---- MOCK DATA ----
const mockUser = {
  id: "u1",
  name: "John Doe",
  email: "john@vanderbilt.edu",
  type: "student" as const,
};

describe("AccountScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("toggles edit mode and saves changes", () => {
    render(
      <MemoryRouter>
        <AccountScreen user={mockUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Edit Profile/i));
    expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();

    const nameInput = screen.getByLabelText(/Full Name/i);
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect((nameInput as HTMLInputElement).value).toBe("Jane Doe");

    fireEvent.click(screen.getByText(/Save Changes/i));
    expect(screen.queryByText(/Save Changes/i)).not.toBeInTheDocument();
  });

  it("navigates back to dashboard based on user type", () => {
    render(
      <MemoryRouter>
        <AccountScreen user={mockUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Back to Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith("/student");
  });

});
