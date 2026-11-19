import type { Meta, StoryObj } from "@storybook/react";
import { GiftModal } from "./GiftModal";

const meta: Meta<typeof GiftModal> = {
  title: "UI/Wishlist/GiftModal",
  component: GiftModal,
  parameters: { layout: "fullscreen" },
  args: {
    currency: "EUR",
    onSave: () => {},
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {};

export const Edit: Story = {
  args: {
    gift: {
      name: "Wireless headphones",
      description: "Noise-cancelling, black or white",
      price: "149",
      url: "https://example.com/headphones",
      imageUrl: "",
    },
  },
};

export const Submitting: Story = {
  args: { submitting: true },
};

export const WithError: Story = {
  args: {
    error: "The link isn't a web address, e.g. https://shop.com/item",
  },
};
