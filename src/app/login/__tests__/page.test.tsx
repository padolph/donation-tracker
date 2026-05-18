import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "../page";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Login Page", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: jest.fn(),
    });
    jest.clearAllMocks();
  });

  it("renders the login form with a password input", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/access password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unlock application/i })).toBeInTheDocument();
  });

  it("calls signIn when the form is submitted", async () => {
    render(<LoginPage />);
    const passwordInput = screen.getByLabelText(/access password/i);
    const submitButton = screen.getByRole("button", { name: /unlock application/i });

    fireEvent.change(passwordInput, { target: { value: "testpassword" } });
    fireEvent.click(submitButton);

    expect(signIn).toHaveBeenCalledWith("credentials", {
      password: "testpassword",
      redirect: false,
    });
  });
});
