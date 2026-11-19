import type { Meta, StoryObj } from "@storybook/react";
import { GiftCard } from "./GiftCard";

const meta: Meta<typeof GiftCard> = {
  title: "UI/Wishlist/GiftCard",
  component: GiftCard,
  parameters: { layout: "centered" },
  args: {
    name: "Wireless headphones",
    description: "Noise-cancelling, black or white",
    price: "€ 149.00",
    url: "https://example.com/headphones",
    claimed: false,
    isOwner: false,
    isMine: false,
    onClaim: () => {},
    onUnclaim: () => {},
    onDelete: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GuestUnclaimed: Story = {};

export const GuestClaimedByMe: Story = {
  args: { claimed: true, isMine: true },
};

export const GuestClaimedBySomeoneElse: Story = {
  args: { claimed: true, isMine: false },
};

/** Someone else's gift: the viewer can ask them to free it or to share it. */
export const GuestCanAskToShare: Story = {
  args: {
    claimed: true,
    reservers: [{ name: "Oliver Grant", isMe: false }],
    pricePerPersonIfJoined: "€ 74.50",
    onRequest: () => {},
  },
};

export const GuestWaitingForAnswer: Story = {
  args: {
    claimed: true,
    reservers: [{ name: "Oliver Grant", isMe: false }],
    myRequest: { type: "share" },
    onCancelRequest: () => {},
  },
};

/** Already shared: only "share" is offered, and the split is shown. */
export const SharedBySeveral: Story = {
  args: {
    claimed: true,
    reservers: [
      { name: "Oliver Grant", isMe: false },
      { name: "Maya Lin", isMe: false },
    ],
    pricePerPerson: "€ 74.50",
    pricePerPersonIfJoined: "€ 49.67",
    onRequest: () => {},
  },
};

/** The viewer holds the gift and has requests to answer. */
export const MineWithRequests: Story = {
  args: {
    claimed: true,
    isMine: true,
    reservers: [{ name: "Me", isMe: true }],
    incomingRequests: [
      { id: "r1", type: "release", requesterName: "Maya Lin" },
      { id: "r2", type: "share", requesterName: "Tom Reed" },
    ],
    onRespond: () => {},
  },
};

export const OwnerView: Story = {
  args: { isOwner: true },
};

export const OwnerViewClaimed: Story = {
  args: { isOwner: true, claimed: true },
};

export const MinimalGift: Story = {
  args: { description: "", price: "", url: "" },
};

/** The reservation is being saved; another click does nothing. */
export const Saving: Story = {
  args: { busy: true, disabled: true },
};
