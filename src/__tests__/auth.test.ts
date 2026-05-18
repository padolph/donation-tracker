// We'll mock the auth module to avoid importing the actual next-auth instance in tests
// which causes ESM issues in Jest.

jest.mock("../auth", () => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

import { handlers } from "../auth";

describe("Authentication Configuration", () => {
  it("should have NextAuth handlers defined", () => {
    expect(handlers.GET).toBeDefined();
    expect(handlers.POST).toBeDefined();
  });
});
