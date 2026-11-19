import { getPublicWishlist } from "@/actions/wishlists";
import { ogCard, ogImageContentType, ogImageSize } from "@/lib/ogImage";
import { wishlistPreview } from "@/utils/wishlistPreview";

export const alt = "A wishlist on Wishpool";
export const size = ogImageSize;
export const contentType = ogImageContentType;

/** The card shown when a wishlist link is shared. */
export default async function WishlistOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const wishlist = await getPublicWishlist((await params).id);
  if (!wishlist) return ogCard({ title: "Wishlist not found" });

  const { title, occasion, details } = wishlistPreview(wishlist);
  return ogCard({ eyebrow: occasion, title, subtitle: details });
}
