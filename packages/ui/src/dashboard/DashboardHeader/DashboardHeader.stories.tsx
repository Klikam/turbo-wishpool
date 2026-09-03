import type { Meta, StoryObj } from "@storybook/react";
import { DashboardHeader } from "./DashboardHeader";

const meta: Meta<typeof DashboardHeader> = {
  title: "UI/Dashboard/DashboardHeader",
  component: DashboardHeader,
  parameters: { layout: "fullscreen" },
  args: {
    userName: "Emma Thornton",
    onLogout: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
