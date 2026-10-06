import type { Meta, StoryObj } from '@storybook/nextjs';
import { mockUser, mockWishlist, mockWishlists } from '@/mocks/fixtures';
import Dashboard from './Dashboard';

/**
 * Dashboard receives the signed-in user from its server component
 * (`app/dashboard/page.tsx` redirects to `/` when there's no session), so
 * stories pass `user` as an arg and seed wishlists via `parameters.mockData`.
 */
const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  args: {
    user: { id: mockUser.id, name: mockUser.name },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithWishlists: Story = {
  parameters: {
    mockData: { wishlists: mockWishlists },
  },
};

export const Empty: Story = {
  parameters: {
    mockData: { wishlists: [] },
  },
};

export const SingleWishlistNoGifts: Story = {
  parameters: {
    mockData: {
      wishlists: [mockWishlist({ gifts: [], date: '' })],
    },
  },
};
