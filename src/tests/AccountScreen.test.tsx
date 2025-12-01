import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AccountScreen } from "../../components/AccountScreen";

// ---- FIREBASE MOCKS ----
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: "test-uid" },
  })),
  updatePassword: jest.fn(),
  deleteUser: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(() =>
    Promise.resolve({
      forEach: () => {},
      docs: [],
      empty: true,
    })
  ),
}));

// ---- EXISTING MOCKS ----
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

  it("toggles edit mode and saves changes", async () => {
    render(
      <MemoryRouter>
        <AccountScreen user={mockUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    // Let the useEffect + async stats fetch settle
    await waitFor(() => {
      expect(screen.getByTestId("nav")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Edit Profile/i));
    expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();

    // Use label and cast to HTMLInputElement so TS knows about .value
    const nameInput = screen.getByLabelText(/Full Name/i) as HTMLInputElement;

    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput.value).toBe("Jane Doe");

    fireEvent.click(screen.getByText(/Save Changes/i));
    expect(screen.queryByText(/Save Changes/i)).not.toBeInTheDocument();
  });

  it("navigates back to dashboard based on user type", async () => {
    render(
      <MemoryRouter>
        <AccountScreen user={mockUser} onLogout={jest.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("nav")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Back to Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith("/student");
  });
});
