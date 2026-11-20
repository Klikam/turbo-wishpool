/** Today as `YYYY-MM-DD`, in UTC (the form wishlist dates are stored in). */
export function today(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

/**
 * A wishlist is past when its owner closed it, or its date is before today.
 * The day of the occasion itself is still open. Visitors can't reserve or ask
 * for gifts on a past list; the owner can still edit it.
 */
export function isPastWishlist(
  wishlist: { date: string | null; closed: boolean },
  now = new Date(),
) {
  return (
    wishlist.closed || (wishlist.date !== null && wishlist.date < today(now))
  );
}
