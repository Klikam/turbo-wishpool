import type { Meta, StoryObj } from '@storybook/nextjs';
import WishlistSignIn from './WishlistSignIn';

/** A shared wishlist link opened by someone who isn't signed in. */
const meta: Meta<typeof WishlistSignIn> = {
  title: 'Pages/WishlistSignIn',
  component: WishlistSignIn,
  args: {
    wishlist: {
      id: 'wishlists-1',
      title: "Emma's 30th Birthday",
      occasion: 'birthday',
      date: '2026-11-14',
      ownerName: 'Emma Thornton',
      isPast: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The list has ended: the visitor is told before signing in. */
export const Past: Story = {
  args: {
    wishlist: {
      id: 'wishlists-1',
      title: "Emma's 30th Birthday",
      occasion: 'birthday',
      date: '2026-11-14',
      ownerName: 'Emma Thornton',
      isPast: true,
    },
  },
};
