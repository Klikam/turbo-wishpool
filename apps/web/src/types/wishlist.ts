import z from 'zod';
import { GiftItemSchema } from './giftItem';

// Mirrors `occasionEnum` in apps/backend/src/db/schema.ts
export const OccasionSchema = z.enum([
  'birthday',
  'wedding',
  'baby_shower',
  'anniversary',
  'christmas',
  'graduation',
  'housewarming',
  'other',
]);

export type Occasion = z.infer<typeof OccasionSchema>;

export const OCCASION_LABELS: Record<Occasion, string> = {
  birthday: 'Birthday',
  wedding: 'Wedding',
  baby_shower: 'Baby shower',
  anniversary: 'Anniversary',
  christmas: 'Christmas',
  graduation: 'Graduation',
  housewarming: 'Housewarming',
  other: 'Other',
};

/**
 * A wishlist as returned by `GET /public/wishlists/:id`. `isOwner` is true
 * when the request was made by the list's owner, who never sees reservations.
 */
export const WishlistSchema =z.object({
  id: z.string(),
  ownerName: z.string(),
  isOwner: z.boolean(),
  title: z.string(),
  occasion: OccasionSchema.nullable(),
  date: z.string().nullable(),
  note: z.string().nullable(),
  gifts: z.array(GiftItemSchema),
});

export type Wishlist = z.infer<typeof WishlistSchema>;

/**
 * A wishlist as shown on the dashboard: `GET /wishlists` plus the number of
 * gifts (from `GET /wishlists/:id`). Reservation counts aren't available to
 * owners, by design.
 */
export interface WishlistSummary {
  id: string;
  title: string;
  occasion: Occasion | null;
  date: string | null;
  note: string | null;
  giftsCount: number;
}
