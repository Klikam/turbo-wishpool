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
 * A wishlist as returned by `GET /public/wishlists/:id`.
 *
 * TODO mock - `ownerId` is not part of the API response. It only lets the
 * localStorage mock tell owner from guest; once the pages call the backend,
 * drop it and use the `isOwner` flag the API returns instead.
 */
const WishlistSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  ownerName: z.string(),
  title: z.string(),
  occasion: OccasionSchema.nullable(),
  date: z.string().nullable(),
  note: z.string().nullable(),
  gifts: z.array(GiftItemSchema),
});

export const WishlistArraySchema = z.array(WishlistSchema);

export type Wishlist = z.infer<typeof WishlistSchema>;
