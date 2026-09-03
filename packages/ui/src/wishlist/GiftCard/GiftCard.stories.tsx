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

export const OwnerView: Story = {
  args: { isOwner: true },
};

export const OwnerViewClaimed: Story = {
  args: { isOwner: true, claimed: true },
};

export const MinimalGift: Story = {
  args: { description: "", price: "", url: "" },
};
