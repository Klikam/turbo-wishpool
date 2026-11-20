import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

function setup(open = true) {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  render(
    <ConfirmDeleteDialog
      open={open}
      title="Delete this wishlist?"
      description="This can't be undone."
      onConfirm={onConfirm}
      onClose={onClose}
    />,
  );
  return { onConfirm, onClose, user: userEvent.setup() };
}

describe("ConfirmDeleteDialog", () => {
  it("shows nothing while closed", () => {
    setup(false);

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("explains what is about to be deleted", () => {
    setup();

    expect(
      screen.getByRole("alertdialog", { name: "Delete this wishlist?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("This can't be undone.")).toBeInTheDocument();
  });

  it("confirms, then closes", async () => {
    const { user, onConfirm, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalled();
  });

  it("cancels without deleting", async () => {
    const { user, onConfirm, onClose } = setup();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape without deleting", async () => {
    const { user, onConfirm, onClose } = setup();

    await user.keyboard("{Escape}");

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
