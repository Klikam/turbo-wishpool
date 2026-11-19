"use server";

import { verifySession } from "@/lib/dal";
import type {
  Occasion,
  Wishlist,
  WishlistPreview,
  WishlistSummary,
} from "@/types/wishlist";
import { toResult } from "@/utils/actionResult";
import { api, ApiError } from "@/utils/apiHelper";

export interface NewWishlistInput {
  title: string;
  occasion: Occasion;
  date: string | null;
  note: string | null;
  currency: string;
}

export interface NewGiftInput {
  name: string;
  description: string | null;
  price: number | null;
  url: string | null;
  imageUrl: string | null;
}

/** Owner's wishlists for the dashboard. */
export async function getMyWishlists(): Promise<WishlistSummary[]> {
  const { accessToken } = await verifySession();

  const wishlists = await api<WishlistSummary[]>("wishlists", accessToken);

  return wishlists.map(({ id, title, occasion, date, note, giftsCount }) => ({
    id,
    title,
    occasion,
    date,
    note,
    giftsCount,
  }));
}

export async function createWishlist(input: NewWishlistInput) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<{ id: string }>("wishlists", accessToken, {
      method: "POST",
      body: {
        title: input.title,
        occasion: input.occasion,
        date: input.date ?? undefined,
        note: input.note ?? undefined,
        currency: input.currency,
      },
    }),
  );
}

/** Saves every field; empty ones (null) are cleared. */
export async function updateWishlist(
  wishlistId: string,
  input: NewWishlistInput,
) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<{ id: string }>(`wishlists/${wishlistId}`, accessToken, {
      method: "PATCH",
      body: input,
    }),
  );
}

export async function deleteWishlist(wishlistId: string) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<void>(`wishlists/${wishlistId}`, accessToken, { method: "DELETE" }),
  );
}

export async function addGift(wishlistId: string, input: NewGiftInput) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<{ id: string }>(`wishlists/${wishlistId}/gifts`, accessToken, {
      method: "POST",
      body: {
        name: input.name,
        description: input.description ?? undefined,
        price: input.price ?? undefined,
        url: input.url ?? undefined,
        imageUrl: input.imageUrl ?? undefined,
      },
    }),
  );
}

/** Saves every field; empty ones (null) are cleared. */
export async function updateGift(
  wishlistId: string,
  giftId: string,
  input: NewGiftInput,
) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<{ id: string }>(`wishlists/${wishlistId}/gifts/${giftId}`, accessToken, {
      method: "PATCH",
      body: input,
    }),
  );
}

export async function deleteGift(wishlistId: string, giftId: string) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<void>(`wishlists/${wishlistId}/gifts/${giftId}`, accessToken, {
      method: "DELETE",
    }),
  );
}

/**
 * A wishlist with its gifts, from the signed-in viewer's perspective. Returns
 * null when it doesn't exist. Needs a session: the page shows signed-out
 * visitors `getWishlistPreview` instead.
 */
export async function getPublicWishlist(
  wishlistId: string,
): Promise<Wishlist | null> {
  const { accessToken } = await verifySession();

  try {
    return await api<Wishlist>(`public/wishlists/${wishlistId}`, accessToken);
  } catch (e) {
    // A malformed id is rejected by the backend's UUID validation (400).
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) {
      return null;
    }
    throw e;
  }
}

/**
 * The wishlist without its gifts, for anyone with the link (signed in or
 * not): what link-preview bots and the sign-in screen show. Returns null when
 * it doesn't exist.
 */
export async function getWishlistPreview(
  wishlistId: string,
): Promise<WishlistPreview | null> {
  try {
    return await api<WishlistPreview>(
      `public/wishlists/${wishlistId}/preview`,
      null,
    );
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) {
      return null;
    }
    throw e;
  }
}

export async function reserveGift(wishlistId: string, giftId: string) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<void>(
      `public/wishlists/${wishlistId}/gifts/${giftId}/reservation`,
      accessToken,
      { method: "PUT" },
    ),
  );
}

export async function cancelReservation(wishlistId: string, giftId: string) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<void>(
      `public/wishlists/${wishlistId}/gifts/${giftId}/reservation`,
      accessToken,
      { method: "DELETE" },
    ),
  );
}
