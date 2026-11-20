import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ changePassword: vi.fn() }));
vi.mock("@/lib/auth", () => auth);

import { ChangePasswordModal } from "./ChangePasswordModal";

beforeEach(() => vi.resetAllMocks());

function setup() {
  const onClose = vi.fn();
  const onChanged = vi.fn();
  render(<ChangePasswordModal onClose={onClose} onChanged={onChanged} />);
  const user = userEvent.setup();
  return {
    onClose,
    onChanged,
    async submit(current: string, next: string, repeat = next) {
      await user.type(screen.getByLabelText("Current password"), current);
      await user.type(screen.getByLabelText("New password"), next);
      await user.type(screen.getByLabelText("Repeat new password"), repeat);
      await user.click(screen.getByRole("button", { name: "Change password" }));
    },
    user,
  };
}

describe("ChangePasswordModal", () => {
  it("changes the password and tells the parent", async () => {
    auth.changePassword.mockResolvedValue({ ok: true });
    const { submit, onChanged } = setup();

    await submit("oldsecret1", "newsecret1");

    expect(auth.changePassword).toHaveBeenCalledWith(
      "oldsecret1",
      "newsecret1",
    );
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it.each([
    [
      "a weak new password",
      ["oldsecret1", "short"],
      "Password must contain at least 8 characters",
    ],
    [
      "mismatching entries",
      ["oldsecret1", "newsecret1", "newsecret2"],
      "The two new passwords don't match",
    ],
    [
      "the same password again",
      ["oldsecret1", "oldsecret1"],
      "Your new password must differ from the current one",
    ],
  ])(
    "refuses %s before calling the backend",
    async (_label, [current, next, repeat], message) => {
      const { submit, onChanged } = setup();

      await submit(current!, next!, repeat);

      expect(await screen.findByRole("alert")).toHaveTextContent(message);
      expect(auth.changePassword).not.toHaveBeenCalled();
      expect(onChanged).not.toHaveBeenCalled();
    },
  );

  it("shows a wrong-current-password error and lets the user retry", async () => {
    auth.changePassword.mockResolvedValue({
      ok: false,
      error: "Your current password isn't right.",
    });
    const { submit, onChanged } = setup();

    await submit("wrongpass1", "newsecret1");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "current password isn't right",
    );
    expect(onChanged).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Change password" }),
    ).toBeEnabled();
  });

  it("warns that other devices are signed out", () => {
    setup();

    expect(
      screen.getByText(/your other devices are signed out/),
    ).toBeInTheDocument();
  });

  it("closes with the close button", async () => {
    const { user, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });
});
