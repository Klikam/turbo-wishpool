import type { Meta, StoryObj } from "@storybook/react";
import { LandingHero } from "./LandingHero";

const meta: Meta<typeof LandingHero> = {
  title: "UI/Landing/LandingHero",
  component: LandingHero,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
