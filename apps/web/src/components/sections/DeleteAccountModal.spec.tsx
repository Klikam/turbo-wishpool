import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ deleteAccount: vi.fn(), logout: vi.fn() }));
vi.mock("@/lib/auth", () => auth);

import { DeleteAccountModal } from "./DeleteAccountModal";

const assign = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { assign },
  });
});

function setup(hasPassword = true) {
  const onClose = vi.fn();
  render(<DeleteAccountModal hasPassword={hasPassword} onClose={onClose} />);
  return { onClose, user: userEvent.setup() };
}

describe("DeleteAccountModal", () => {
  it("needs the password before deleting an account that has one", async () => {
    const { user } = setup();
    const button = screen.getByRole("button", { name: "Delete my account" });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText("Your password"), "secret123");

    expect(button).toBeEnabled();
  });

  it("deletes with the password and leaves with a full page load", async () => {
    auth.deleteAccount.mockResolvedValue({ ok: true });
    const { user } = setup();

    await user.type(screen.getByLabelText("Your password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Delete my account" }));

    expect(auth.deleteAccount).toHaveBeenCalledWith("secret123");
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
  });

  it("asks nothing of accounts without a password (social sign-in)", async () => {
    auth.deleteAccount.mockResolvedValue({ ok: true });
    const { user } = setup(false);

    expect(screen.queryByLabelText("Your password")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete my account" }));

    expect(auth.deleteAccount).toHaveBeenCalledWith(undefined);
  });

  it("shows a wrong-password error and lets the user retry", async () => {
    auth.deleteAccount.mockResolvedValue({
      ok: false,
      error: "That password isn't right.",
    });
    const { user } = setup();

    await user.type(screen.getByLabelText("Your password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Delete my account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "That password isn't right.",
    );
    expect(
      screen.getByRole("button", { name: "Delete my account" }),
    ).toBeEnabled();
    expect(assign).not.toHaveBeenCalled();
  });

  it("sends users with a stale session through sign-in and back to the account page", async () => {
    auth.deleteAccount.mockResolvedValue({
      ok: false,
      needsRecentSignIn: true,
      error: "For your safety, sign in again, then delete your account.",
    });
    auth.logout.mockResolvedValue(undefined);
    const { user } = setup(false);

    await user.click(screen.getByRole("button", { name: "Delete my account" }));
    await user.click(
      await screen.findByRole("button", { name: "Sign in again" }),
    );

    expect(auth.logout).toHaveBeenCalled();
    expect(assign).toHaveBeenCalledWith("/?next=%2Faccount");
  });

  it("closes with the close button", async () => {
    const { user, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });
});
