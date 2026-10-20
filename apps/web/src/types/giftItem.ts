import z from 'zod';

/**
 * A gift as returned by `GET /public/wishlists/:id` (apps/backend/src/public).
 * Reservation fields are relative to the viewer: `reservedByMe` is true when
 * the current user or guest token holds the reservation.
 */
export const GiftItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  url: z.string().nullable(),
  imageUrl: z.string().nullable(),
  reserved: z.boolean(),
  reservedByName: z.string().nullable(),
  reservedByMe: z.boolean(),
});

export type GiftItem = z.infer<typeof GiftItemSchema>;
