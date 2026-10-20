import type { Meta, StoryObj } from "@storybook/react";
import { GuestNameModal } from "./GuestNameModal";

const meta: Meta<typeof GuestNameModal> = {
  title: "UI/Wishlist/GuestNameModal",
  component: GuestNameModal,
  parameters: { layout: "fullscreen" },
  args: {
    onConfirm: () => {},
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRememberedName: Story = {
  args: { initialName: "Noah Bennett" },
};
