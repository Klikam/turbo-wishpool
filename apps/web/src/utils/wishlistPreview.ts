import { OCCASION_LABELS, type Wishlist } from "@/types/wishlist";

const MAX_DESCRIPTION_LENGTH = 160;

/** How a shared wishlist link is previewed in chat apps. */
export function wishlistPreview(wishlist: Wishlist) {
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
  const gifts = `${wishlist.gifts.length.toString()} ${
    wishlist.gifts.length === 1 ? "gift" : "gifts"
  }`;

  const note = wishlist.note?.trim();
  const description = note
    ? truncate(note, MAX_DESCRIPTION_LENGTH)
    : `${wishlist.ownerName}'s wishlist on Wishpool. Pick a gift — friends never pick the same one.`;

  return {
    title: wishlist.title,
    occasion,
    /** E.g. "Emma Thornton · 14 November 2026 · 3 gifts". */
    details: [wishlist.ownerName, date, gifts].filter(Boolean).join(" · "),
    description,
  };
}

function truncate(text: string, maxLength: number) {
  return text.length <= maxLength
    ? text
    : `${text.slice(0, maxLength - 1).trimEnd()}…`;
}
