import type { Meta, StoryObj } from "@storybook/react";
import { ShareLinkButton } from "./ShareLinkButton";

const meta: Meta<typeof ShareLinkButton> = {
  title: "UI/Wishlist/ShareLinkButton",
  component: ShareLinkButton,
  parameters: { layout: "centered" },
  args: { url: "https://wishpool.app/wishlist/wishlist-1" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
