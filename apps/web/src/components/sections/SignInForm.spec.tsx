import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  socialSignIn: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));
vi.mock("@/lib/auth", () => auth);
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import { SignInForm } from "./SignInForm";

beforeEach(() => vi.resetAllMocks());
afterEach(() => window.history.replaceState(null, "", "/"));

describe("SignInForm", () => {
  it("starts the social sign-in for the chosen provider and disables the buttons meanwhile", async () => {
    auth.socialSignIn.mockReturnValue(new Promise(() => undefined));
    const user = userEvent.setup();
    render(<SignInForm callbackURL="/wishlist/1" />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    expect(auth.socialSignIn).toHaveBeenCalledWith("google", "/wishlist/1");
    expect(screen.getByRole("button", { name: /google/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /facebook/i })).toBeDisabled();
  });

  it("shows an error and re-enables the buttons when the provider fails", async () => {
    auth.socialSignIn.mockRejectedValue(new Error("nope"));
    const user = userEvent.setup();
    render(<SignInForm />);

    await user.click(screen.getByRole("button", { name: /facebook/i }));

    expect(
      await screen.findByText("Sign-in failed. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /facebook/i })).toBeEnabled();
  });

  it.each([
    [
      "TOKEN_EXPIRED",
      "This verification link has expired. Sign in to get a new one.",
    ],
    [
      "account_not_linked",
      "An account with this email already exists. Sign in with your password instead.",
    ],
    ["access_denied", "Sign-in was cancelled."],
    ["something_new", "Sign-in failed. Please try again."],
  ])("explains the ?error=%s redirect", async (code, message) => {
    window.history.replaceState(null, "", `/?error=${code}`);

    render(<SignInForm />);

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
  });

  it("links to the terms and privacy policy", () => {
    render(<SignInForm />);

    expect(screen.getByRole("link", { name: "terms" })).toHaveAttribute(
      "href",
      "/terms",
    );
    expect(
      screen.getByRole("link", { name: "privacy policy" }),
    ).toHaveAttribute("href", "/privacy");
  });
});
