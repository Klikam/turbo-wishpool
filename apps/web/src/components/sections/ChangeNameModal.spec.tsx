import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ changeName: vi.fn() }));
vi.mock("@/lib/auth", () => auth);

import { ChangeNameModal } from "./ChangeNameModal";

beforeEach(() => vi.resetAllMocks());

function setup() {
  const onClose = vi.fn();
  const onChanged = vi.fn();
  render(
    <ChangeNameModal
      currentName="Ann Lee"
      onClose={onClose}
      onChanged={onChanged}
    />,
  );
  const user = userEvent.setup();
  return {
    onClose,
    onChanged,
    async submit(name: string) {
      const field = screen.getByLabelText("Name");
      await user.clear(field);
      await user.type(field, name);
      await user.click(screen.getByRole("button", { name: "Save name" }));
    },
    user,
  };
}

describe("ChangeNameModal", () => {
  it("starts with the current name and can't save it unchanged", () => {
    setup();

    expect(screen.getByLabelText("Name")).toHaveValue("Ann Lee");
    expect(screen.getByRole("button", { name: "Save name" })).toBeDisabled();
  });

  it("changes the name, trimmed, and tells the parent", async () => {
    auth.changeName.mockResolvedValue({ ok: true });
    const { submit, onChanged } = setup();

    await submit("  Anna Lee ");

    expect(auth.changeName).toHaveBeenCalledWith("Anna Lee");
    expect(onChanged).toHaveBeenCalledOnce();
  });

  it.each([
    ["a name that is too short", "A", "Name must contain at least 2 characters"],
    [
      "a name that is too long",
      "a".repeat(101),
      "Name must contain no more than 100 characters",
    ],
  ])("rejects %s without calling the backend", async (_, name, message) => {
    const { submit, onChanged } = setup();

    await submit(name);

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(auth.changeName).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("shows the backend's error and stays open", async () => {
    auth.changeName.mockResolvedValue({
      ok: false,
      error: "Your name couldn't be changed. Please try again.",
    });
    const { submit, onChanged } = setup();

    await submit("Anna Lee");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your name couldn't be changed",
    );
    expect(onChanged).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save name" })).toBeEnabled();
  });
});
