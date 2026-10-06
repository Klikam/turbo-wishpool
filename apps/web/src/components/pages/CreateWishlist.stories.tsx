import type { Meta, StoryObj } from '@storybook/nextjs';
import { mockUser } from '@/mocks/fixtures';
import CreateWishlist from './CreateWishlist';

const meta: Meta<typeof CreateWishlist> = {
  title: 'Pages/CreateWishlist',
  component: CreateWishlist,
  args: {
    user: { id: mockUser.id, name: mockUser.name },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
