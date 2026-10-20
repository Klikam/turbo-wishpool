import type { Meta, StoryObj } from '@storybook/nextjs';
import { mocked } from 'storybook/test';
import { getPublicWishlist } from '@/actions/wishlists';
import { mockGift, mockWishlist } from '@/mocks/fixtures';
import Wishlist from './Wishlist';

/**
 * Wishlist loads itself through the `getPublicWishlist` server action, which
 * Storybook replaces with `actions/__mocks__/wishlists.ts`. The backend decides
 * owner vs. guest (`isOwner`), so each story picks a view by what the mocked
 * action resolves to.
 */
const meta: Meta<typeof Wishlist> = {
  title: 'Pages/Wishlist',
  component: Wishlist,
  args: {
    wishlistId: 'wishlists-1',
    isSignedIn: true,
  },
  beforeEach: () => {
    mocked(getPublicWishlist).mockResolvedValue(mockWishlist());
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AsOwner: Story = {
  beforeEach: () => {
    // Owners never see reservations on their own list.
    mocked(getPublicWishlist).mockResolvedValue(
      mockWishlist({
        gifts: [mockGift(), mockGift({ id: 'gifts-2', name: 'Coffee grinder' })],
      }),
    );
  },
};

export const AsGuest: Story = {
  beforeEach: () => {
    mocked(getPublicWishlist).mockResolvedValue(
      mockWishlist({ isOwner: false }),
    );
  },
};

export const AsAnonymousVisitor: Story = {
  args: { isSignedIn: false },
  beforeEach: () => {
    mocked(getPublicWishlist).mockResolvedValue(
      mockWishlist({ isOwner: false }),
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'A shared link opened by someone who never signed in.',
      },
    },
  },
};

export const NoGiftsYet: Story = {
  beforeEach: () => {
    mocked(getPublicWishlist).mockResolvedValue(mockWishlist({ gifts: [] }));
  },
};

export const NotFound: Story = {
  beforeEach: () => {
    mocked(getPublicWishlist).mockResolvedValue(null);
  },
};
