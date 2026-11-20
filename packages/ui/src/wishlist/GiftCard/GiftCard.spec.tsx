import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GiftCard } from "./GiftCard";

type Props = Parameters<typeof GiftCard>[0];

function setup(props: Partial<Props> = {}) {
  const handlers = {
    onClaim: vi.fn(),
    onUnclaim: vi.fn(),
    onRequest: vi.fn(),
    onCancelRequest: vi.fn(),
    onRespond: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };
  render(
    <GiftCard
      name="Headphones"
      claimed={false}
      isOwner={false}
      isMine={false}
      {...handlers}
      {...props}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
}

describe("GiftCard as a visitor", () => {
  it("lets me claim a free gift", async () => {
    const { user, onClaim } = setup({
      price: "€ 99.00",
      description: "Wireless",
    });

    expect(
      screen.getByRole("heading", { name: "Headphones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("€ 99.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "I'll gift this" }));

    expect(onClaim).toHaveBeenCalledOnce();
  });

  it("lets me undo my own claim", async () => {
    const { user, onUnclaim } = setup({
      claimed: true,
      isMine: true,
      reservers: [{ name: "Me", isMe: true }],
    });

    expect(screen.getByText("You're gifting this")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(onUnclaim).toHaveBeenCalledOnce();
  });

  it("says who else is buying a shared gift", () => {
    setup({
      claimed: true,
      isMine: true,
      reservers: [
        { name: "Me", isMe: true },
        { name: "Bob", isMe: false },
      ],
      pricePerPerson: "€ 49.50",
    });

    expect(
      screen.getByText("You're gifting this with Bob"),
    ).toBeInTheDocument();
    expect(screen.getByText("Split 2 ways: € 49.50 each")).toBeInTheDocument();
  });

  it("names who claimed somebody else's gift", () => {
    setup({ claimed: true, reservers: [{ name: "Bob", isMe: false }] });

    expect(screen.getByText("Claimed by Bob")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "I'll gift this" }),
    ).not.toBeInTheDocument();
  });

  it("offers to ask for a claimed gift to be freed or shared", async () => {
    const { user, onRequest } = setup({
      claimed: true,
      reservers: [{ name: "Bob", isMe: false }],
      pricePerPersonIfJoined: "€ 49.50",
    });

    await user.click(screen.getByRole("button", { name: "Ask to free" }));
    await user.click(
      screen.getByRole("button", { name: "Ask to share · € 49.50 each" }),
    );

    expect(onRequest).toHaveBeenNthCalledWith(1, "release");
    expect(onRequest).toHaveBeenNthCalledWith(2, "share");
  });

  it("cannot ask to free a gift that several people already share", () => {
    setup({
      claimed: true,
      reservers: [
        { name: "Bob", isMe: false },
        { name: "Cid", isMe: false },
      ],
    });

    expect(
      screen.queryByRole("button", { name: "Ask to free" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ask to share" }),
    ).toBeInTheDocument();
  });

  it("shows my pending request and lets me cancel it", async () => {
    const { user, onCancelRequest } = setup({
      claimed: true,
      reservers: [{ name: "Bob", isMe: false }],
      myRequest: { type: "share" },
    });

    await user.click(
      screen.getByRole("button", { name: "Asked to share · Cancel" }),
    );

    expect(onCancelRequest).toHaveBeenCalledOnce();
    expect(
      screen.queryByRole("button", { name: "Ask to free" }),
    ).not.toBeInTheDocument();
  });

  it("lets a holder accept or decline incoming requests", async () => {
    const { user, onRespond } = setup({
      claimed: true,
      isMine: true,
      reservers: [{ name: "Me", isMe: true }],
      incomingRequests: [
        { id: "r1", type: "release", requesterName: "Bob" },
        { id: "r2", type: "share", requesterName: "Cid" },
      ],
    });

    expect(screen.getByText("asks you to free this gift")).toBeInTheDocument();
    expect(
      screen.getByText("asks to share this gift with you"),
    ).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Accept" })[0]!);
    await user.click(screen.getAllByRole("button", { name: "Decline" })[1]!);

    expect(onRespond).toHaveBeenNthCalledWith(1, "r1", true);
    expect(onRespond).toHaveBeenNthCalledWith(2, "r2", false);
  });

  it("blocks every button while something is saving", () => {
    setup({ disabled: true });

    expect(
      screen.getByRole("button", { name: "I'll gift this" }),
    ).toBeDisabled();
  });

  it("marks the busy button for assistive technology", () => {
    setup({ busy: true });

    expect(
      screen.getByRole("button", { name: "I'll gift this" }),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("links to the shop safely", () => {
    setup({ url: "https://shop.test/x" });

    const link = screen.getByRole("link", { name: /View item/ });
    expect(link).toHaveAttribute("href", "https://shop.test/x");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("falls back to a placeholder when the image cannot load", () => {
    setup({ imageUrl: "https://shop.test/broken.jpg" });

    const image = screen.getByRole("img", { name: "Headphones" });
    expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
    fireEvent.error(image);

    expect(
      screen.queryByRole("img", { name: "Headphones" }),
    ).not.toBeInTheDocument();
  });
});

describe("GiftCard as the owner", () => {
  it("can edit and delete, but never sees who claimed it", async () => {
    const { user, onEdit, onDelete } = setup({ isOwner: true, claimed: true });

    expect(screen.getByText("Someone is gifting this")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "I'll gift this" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit Headphones" }));
    await user.click(screen.getByRole("button", { name: "Delete Headphones" }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("does not show visitor controls to others", () => {
    setup({ isOwner: false });

    expect(
      screen.queryByRole("button", { name: "Edit Headphones" }),
    ).not.toBeInTheDocument();
  });
});
