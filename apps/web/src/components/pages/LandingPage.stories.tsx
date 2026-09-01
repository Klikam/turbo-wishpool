import type { Meta, StoryObj } from '@storybook/nextjs';
import LandingPage from './LandingPage';

const meta: Meta<typeof LandingPage> = {
  title: 'Pages/LandingPage',
  component: LandingPage,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
