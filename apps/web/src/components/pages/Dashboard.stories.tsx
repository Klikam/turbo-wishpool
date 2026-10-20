import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  mockUser,
  mockWishlistSummaries,
  mockWishlistSummary,
} from '@/mocks/fixtures';
import Dashboard from './Dashboard';

/**
 * Dashboard receives the signed-in user and the owner's wishlists from its
 * server component (`app/dashboard/page.tsx` redirects to `/` when there's no
 * session), so stories pass both as args.
 */
const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  args: {
    user: { id: mockUser.id, name: mockUser.name },
    wishlists: mockWishlistSummaries,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithWishlists: Story = {};

export const Empty: Story = {
  args: { wishlists: [] },
};

export const SingleWishlistNoGifts: Story = {
  args: {
    wishlists: [mockWishlistSummary({ giftsCount: 0, date: null })],
  },
};
