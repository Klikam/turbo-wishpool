import type { Meta, StoryObj } from '@storybook/nextjs';
import CreateWishlist from './CreateWishlist';

const meta: Meta<typeof CreateWishlist> = {
  title: 'Pages/CreateWishlist',
  component: CreateWishlist,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
