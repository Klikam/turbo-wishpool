import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { SelectField } from "./SelectField";

const options = [
  { value: "EUR", label: "EUR — Euro" },
  { value: "PLN", label: "PLN — Polish Zloty" },
  { value: "USD", label: "USD — US Dollar" },
];

const meta: Meta<typeof SelectField> = {
  title: "UI/Common/SelectField",
  component: SelectField,
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
    label: "Currency",
    value: "PLN",
    options,
    onChange: () => {},
  },
};

export const Interactive: Story = {
  args: { label: "Currency", value: "EUR", options, onChange: () => {} },
  render: () => {
    function InteractiveDemo() {
      const [value, setValue] = useState("EUR");
      return (
        <SelectField
          label="Currency"
          value={value}
          onChange={setValue}
          options={options}
        />
      );
    }
    return <InteractiveDemo />;
  },
};
