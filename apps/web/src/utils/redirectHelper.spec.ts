import { describe, expect, it } from "vitest";
import { safeNextPath } from "./redirectHelper";

describe("safeNextPath", () => {
  it.each(["/dashboard", "/wishlist/abc/edit", "/account?tab=1", "/"])(
    "keeps the local path %s",
    (path) => {
      expect(safeNextPath(path)).toBe(path);
    },
  );

  it.each([
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "dashboard",
    "",
  ])("drops %j so sign-in is no open redirect", (value) => {
    expect(safeNextPath(value)).toBeUndefined();
  });

  it("ignores missing and repeated params", () => {
    expect(safeNextPath(undefined)).toBeUndefined();
    expect(safeNextPath(null)).toBeUndefined();
    expect(safeNextPath(["/a", "/b"])).toBeUndefined();
  });
});
