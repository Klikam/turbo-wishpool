import { asc } from 'drizzle-orm';
import { giftsTable } from '../db/schema';

// Gifts are listed in the order they were added. The id breaks ties between
// gifts created before createdAt existed, which all share one timestamp.
export const giftsOrder = [asc(giftsTable.createdAt), asc(giftsTable.id)];

export const ownerGiftColumns = {
  id: giftsTable.id,
  wishlistId: giftsTable.wishlistId,
  name: giftsTable.name,
  description: giftsTable.description,
  price: giftsTable.price,
  url: giftsTable.url,
  imageUrl: giftsTable.imageUrl,
};
