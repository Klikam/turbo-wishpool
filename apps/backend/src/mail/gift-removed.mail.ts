import type { MailMessage } from './mail.service';

export interface RemovedReservation {
  /** The person who reserved the gift. */
  to: string;
  giftName: string;
  wishlistTitle: string;
  ownerName: string;
}

/**
 * Tells someone that a gift they reserved was edited, naming what changed
 * (e.g. "name", "price") so they can decide whether it still suits them.
 */
export function giftEditedMail(
  reservation: RemovedReservation,
  newName: string,
  changes: string[],
): MailMessage {
  return {
    to: reservation.to,
    subject: `A gift you reserved was changed on "${reservation.wishlistTitle}"`,
    text: `${reservation.ownerName} changed the gift "${newName}" on their wishlist "${reservation.wishlistTitle}" on Wishpool. What changed: ${changes.join(', ')}.\n\nYour reservation is still in place; open the wishlist to see the details.`,
  };
}

/**
 * Tells someone that gifts they reserved are gone from the list, so the
 * reservation is gone too. Owners never learn that a gift was reserved, so
 * this is the only way the reserver finds out. One email per person, however
 * many of their gifts were removed together (e.g. a whole list).
 */
export function giftsRemovedMail(
  to: string,
  removed: Pick<
    RemovedReservation,
    'giftName' | 'wishlistTitle' | 'ownerName'
  >[],
): MailMessage {
  const [first] = removed;
  const single = removed.length === 1 && first;

  if (single) {
    return {
      to,
      subject: `A gift you reserved was removed from "${first.wishlistTitle}"`,
      text: `${first.ownerName} removed "${first.giftName}" from their wishlist "${first.wishlistTitle}" on Wishpool, so your reservation is gone too. You don't need to buy it.`,
    };
  }

  const lines = removed
    .map((r) => `- "${r.giftName}" (${r.ownerName}, "${r.wishlistTitle}")`)
    .join('\n');

  return {
    to,
    subject: 'Gifts you reserved were removed from a wishlist',
    text: `These gifts you reserved on Wishpool were removed from their wishlists, so your reservations are gone too. You don't need to buy them:\n\n${lines}`,
  };
}
