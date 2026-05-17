jest.mock("../auth", () => ({
  auth: jest.fn(),
}));

import { auth } from "../auth";

describe("Proxy", () => {
  it("should export auth as the proxy", () => {
    expect(auth).toBeDefined();
  });
});
