import z from 'zod';

export const GiftItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  url: z.string(),
  imageUrl: z.string(),
  claimed: z.boolean(),
  claimedByHash: z.string().nullable(), // string | null
});

export type GiftItem = z.infer<typeof GiftItemSchema>;
