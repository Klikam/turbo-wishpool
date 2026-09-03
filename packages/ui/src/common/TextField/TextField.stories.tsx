import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TextField } from "./TextField";

const meta: Meta<typeof TextField> = {
  title: "UI/Common/TextField",
  component: TextField,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "List title",
    placeholder: "Emma's 30th Birthday",
    value: "",
    onChange: () => {},
  },
};

export const Compact: Story = {
  args: {
    label: "Price",
    placeholder: "€ 49.90",
    value: "",
    onChange: () => {},
    compact: true,
  },
};

export const Interactive: Story = {
  args: { label: "List title", value: "", onChange: () => {} },
  render: () => {
    function InteractiveDemo() {
      const [value, setValue] = useState("");
      return (
        <TextField label="List title" value={value} onChange={setValue} />
      );
    }
    return <InteractiveDemo />;
  },
};
