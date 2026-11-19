import type { Meta, StoryObj } from '@storybook/nextjs';
import { mockWishlist } from '@/mocks/fixtures';
import WishlistForm from './WishlistForm';

const meta: Meta<typeof WishlistForm> = {
  title: 'Pages/WishlistForm',
  component: WishlistForm,
};

export default meta;
type Story = StoryObj<typeof WishlistForm>;

export const Create: Story = {
  args: { mode: 'create' as const, defaultCurrency: 'EUR' },
};

export const Edit: Story = {
  args: { mode: 'edit' as const, wishlist: mockWishlist() },
};
