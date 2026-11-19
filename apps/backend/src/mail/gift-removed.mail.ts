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
 * Tells someone that a gift they reserved is gone from the list, so the
 * reservation is gone too. Owners never learn that a gift was reserved, so
 * this is the only way the reserver finds out.
 */
export function giftRemovedMail(reservation: RemovedReservation): MailMessage {
  return {
    to: reservation.to,
    subject: `A gift you reserved was removed from "${reservation.wishlistTitle}"`,
    text: `${reservation.ownerName} removed "${reservation.giftName}" from their wishlist "${reservation.wishlistTitle}" on Wishpool, so your reservation is gone too. You don't need to buy it.`,
  };
}
