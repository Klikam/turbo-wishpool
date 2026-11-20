# 2. Past wishlists are read-only for visitors

Date: 2026-11-20
Status: Accepted

## Context

A wishlist is built around an occasion. Once it has happened, claiming a gift
(or asking someone to free or share one) is meaningless, and a stale list
that still looks open invites confusion: "is this still being bought?".
Owners also want to end a list without waiting for its date, or when it has
no date at all.

## Decision

A wishlist is **past** when either:

- its owner closed it (`wishlists.closed = true`), or
- its date is before today, in UTC. The day of the occasion itself is open.

"Past" is derived, never stored: `isPastWishlist` in
`apps/backend/src/wishlists/wishlist-status.ts` is the single definition, so
a list turns past at midnight with no job to run and no column to keep in
step with the date.

On a past list:

- **Visitors** can read it, including the gifts and who claimed them, but
  every action is refused by the backend with a 403: reserving, undoing a
  reservation, asking to free or share, taking a request back and answering
  one. The UI hides those buttons, and shows a banner. What was agreed before
  the list ended stays exactly as it was. Pending requests are not cleaned up.
- **The owner** can still add, edit and delete gifts and edit the list. They
  get **Mark as past** on the list page and **Reopen** in the banner.
- **Reopen** clears only `closed`. A list that is past because of its date
  stays past until the owner moves the date; the banner then says so and
  links to the edit form.
- On the dashboard past lists sort below the open ones, dimmed and badged.

The check lives in `PublicService`, next to the other visitor rules, and is
enforced for every visitor action. The web UI is not trusted to hide buttons.

## Consequences

- The date is compared in UTC, not in the viewer's time zone, because the
  backend has none for the visitor. People far west of Europe may see a list
  flip to past a few hours before their local midnight. Nobody can claim a
  gift in the gap, which is the safe direction.
- Undoing a reservation is blocked too. Someone who claimed a gift and cannot
  buy it any more has to ask the owner to reopen the list. We chose a simple
  rule ("nothing changes on a past list") over a case-by-case one.
- Closing a list sends no email to the people who claimed gifts, in line with
  [ADR 1](0001-deleting-a-wishlist-does-not-notify-reservers.md).
- Past lists are not hidden or deleted automatically: they stay until their
  owner deletes them.
- The signed-out page and link-preview text do not mention that a list is
  past; only signed-in viewers see the banner.
