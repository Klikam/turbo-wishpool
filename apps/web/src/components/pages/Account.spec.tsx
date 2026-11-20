import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));
const auth = vi.hoisted(() => ({
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
  logout: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth", () => auth);

import Account from "./Account";

const user = { name: "Ann Lee", email: "ann@example.com" };

beforeEach(() => vi.resetAllMocks());

describe("Account", () => {
  it("shows who is signed in", () => {
    render(<Account user={user} hasPassword />);

    expect(screen.getByText("Ann Lee")).toBeInTheDocument();
    expect(screen.getByText("ann@example.com")).toBeInTheDocument();
  });

  it("offers password change only to accounts that have a password", () => {
    const { rerender } = render(<Account user={user} hasPassword />);
    expect(
      screen.getByRole("button", { name: "Change password" }),
    ).toBeInTheDocument();

    rerender(<Account user={user} hasPassword={false} />);

    expect(
      screen.queryByRole("button", { name: "Change password" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Password")).not.toBeInTheDocument();
  });

  it("confirms after the password was changed, and clears the notice on the next attempt", async () => {
    auth.changePassword.mockResolvedValue({ ok: true });
    const u = userEvent.setup();
    render(<Account user={user} hasPassword />);

    await u.click(screen.getByRole("button", { name: "Change password" }));
    await u.type(screen.getByLabelText("Current password"), "oldsecret1");
    await u.type(screen.getByLabelText("New password"), "newsecret1");
    await u.type(screen.getByLabelText("Repeat new password"), "newsecret1");
    await u.click(
      screen.getAllByRole("button", { name: "Change password" }).at(-1)!,
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your password has been changed.",
    );
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();

    await u.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("can close the password dialog without changing anything", async () => {
    const u = userEvent.setup();
    render(<Account user={user} hasPassword />);

    await u.click(screen.getByRole("button", { name: "Change password" }));
    await u.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it("opens the delete dialog and goes back to the dashboard", async () => {
    const u = userEvent.setup();
    render(<Account user={user} hasPassword />);

    await u.click(screen.getByRole("button", { name: "Delete my account" }));
    expect(
      screen.getByRole("heading", { name: "Delete your account?" }),
    ).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Close" }));
    await u.click(screen.getByRole("button", { name: /back/i }));

    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });
});
