import type { Meta, StoryObj } from "@storybook/react";
import { TextareaField } from "./TextareaField";

const meta: Meta<typeof TextareaField> = {
  title: "UI/Common/TextareaField",
  component: TextareaField,
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

export const Default: Story = {
  args: {
    label: "A note for your guests",
    placeholder:
      "Thanks for celebrating with me! Anything on this list would make me so happy…",
    value: "",
    onChange: () => {},
  },
};
