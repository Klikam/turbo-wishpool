import type { Meta, StoryObj } from '@storybook/nextjs';
import { mockOtherUser, mockUser, mockWishlist } from '@/mocks/fixtures';
import Wishlist from './Wishlist';

/**
 * Wishlist reads its data from localStorage and compares `currentUserId`
 * against the wishlists's `ownerId` to decide owner vs. guest rendering.
 * The `withMockData` decorator seeds the wishlists before mount, so switching
 * between "owner" and "guest" here is just a matter of swapping the arg.
 */
const meta: Meta<typeof Wishlist> = {
  title: 'Pages/Wishlist',
  component: Wishlist,
  args: {
    wishlistId: 'wishlists-1',
    currentUserId: mockUser.id,
  },
  parameters: {
    mockData: {
      wishlists: [mockWishlist({ id: 'wishlists-1', ownerId: mockUser.id })],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AsOwner: Story = {};

export const AsGuest: Story = {
  args: { currentUserId: mockOtherUser.id },
};

export const AsAnonymousVisitor: Story = {
  args: { currentUserId: null },
  parameters: {
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
      wishlists: [
        mockWishlist({ id: 'wishlists-1', ownerId: mockUser.id, gifts: [] }),
      ],
    },
  },
};

export const NotFound: Story = {
  args: { wishlistId: 'does-not-exist' },
};
