import type { Meta, StoryObj } from '@storybook/nextjs';
import { mockGift, mockWishlist } from '@/mocks/fixtures';
import Wishlist from './Wishlist';

/**
 * The page loads the wishlist on the server and passes it in. The backend
 * decides owner vs. another signed-in user (`isOwner`), so each story picks a view by the
 * wishlist it passes.
 */
const meta: Meta<typeof Wishlist> = {
  title: 'Pages/Wishlist',
  component: Wishlist,
  args: {
    wishlist: mockWishlist(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AsOwner: Story = {
  args: {
    // Owners never see reservations on their own list.
    wishlist: mockWishlist({
      gifts: [mockGift(), mockGift({ id: 'gifts-2', name: 'Coffee grinder' })],
    }),
  },
};

export const AsFriend: Story = {
  args: { wishlist: mockWishlist({ isOwner: false }) },
};

export const NoGiftsYet: Story = {
  args: { wishlist: mockWishlist({ gifts: [] }) },
};
