import { OCCASION_LABELS, type WishlistPreview } from "@/types/wishlist";

/**
 * How a shared wishlist link is previewed in chat apps. Link-preview bots
 * can't sign in, so this never includes the gifts or the owner's note.
 */
export function wishlistPreview(wishlist: WishlistPreview) {
  const occasion = OCCASION_LABELS[wishlist.occasion ?? "other"];
  // A date-only string parses as UTC midnight, so it is formatted in UTC.
  const date =
    wishlist.date &&
    new Date(wishlist.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

  return {
    title: wishlist.title,
    occasion,
    /** E.g. "Emma Thornton · 14 November 2026". */
    details: [wishlist.ownerName, date].filter(Boolean).join(" · "),
    description: `${wishlist.ownerName}'s wishlist on Wishpool. Sign in to pick a gift — friends never pick the same one.`,
  };
}
