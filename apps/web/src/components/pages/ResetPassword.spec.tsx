import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ resetPassword: vi.fn() }));
vi.mock("@/lib/auth", () => auth);

import ResetPassword from "./ResetPassword";

beforeEach(() => vi.resetAllMocks());

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  password: string,
  repeat = password,
) {
  await user.type(screen.getByLabelText("New password"), password);
  await user.type(screen.getByLabelText("Repeat new password"), repeat);
  await user.click(screen.getByRole("button", { name: "Change password" }));
}

describe("ResetPassword", () => {
  it("sets the new password with the token from the link", async () => {
    auth.resetPassword.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<ResetPassword token="tok123" />);

    await fill(user, "newsecret1");

    expect(auth.resetPassword).toHaveBeenCalledWith("newsecret1", "tok123");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your password has been changed",
    );
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("checks the password rules before calling the backend", async () => {
    const user = userEvent.setup();
    render(<ResetPassword token="tok123" />);

    await fill(user, "short");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Password must contain at least 8 characters",
    );
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it("requires both entries to match", async () => {
    const user = userEvent.setup();
    render(<ResetPassword token="tok123" />);

    await fill(user, "newsecret1", "newsecret2");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The two passwords don't match",
    );
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it("shows the backend's error, e.g. an expired link, and stays on the form", async () => {
    auth.resetPassword.mockResolvedValue({
      ok: false,
      error: "This reset link is invalid or has expired. Request a new one.",
    });
    const user = userEvent.setup();
    render(<ResetPassword token="old" />);

    await fill(user, "newsecret1");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "invalid or has expired",
    );
    expect(
      screen.getByRole("button", { name: "Change password" }),
    ).toBeEnabled();
  });

  it.each([
    ["has no token", { token: undefined }],
    ["was refused by better-auth", { token: "tok", linkError: true }],
  ])("offers a new link when the link %s", (_label, props) => {
    render(<ResetPassword {...props} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "invalid or has expired",
    );
    expect(
      screen.getByRole("link", { name: "Request a new link" }),
    ).toHaveAttribute("href", "/forgot-password");
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
  });

  it("keeps the button disabled until something is typed", () => {
    render(<ResetPassword token="tok" />);

    expect(
      screen.getByRole("button", { name: "Change password" }),
    ).toBeDisabled();
  });
});
