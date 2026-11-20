import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GiftModal } from "./GiftModal";

function setup(props: Partial<Parameters<typeof GiftModal>[0]> = {}) {
  const onSave = vi.fn();
  render(
    <GiftModal currency="EUR" onSave={onSave} onClose={vi.fn()} {...props} />,
  );
  return { onSave, user: userEvent.setup() };
}

describe("GiftModal", () => {
  it("saves with Enter from any field, trimming what was typed", async () => {
    const { user, onSave } = setup();

    await user.type(screen.getByLabelText("Gift name *"), "  Book  ");
    await user.type(screen.getByLabelText("Price (EUR)"), "12,50{Enter}");

    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave).toHaveBeenCalledWith({
      name: "Book",
      description: "",
      price: "12,50",
      url: "",
      imageUrl: "",
    });
  });

  it("does not save with Enter while the name is blank", async () => {
    const { user, onSave } = setup();

    await user.type(screen.getByLabelText("Gift name *"), "   {Enter}");

    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not save with Enter while a save is already running", async () => {
    const { user, onSave } = setup({ submitting: true });

    await user.type(screen.getByLabelText("Gift name *"), "Book{Enter}");

    expect(onSave).not.toHaveBeenCalled();
  });

  it("accepts a link without a scheme instead of stopping at the browser's own URL check", async () => {
    const { user, onSave } = setup();

    await user.type(screen.getByLabelText("Gift name *"), "Book");
    await user.type(screen.getByLabelText("Link (URL)"), "shop.com/item{Enter}");

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ url: "shop.com/item" }),
    );
  });

  it("limits the fields to what the backend accepts", () => {
    setup();

    expect(screen.getByLabelText("Gift name *")).toHaveAttribute(
      "maxlength",
      "255",
    );
    expect(screen.getByLabelText("Description")).toHaveAttribute(
      "maxlength",
      "2000",
    );
    expect(screen.getByLabelText("Link (URL)")).toHaveAttribute(
      "maxlength",
      "2048",
    );
    expect(screen.getByLabelText("Image URL")).toHaveAttribute(
      "maxlength",
      "2048",
    );
  });
});
