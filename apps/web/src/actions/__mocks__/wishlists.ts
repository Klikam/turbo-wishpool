import { fn } from "storybook/test";
import { mockWishlist, mockWishlistSummaries } from "@/mocks/fixtures";
import type * as actual from "../wishlists";

/**
 * Storybook replacement for the wishlist server actions (registered as a
 * webpack alias in `.storybook/main.ts`). The real ones call the backend with
 * the session's access token from the Next.js server, which doesn't exist in
 * Storybook. Override per story with `mocked(getPublicWishlist).mockResolvedValue(...)`.
 */
const ok = () => Promise.resolve({ ok: true as const, data: undefined });

export const getMyWishlists = fn<typeof actual.getMyWishlists>(() =>
  Promise.resolve(mockWishlistSummaries),
).mockName("getMyWishlists");

export const createWishlist = fn<typeof actual.createWishlist>(() =>
  Promise.resolve({ ok: true, data: { id: "wishlists-1" } }),
).mockName("createWishlist");

export const deleteWishlist = fn<typeof actual.deleteWishlist>(ok).mockName(
  "deleteWishlist",
);

export const addGift = fn<typeof actual.addGift>(() =>
  Promise.resolve({ ok: true, data: { id: "gifts-new" } }),
).mockName("addGift");

export const deleteGift = fn<typeof actual.deleteGift>(ok).mockName(
  "deleteGift",
);

export const getPublicWishlist = fn<typeof actual.getPublicWishlist>(() =>
  Promise.resolve(mockWishlist()),
).mockName("getPublicWishlist");

export const reserveGift = fn<typeof actual.reserveGift>(ok).mockName(
  "reserveGift",
);

export const cancelReservation = fn<typeof actual.cancelReservation>(
  ok,
).mockName("cancelReservation");
