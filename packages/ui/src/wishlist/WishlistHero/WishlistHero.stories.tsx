import type { Meta, StoryObj } from "@storybook/react";
import { WishlistHero } from "./WishlistHero";

const meta: Meta<typeof WishlistHero> = {
  title: "UI/Wishlist/WishlistHero",
  component: WishlistHero,
  args: {
    occasion: "Birthday",
    title: "Emma's 30th Birthday",
    description:
      "Thanks for celebrating with me! Anything on this list would make me so happy.",
    date: "2026-11-14",
    giftsCount: 3,
    claimedCount: 1,
    isOwner: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AsGuest: Story = {};

export const AsOwner: Story = {
  args: { isOwner: true },
};

export const Minimal: Story = {
  args: { description: "", date: "", giftsCount: 0, claimedCount: 0 },
};
