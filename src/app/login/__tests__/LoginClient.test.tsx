import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginClient from "../LoginClient";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { setupPassword } from "../../actions/authActions";

// Mock next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock authActions
jest.mock("../../actions/authActions", () => ({
  setupPassword: jest.fn(),
}));

describe("LoginClient", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    jest.clearAllMocks();
  });

  describe("Unlock Mode (isPasswordSet = true)", () => {
    it("renders the unlock form", () => {
      render(<LoginClient isPasswordSet={true} />);
      expect(screen.getByRole("heading", { name: "DonationTracker" })).toBeInTheDocument();
      expect(screen.getByLabelText(/access password/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /unlock application/i })).toBeInTheDocument();
    });

    it("calls signIn on submit and routes on success", async () => {
      (signIn as jest.Mock).mockResolvedValue({ error: null });

      render(<LoginClient isPasswordSet={true} />);
      const passwordInput = screen.getByLabelText(/access password/i);
      const submitButton = screen.getByRole("button", { name: /unlock application/i });

      fireEvent.change(passwordInput, { target: { value: "mypassword" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith("credentials", {
          password: "mypassword",
          redirect: false,
        });
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("shows error message if signIn fails", async () => {
      (signIn as jest.Mock).mockResolvedValue({ error: "CredentialsSignin" });

      render(<LoginClient isPasswordSet={true} />);
      const passwordInput = screen.getByLabelText(/access password/i);
      const submitButton = screen.getByRole("button", { name: /unlock application/i });

      fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid password/i)).toBeInTheDocument();
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe("Setup Mode (isPasswordSet = false)", () => {
    it("renders the setup form", () => {
      render(<LoginClient isPasswordSet={false} />);
      expect(screen.getByRole("heading", { name: "DonationTracker Setup" })).toBeInTheDocument();
      expect(screen.getByLabelText(/^choose password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /set password/i })).toBeInTheDocument();
    });

    it("shows error if passwords do not match", async () => {
      render(<LoginClient isPasswordSet={false} />);
      const passwordInput = screen.getByLabelText(/^choose password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /set password/i });

      fireEvent.change(passwordInput, { target: { value: "pass1" } });
      fireEvent.change(confirmInput, { target: { value: "pass2" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        expect(setupPassword).not.toHaveBeenCalled();
      });
    });

    it("calls setupPassword and logs in automatically on success", async () => {
      (setupPassword as jest.Mock).mockResolvedValue({ success: true });
      (signIn as jest.Mock).mockResolvedValue({ error: null });

      render(<LoginClient isPasswordSet={false} />);
      const passwordInput = screen.getByLabelText(/^choose password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /set password/i });

      fireEvent.change(passwordInput, { target: { value: "securepass" } });
      fireEvent.change(confirmInput, { target: { value: "securepass" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(setupPassword).toHaveBeenCalledWith("securepass");
        expect(signIn).toHaveBeenCalledWith("credentials", {
          password: "securepass",
          redirect: false,
        });
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("shows error if setupPassword action fails", async () => {
      (setupPassword as jest.Mock).mockResolvedValue({ success: false, error: "Disk full" });

      render(<LoginClient isPasswordSet={false} />);
      const passwordInput = screen.getByLabelText(/^choose password/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole("button", { name: /set password/i });

      fireEvent.change(passwordInput, { target: { value: "securepass" } });
      fireEvent.change(confirmInput, { target: { value: "securepass" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(setupPassword).toHaveBeenCalledWith("securepass");
        expect(screen.getByText(/disk full/i)).toBeInTheDocument();
        expect(signIn).not.toHaveBeenCalled();
      });
    });
  });
});
