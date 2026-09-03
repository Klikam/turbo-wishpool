import type { Meta, StoryObj } from "@storybook/react";
import { WishlistCard } from "./WishlistCard";

const meta: Meta<typeof WishlistCard> = {
  title: "UI/Dashboard/WishlistCard",
  component: WishlistCard,
  parameters: { layout: "centered" },
  args: {
    occasion: "Birthday",
    title: "Emma's 30th Birthday",
    date: "2026-11-14",
    giftsCount: 3,
    claimedCount: 1,
    onOpen: () => {},
    onDelete: () => {},
  },
  decorators: [
    (Story) => (
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoDate: Story = {
  args: { date: "" },
};

export const UnknownOccasion: Story = {
  args: { occasion: "Retirement" },
};
