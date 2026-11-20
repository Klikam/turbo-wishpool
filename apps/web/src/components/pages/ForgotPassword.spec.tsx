import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }));
vi.mock("@/lib/auth", () => auth);

import ForgotPassword from "./ForgotPassword";

beforeEach(() => vi.resetAllMocks());

function setup() {
  render(<ForgotPassword />);
  return userEvent.setup();
}

describe("ForgotPassword", () => {
  it("sends the link and confirms without revealing whether the account exists", async () => {
    auth.requestPasswordReset.mockResolvedValue({ ok: true });
    const user = setup();

    await user.type(screen.getByLabelText("Email"), "  ann@example.com ");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(auth.requestPasswordReset).toHaveBeenCalledWith("ann@example.com");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If there's an account for ann@example.com",
    );
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("rejects an invalid address without calling the backend", async () => {
    const user = setup();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enter a valid email address",
    );
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
  });

  it("shows the backend error (e.g. rate limit) and lets the user retry", async () => {
    auth.requestPasswordReset.mockResolvedValue({
      ok: false,
      error: "Too many attempts, try again in a minute",
    });
    const user = setup();

    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts",
    );
    expect(
      screen.getByRole("button", { name: "Send reset link" }),
    ).toBeEnabled();
  });

  it("links back to sign in", () => {
    setup();

    expect(
      screen.getByRole("link", { name: "Back to sign in" }),
    ).toHaveAttribute("href", "/");
  });
});
