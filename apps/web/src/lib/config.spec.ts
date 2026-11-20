import { afterEach, describe, expect, it, vi } from "vitest";
import { getBackendUrl, getSiteUrl } from "./config";

afterEach(() => vi.unstubAllEnvs());

describe("config", () => {
  it("reads the backend and site URLs", () => {
    expect(getBackendUrl()).toBe("http://backend.test");
    expect(getSiteUrl()).toBe("https://wishpool.test");
  });

  it("fails loudly when they are missing", () => {
    vi.stubEnv("BACKEND_URL", "");
    vi.stubEnv("SITE_URL", "");

    expect(() => getBackendUrl()).toThrow("BACKEND_URL is not defined");
    expect(() => getSiteUrl()).toThrow("SITE_URL is not defined");
  });
});
