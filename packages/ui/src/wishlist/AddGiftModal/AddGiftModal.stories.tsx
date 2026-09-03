import type { Meta, StoryObj } from "@storybook/react";
import { AddGiftModal } from "./AddGiftModal";

const meta: Meta<typeof AddGiftModal> = {
  title: "UI/Wishlist/AddGiftModal",
  component: AddGiftModal,
  parameters: { layout: "fullscreen" },
  args: {
    onAdd: () => {},
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
