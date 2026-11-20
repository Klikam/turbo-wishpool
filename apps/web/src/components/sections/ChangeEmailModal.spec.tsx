import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ changeEmail: vi.fn() }));
vi.mock("@/lib/auth", () => auth);

import { ChangeEmailModal } from "./ChangeEmailModal";

beforeEach(() => vi.resetAllMocks());

function setup() {
  const onClose = vi.fn();
  const onRequested = vi.fn();
  render(
    <ChangeEmailModal
      currentEmail="ann@example.com"
      onClose={onClose}
      onRequested={onRequested}
    />,
  );
  const user = userEvent.setup();
  return {
    onClose,
    onRequested,
    async submit(email: string) {
      await user.type(screen.getByLabelText("New email"), email);
      await user.click(
        screen.getByRole("button", { name: "Send verification link" }),
      );
    },
    user,
  };
}

describe("ChangeEmailModal", () => {
  it("can't be sent while the field is empty", () => {
    setup();

    expect(
      screen.getByRole("button", { name: "Send verification link" }),
    ).toBeDisabled();
  });

  it("sends the link to the trimmed address and tells the parent", async () => {
    auth.changeEmail.mockResolvedValue({ ok: true });
    const { submit, onRequested } = setup();

    await submit("  anna@example.com ");

    expect(auth.changeEmail).toHaveBeenCalledWith("anna@example.com");
    expect(onRequested).toHaveBeenCalledWith("anna@example.com");
  });

  it.each([
    ["something that isn't an address", "nope", "Enter a valid email address"],
    [
      "the current address, whatever its case",
      "Ann@Example.com",
      "That is already your email address",
    ],
  ])("rejects %s without calling the backend", async (_, email, message) => {
    const { submit, onRequested } = setup();

    await submit(email);

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(auth.changeEmail).not.toHaveBeenCalled();
    expect(onRequested).not.toHaveBeenCalled();
  });

  it("shows the backend's error and stays open", async () => {
    auth.changeEmail.mockResolvedValue({
      ok: false,
      error: "Too many attempts, try again in a minute",
    });
    const { submit, onRequested } = setup();

    await submit("anna@example.com");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts",
    );
    expect(onRequested).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Send verification link" }),
    ).toBeEnabled();
  });
});
