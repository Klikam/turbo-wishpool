# 1. Deleting a wishlist does not notify the people who reserved gifts on it

Date: 2026-11-20
Status: Accepted

## Context

Owners must never learn that a gift is reserved, or by whom: the surprise is
the point of the product. `PublicService.getWishlist` therefore doesn't even
load reservations for the owner.

That creates a gap. When an owner edits or deletes a single gift, the people
who reserved it can no longer count on what they reserved, and the owner
can't be asked to tell them. `ReservationNoticeService` closes it: it looks
up the reservations before the change and emails the reservers afterwards
("a gift you reserved was changed / removed").

Deleting a whole wishlist (`WishlistService.remove`, and deleting the owner's
account) does not do this. The database cascades: gifts, reservations and
requests disappear with the list, and the reservers get no email. Their next
visit to the share link shows "Nothing here".

## Decision

Deleting a wishlist, or an account, stays silent for reservers. Only
single-gift edits and deletions send notices.

Reasons:

- Deleting a whole list is a deliberate, rare act that ends the occasion
  (cancelled, already celebrated, replaced by a new list). Unlike a single
  gift vanishing from a list that goes on, there is nothing left for a
  reserver to adapt to.
- Notifying would mean emailing everyone who ever reserved on the list, which
  turns one click by the owner into a burst of email from the app's domain.
  It also costs sender reputation, which matters for a small project on a
  shared SMTP provider.
- The dashboard's confirmation already tells the owner that the share link
  stops working.

## Consequences

- A reserver may buy a gift for a list that no longer exists. They find out
  from the 404 page, whose text says the owner may have deleted the list.
- Gift reservations and requests are removed by `ON DELETE CASCADE`; no code
  has to clean them up.
- If this proves confusing in practice, the fix is local: call
  `ReservationNoticeService.findReservations` for the list's gifts before
  deleting, then send one email per reserver per list (not per gift).
