import type { Meta, StoryObj } from "@storybook/react";
import { PartyPopper, ShoppingBag } from "lucide-react";
import { EmptyState } from "./EmptyState";

const meta: Meta<typeof EmptyState> = {
  title: "UI/Common/EmptyState",
  component: EmptyState,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const MessageOnly: Story = {
  args: {
    icon: <ShoppingBag />,
    message: "No gifts on this list yet.",
  },
};

export const WithAction: Story = {
  args: {
    icon: <PartyPopper />,
    message: "No wishlists yet — create your first one!",
    action: { label: "Create wishlist", onClick: () => {} },
    bordered: true,
  },
};
