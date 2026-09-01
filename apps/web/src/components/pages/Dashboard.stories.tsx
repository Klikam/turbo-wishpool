import type { Meta, StoryObj } from '@storybook/nextjs';
import { mockUser, mockWishlist, mockWishlists } from '@/mocks/fixtures';
import Dashboard from './Dashboard';

/**
 * Dashboard only renders content once a user is signed in (it redirects to
 * `/` otherwise), so every story here seeds `parameters.mockData.user` via
 * the global `withMockData` decorator instead of going through a real login.
 */
const meta: Meta<typeof Dashboard> = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  parameters: {
    mockData: { user: mockUser },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const WithWishlists: Story = {
  parameters: {
    mockData: { user: mockUser, wishlists: mockWishlists },
  },
};

export const Empty: Story = {
  parameters: {
    mockData: { user: mockUser, wishlists: [] },
  },
};

export const SingleWishlistNoGifts: Story = {
  parameters: {
    mockData: {
      user: mockUser,
      wishlists: [mockWishlist({ gifts: [], date: '' })],
    },
  },
};

export const LoggedOut: Story = {
  parameters: {
    mockData: { user: null, wishlists: mockWishlists },
    docs: {
      description: {
        story:
          'No mock user: mirrors the real "not signed in" state, where the component redirects and renders nothing.',
      },
    },
  },
};
