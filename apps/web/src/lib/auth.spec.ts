import { beforeEach, describe, expect, it, vi } from "vitest";

const client = vi.hoisted(() => ({
  signUp: { email: vi.fn() },
  signIn: { email: vi.fn(), social: vi.fn() },
  signOut: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  deleteUser: vi.fn(),
}));
vi.mock("@/lib/auth-client", () => ({ authClient: client }));

import {
  changePassword,
  deleteAccount,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
  socialSignIn,
} from "./auth";

const ok = { error: null };
const fail = (error: object) => ({ error });
const TOO_MANY = "Too many attempts, try again in a minute";

beforeEach(() => vi.resetAllMocks());

describe("register", () => {
  it("signs up and passes the callback URL for the verification link", async () => {
    client.signUp.email.mockResolvedValue(ok);

    await expect(
      register(
        { name: "Ann", email: "a@b.co", password: "secret123" },
        "/wishlist/1",
      ),
    ).resolves.toEqual({ ok: true });

    expect(client.signUp.email).toHaveBeenCalledWith({
      name: "Ann",
      email: "a@b.co",
      password: "secret123",
      callbackURL: "/wishlist/1",
    });
  });

  it("defaults the callback to the dashboard", async () => {
    client.signUp.email.mockResolvedValue(ok);

    await register({ name: "Ann", email: "a@b.co", password: "secret123" });

    expect(client.signUp.email).toHaveBeenCalledWith(
      expect.objectContaining({ callbackURL: "/dashboard" }),
    );
  });

  it.each([
    [{ status: 429 }, TOO_MANY],
    [{ status: 400, message: "Password too short" }, "Password too short"],
    [{ status: 500 }, "Registration failed. Please try again."],
  ])("maps %j to %j", async (error, message) => {
    client.signUp.email.mockResolvedValue(fail(error));

    expect(
      await register({ name: "Ann", email: "a@b.co", password: "x" }),
    ).toEqual({
      ok: false,
      error: message,
    });
  });
});

describe("login", () => {
  const credentials = { email: "a@b.co", password: "secret123" };

  it("succeeds", async () => {
    client.signIn.email.mockResolvedValue(ok);
    expect(await login(credentials)).toEqual({ ok: true });
  });

  it.each([
    [
      { status: 403 },
      "Please verify your email first. We've sent you a new link.",
    ],
    [{ status: 429 }, TOO_MANY],
    [
      { status: 401, message: "Invalid email or password" },
      "Invalid credentials",
    ],
  ])("maps %j to a safe message", async (error, message) => {
    client.signIn.email.mockResolvedValue(fail(error));

    expect(await login(credentials)).toEqual({ ok: false, error: message });
  });
});

describe("password reset", () => {
  it("asks for the reset email with the page it should link to", async () => {
    client.requestPasswordReset.mockResolvedValue(ok);

    expect(await requestPasswordReset("a@b.co")).toEqual({ ok: true });
    expect(client.requestPasswordReset).toHaveBeenCalledWith({
      email: "a@b.co",
      redirectTo: "/reset-password",
    });
  });

  it("reports rate limits and other failures", async () => {
    client.requestPasswordReset.mockResolvedValueOnce(fail({ status: 429 }));
    expect(await requestPasswordReset("a@b.co")).toMatchObject({
      error: TOO_MANY,
    });

    client.requestPasswordReset.mockResolvedValueOnce(fail({ status: 500 }));
    expect(await requestPasswordReset("a@b.co")).toMatchObject({
      error: "We couldn't send the email. Please try again.",
    });
  });

  it("sets the new password with the emailed token", async () => {
    client.resetPassword.mockResolvedValue(ok);

    expect(await resetPassword("newpass123", "tok")).toEqual({ ok: true });
    expect(client.resetPassword).toHaveBeenCalledWith({
      newPassword: "newpass123",
      token: "tok",
    });
  });

  it("explains an invalid or expired link", async () => {
    client.resetPassword.mockResolvedValue(fail({ code: "INVALID_TOKEN" }));

    expect(await resetPassword("newpass123", "bad")).toEqual({
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    });
  });

  it("falls back to the backend message, then to a generic one", async () => {
    client.resetPassword.mockResolvedValueOnce(
      fail({ message: "Password too weak" }),
    );
    expect(await resetPassword("x", "t")).toMatchObject({
      error: "Password too weak",
    });

    client.resetPassword.mockResolvedValueOnce(fail({ status: 500 }));
    expect(await resetPassword("x", "t")).toMatchObject({
      error: "Your password couldn't be changed. Please try again.",
    });
  });
});

describe("changePassword", () => {
  it("signs the other sessions out", async () => {
    client.changePassword.mockResolvedValue(ok);

    expect(await changePassword("old", "new")).toEqual({ ok: true });
    expect(client.changePassword).toHaveBeenCalledWith({
      currentPassword: "old",
      newPassword: "new",
      revokeOtherSessions: true,
    });
  });

  it.each([
    [{ code: "INVALID_PASSWORD" }, "Your current password isn't right."],
    [{ status: 429 }, TOO_MANY],
    [{ status: 500 }, "Your password couldn't be changed. Please try again."],
  ])("maps %j", async (error, message) => {
    client.changePassword.mockResolvedValue(fail(error));

    expect(await changePassword("old", "new")).toEqual({
      ok: false,
      error: message,
    });
  });
});

describe("socialSignIn", () => {
  it("starts the provider flow and returns to / on failure", async () => {
    client.signIn.social.mockResolvedValue(ok);

    await socialSignIn("google", "/wishlist/1");

    expect(client.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/wishlist/1",
      errorCallbackURL: "/",
    });
  });

  it("throws when the provider cannot be reached", async () => {
    client.signIn.social.mockResolvedValue(
      fail({ message: "Provider not configured" }),
    );

    await expect(socialSignIn("facebook")).rejects.toThrow(
      "Provider not configured",
    );
  });
});

describe("logout", () => {
  it("signs out", async () => {
    await logout();
    expect(client.signOut).toHaveBeenCalled();
  });
});

describe("deleteAccount", () => {
  it("sends the password when there is one, and nothing otherwise", async () => {
    client.deleteUser.mockResolvedValue(ok);

    await deleteAccount("pw");
    await deleteAccount();

    expect(client.deleteUser).toHaveBeenNthCalledWith(1, { password: "pw" });
    expect(client.deleteUser).toHaveBeenNthCalledWith(2, {});
  });

  it.each([
    [
      { code: "INVALID_PASSWORD" },
      { ok: false, error: "That password isn't right." },
    ],
    [
      { code: "SESSION_EXPIRED" },
      {
        ok: false,
        needsRecentSignIn: true,
        error: "For your safety, sign in again, then delete your account.",
      },
    ],
    [
      { code: "SESSION_NOT_FRESH" },
      {
        ok: false,
        needsRecentSignIn: true,
        error: "For your safety, sign in again, then delete your account.",
      },
    ],
    [{ status: 429 }, { ok: false, error: TOO_MANY }],
    [
      { status: 500 },
      {
        ok: false,
        error: "Your account couldn't be deleted. Please try again.",
      },
    ],
  ])("maps %j", async (error, expected) => {
    client.deleteUser.mockResolvedValue(fail(error));

    expect(await deleteAccount("pw")).toEqual(expected);
  });
});
