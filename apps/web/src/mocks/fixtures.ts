import type { GiftItem } from '@/types/giftItem';
import type { User } from '@/types/user';
import type { Wishlist } from '@/types/wishlist';

export const mockUser: User = {
  id: 'user-1',
  name: 'Emma Thornton',
  email: 'emma@example.com',
  avatar: '',
  provider: 'google',
};

export const mockOtherUser: User = {
  id: 'user-2',
  name: 'Noah Bennett',
  email: 'noah@example.com',
  avatar: '',
  provider: 'email',
};

export const mockGift = (overrides: Partial<GiftItem> = {}): GiftItem => ({
  id: 'gift-1',
  name: 'Wireless headphones',
  description: 'Noise-cancelling, black or white',
  price: '€ 149.00',
  url: 'https://example.com/headphones',
  imageUrl: '',
  claimed: false,
  claimedByHash: null,
  ...overrides,
});

export const mockGifts: GiftItem[] = [
  mockGift(),
  mockGift({
    id: 'gift-2',
    name: 'Coffee grinder',
    description: 'Burr grinder, stainless steel',
    price: '€ 89.00',
    url: '',
    claimed: true,
    claimedByHash: 'guest-hash-someone-else',
  }),
  mockGift({
    id: 'gift-3',
    name: 'Cookbook: Weeknight Pasta',
    description: '',
    price: '',
    url: 'https://example.com/cookbook',
    claimed: false,
  }),
];

export const mockWishlist = (overrides: Partial<Wishlist> = {}): Wishlist => ({
  id: 'wishlist-1',
  ownerId: mockUser.id,
  ownerName: mockUser.name,
  title: "Emma's 30th Birthday",
  occasion: 'Birthday',
  date: '2026-11-14',
  description:
    'Thanks for celebrating with me! Anything on this list would make me so happy.',
  gifts: mockGifts,
  createdAt: '2026-08-01T10:00:00.000Z',
  ...overrides,
});

export const mockWishlists: Wishlist[] = [
  mockWishlist(),
  mockWishlist({
    id: 'wishlist-2',
    title: 'Housewarming Party',
    occasion: 'Housewarming',
    date: '',
    description: '',
    gifts: [],
    createdAt: '2026-07-15T10:00:00.000Z',
  }),
];
