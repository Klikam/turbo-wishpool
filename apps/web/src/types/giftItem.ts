import z from 'zod';

/** `release`: free the gift for me. `share`: let me chip in. */
export const GiftRequestTypeSchema = z.enum(['release', 'share']);

export type GiftRequestType = z.infer<typeof GiftRequestTypeSchema>;

/**
 * A gift as returned by `GET /public/wishlists/:id` (apps/backend/src/public).
 * Reservation fields are relative to the viewer: `reservedByMe` is true when
 * the current user holds the reservation.
 */
export const GiftItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  url: z.string().nullable(),
  imageUrl: z.string().nullable(),
  reserved: z.boolean(),
  reservedByMe: z.boolean(),
  /** Everyone buying the gift (several = they split the price); never sent to the owner. */
  reservers: z.array(z.object({ name: z.string(), isMe: z.boolean() })),
  /** The viewer's own pending request to the reservers. */
  myRequest: z.object({ id: z.string(), type: GiftRequestTypeSchema }).nullable(),
  /** Requests waiting for the viewer's answer; only sent to reservers. */
  incomingRequests: z.array(
    z.object({
      id: z.string(),
      type: GiftRequestTypeSchema,
      requesterName: z.string(),
    }),
  ),
});

export type GiftItem = z.infer<typeof GiftItemSchema>;
