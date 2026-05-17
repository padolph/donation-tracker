jest.mock("../auth", () => ({
  auth: jest.fn(),
}));

import { auth } from "../auth";

describe("Middleware", () => {
  it("should export auth as the middleware", () => {
    expect(auth).toBeDefined();
  });
});
