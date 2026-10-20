import type { GiftItem } from '@/types/giftItem';
import type { User } from '@/types/user';
import type { Wishlist, WishlistSummary } from '@/types/wishlist';

export const mockUser: User = {
  id: 'users-1',
  name: 'Emma Thornton',
  email: 'emma@example.com',
  avatar: '',
  provider: 'google',
};

export const mockOtherUser: User = {
  id: 'users-2',
  name: 'Noah Bennett',
  email: 'noah@example.com',
  avatar: '',
  provider: 'email',
};

export const mockGift = (overrides: Partial<GiftItem> = {}): GiftItem => ({
  id: 'gifts-1',
  name: 'Wireless headphones',
  description: 'Noise-cancelling, black or white',
  price: 149,
  url: 'https://example.com/headphones',
  imageUrl: null,
  reserved: false,
  reservedByName: null,
  reservedByMe: false,
  ...overrides,
});

export const mockGifts: GiftItem[] = [
  mockGift(),
  mockGift({
    id: 'gifts-2',
    name: 'Coffee grinder',
    description: 'Burr grinder, stainless steel',
    price: 89,
    url: null,
    reserved: true,
    reservedByName: 'Noah Bennett',
    reservedByMe: false,
  }),
  mockGift({
    id: 'gifts-3',
    name: 'Cookbook: Weeknight Pasta',
    description: null,
    price: null,
    url: 'https://example.com/cookbook',
  }),
];

export const mockWishlist = (overrides: Partial<Wishlist> = {}): Wishlist => ({
  id: 'wishlists-1',
  ownerName: mockUser.name,
  isOwner: true,
  title: "Emma's 30th Birthday",
  occasion: 'birthday',
  date: '2026-11-14',
  note: 'Thanks for celebrating with me! Anything on this list would make me so happy.',
  gifts: mockGifts,
  ...overrides,
});

export const mockWishlistSummary = (
  overrides: Partial<WishlistSummary> = {},
): WishlistSummary => ({
  id: 'wishlists-1',
  title: "Emma's 30th Birthday",
  occasion: 'birthday',
  date: '2026-11-14',
  note: null,
  giftsCount: 3,
  ...overrides,
});

export const mockWishlistSummaries: WishlistSummary[] = [
  mockWishlistSummary(),
  mockWishlistSummary({
    id: 'wishlists-2',
    title: 'Housewarming Party',
    occasion: 'housewarming',
    date: null,
    giftsCount: 0,
  }),
];
