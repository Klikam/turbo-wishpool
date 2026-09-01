import type { Meta, StoryObj } from '@storybook/nextjs';
import { mockOtherUser, mockUser, mockWishlist } from '@/mocks/fixtures';
import WishlistView from './WishlistView';

/**
 * WishlistView reads its data from localStorage and compares `currentUser`
 * against the wishlist's `ownerId` to decide owner vs. guest rendering.
 * The `withMockData` decorator seeds both before mount, so switching between
 * "owner" and "guest" here is just a matter of swapping the mock user.
 */
const meta: Meta<typeof WishlistView> = {
  title: 'Pages/WishlistView',
  component: WishlistView,
  args: {
    wishlistId: 'wishlist-1',
  },
  parameters: {
    mockData: { wishlists: [mockWishlist({ id: 'wishlist-1' })] },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AsOwner: Story = {
  parameters: {
    mockData: {
      user: mockUser,
      wishlists: [mockWishlist({ id: 'wishlist-1', ownerId: mockUser.id })],
    },
  },
};

export const AsGuest: Story = {
  parameters: {
    mockData: {
      user: mockOtherUser,
      wishlists: [mockWishlist({ id: 'wishlist-1', ownerId: mockUser.id })],
    },
  },
};

export const AsAnonymousVisitor: Story = {
  parameters: {
    mockData: {
      user: null,
      wishlists: [mockWishlist({ id: 'wishlist-1', ownerId: mockUser.id })],
    },
    docs: {
      description: {
        story: 'A shared link opened by someone who never signed in.',
      },
    },
  },
};

export const NoGiftsYet: Story = {
  parameters: {
    mockData: {
      user: mockUser,
      wishlists: [
        mockWishlist({ id: 'wishlist-1', ownerId: mockUser.id, gifts: [] }),
      ],
    },
  },
};

export const NotFound: Story = {
  args: { wishlistId: 'does-not-exist' },
  parameters: {
    mockData: {
      user: mockUser,
      wishlists: [mockWishlist({ id: 'wishlist-1', ownerId: mockUser.id })],
    },
  },
};
