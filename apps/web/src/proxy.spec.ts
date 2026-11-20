import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

const request = (path: string, signedIn = false) =>
  new NextRequest(`https://wishpool.test${path}`, {
    headers: signedIn ? { cookie: "better-auth.session_token=abc.def" } : {},
  });

const location = (res: Response) => {
  const header = res.headers.get("location");
  return header ? new URL(header) : null;
};

describe("proxy", () => {
  it.each([
    "/dashboard",
    "/create",
    "/account",
    "/wishlist/abc/edit",
    "/wishlist/abc/edit/",
  ])(
    "sends signed-out visitors from %s to the landing page, remembering where they wanted to go",
    (path) => {
      const to = location(proxy(request(path)))!;

      expect(to.pathname).toBe("/");
      expect(to.searchParams.get("next")).toBe(
        path === "/dashboard" ? null : path,
      );
    },
  );

  it("keeps the query string of the wanted page", () => {
    const to = location(proxy(request("/create?template=1")))!;

    expect(to.searchParams.get("next")).toBe("/create?template=1");
  });

  it("keeps a failed email-verification error for the landing page", () => {
    const to = location(proxy(request("/dashboard?error=TOKEN_EXPIRED")))!;

    expect(to.searchParams.get("error")).toBe("TOKEN_EXPIRED");
  });

  it.each(["/dashboard", "/account", "/wishlist/abc/edit"])(
    "lets signed-in visitors through to %s",
    (path) => {
      const res = proxy(request(path, true));

      expect(location(res)).toBeNull();
      expect(res.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it.each([
    "/",
    "/wishlist/abc",
    "/terms",
    "/privacy",
    "/forgot-password",
    "/reset-password",
  ])(
    "leaves public page %s alone, so link-preview bots can read it",
    (path) => {
      expect(location(proxy(request(path)))).toBeNull();
    },
  );
});
