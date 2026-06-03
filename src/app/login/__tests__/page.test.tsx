import { render, screen } from "@testing-library/react";
import LoginPage from "../page";
import LoginClient from "../LoginClient";

// Mock LoginClient to verify it receives the correct props
jest.mock("../LoginClient", () => {
  return jest.fn().mockImplementation(({ isPasswordSet }) => {
    return <div data-testid="login-client" data-password-set={isPasswordSet.toString()} />;
  });
});

describe("LoginPage Server Component", () => {
  const originalEnv = process.env.APP_PASSWORD;

  afterEach(() => {
    process.env.APP_PASSWORD = originalEnv;
    jest.clearAllMocks();
  });

  it("passes isPasswordSet=false when APP_PASSWORD is not set", async () => {
    delete process.env.APP_PASSWORD;

    // Resolve the server component
    const PageComponent = await LoginPage();
    render(PageComponent);

    const client = screen.getByTestId("login-client");
    expect(client).toBeInTheDocument();
    expect(client).toHaveAttribute("data-password-set", "false");
    expect(LoginClient).toHaveBeenCalledWith({ isPasswordSet: false }, undefined);
  });

  it("passes isPasswordSet=true when APP_PASSWORD is set", async () => {
    process.env.APP_PASSWORD = "some-password";

    // Resolve the server component
    const PageComponent = await LoginPage();
    render(PageComponent);

    const client = screen.getByTestId("login-client");
    expect(client).toBeInTheDocument();
    expect(client).toHaveAttribute("data-password-set", "true");
    expect(LoginClient).toHaveBeenCalledWith({ isPasswordSet: true }, undefined);
  });
});
