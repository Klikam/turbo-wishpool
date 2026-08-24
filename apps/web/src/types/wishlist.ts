import z from 'zod';
import { GiftItemSchema } from './giftItem';

const WishlistSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
  title: z.string(),
  occasion: z.string(),
  date: z.string(),
  description: z.string(),
  gifts: z.array(GiftItemSchema),
  createdAt: z.string(),
});

export const WishlistArraySchema = z.array(WishlistSchema);

export type Wishlist = z.infer<typeof WishlistSchema>;
