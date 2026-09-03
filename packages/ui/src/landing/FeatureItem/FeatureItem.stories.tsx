import type { Meta, StoryObj } from "@storybook/react";
import { Star } from "lucide-react";
import { FeatureItem } from "./FeatureItem";

const meta: Meta<typeof FeatureItem> = {
  title: "UI/Landing/FeatureItem",
  component: FeatureItem,
  parameters: { layout: "centered", backgrounds: { default: "dark" } },
  args: {
    icon: <Star />,
    label: "No duplicate gifts — ever",
  },
  decorators: [
    (Story) => (
      <div className="bg-primary p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
