import type { Meta, StoryObj } from "@storybook/react";
import { BackButton } from "./BackButton";

const meta: Meta<typeof BackButton> = {
  title: "UI/Common/BackButton",
  component: BackButton,
  parameters: { layout: "centered" },
  args: { onClick: () => {} },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "Back to dashboard" },
};
