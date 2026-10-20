import { giftsTable } from '../db/schema';

export const ownerGiftColumns = {
  id: giftsTable.id,
  wishlistId: giftsTable.wishlistId,
  name: giftsTable.name,
  description: giftsTable.description,
  price: giftsTable.price,
  url: giftsTable.url,
  imageUrl: giftsTable.imageUrl,
};
