import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { OccasionPicker } from "./OccasionPicker";

const occasions = [
  "Birthday",
  "Wedding",
  "Baby shower",
  "Anniversary",
  "Christmas",
  "Graduation",
  "Housewarming",
  "Other",
] as const;

const meta: Meta<typeof OccasionPicker> = {
  title: "UI/Wishlist/OccasionPicker",
  component: OccasionPicker,
  args: {
    occasions,
    value: "Birthday",
    onChange: () => {},
  },
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

export const Default: Story = {};

export const Interactive: Story = {
  render: () => {
    function InteractiveDemo() {
      const [value, setValue] = useState<string>("Birthday");
      return (
        <OccasionPicker occasions={occasions} value={value} onChange={setValue} />
      );
    }
    return <InteractiveDemo />;
  },
};
