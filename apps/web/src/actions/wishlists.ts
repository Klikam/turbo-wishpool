"use server";

import { getOptionalSession, verifySession } from "@/lib/dal";
import type { Occasion, Wishlist, WishlistSummary } from "@/types/wishlist";
import { toResult } from "@/utils/actionResult";
import { api, ApiError } from "@/utils/apiHelper";

export interface NewWishlistInput {
  title: string;
  occasion: Occasion;
  date: string | null;
  note: string | null;
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

  const wishlists = await api<Omit<WishlistSummary, "giftsCount">[]>(
    "wishlists",
    accessToken,
  );

  // The list endpoint doesn't include gifts, so count them per wishlist.
  return Promise.all(
    wishlists.map(async ({ id, title, occasion, date, note }) => {
      const { gifts } = await api<{ gifts: unknown[] }>(
        `wishlists/${id}`,
        accessToken,
      );
      return { id, title, occasion, date, note, giftsCount: gifts.length };
    }),
  );
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
      },
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

export async function deleteGift(wishlistId: string, giftId: string) {
  const { accessToken } = await verifySession();

  return toResult(() =>
    api<void>(`wishlists/${wishlistId}/gifts/${giftId}`, accessToken, {
      method: "DELETE",
    }),
  );
}

/**
 * Public view of a wishlist, from the viewer's perspective. Works without a
 * session; `guestToken` identifies anonymous visitors so their own
 * reservations are flagged `reservedByMe`. Returns null when it doesn't exist.
 */
export async function getPublicWishlist(
  wishlistId: string,
  guestToken: string,
): Promise<Wishlist | null> {
  const session = await getOptionalSession();

  try {
    return await api<Wishlist>(
      `public/wishlists/${wishlistId}`,
      session?.accessToken ?? null,
      { headers: { "x-guest-token": guestToken } },
    );
  } catch (e) {
    // A malformed id is rejected by the backend's UUID validation (400).
    if (e instanceof ApiError && (e.status === 404 || e.status === 400)) {
      return null;
    }
    throw e;
  }
}

/** Signed-in users reserve under their account name; guests must pass `name`. */
export async function reserveGift(
  wishlistId: string,
  giftId: string,
  guestToken: string,
  name?: string,
) {
  const session = await getOptionalSession();

  return toResult(() =>
    api<void>(
      `public/wishlists/${wishlistId}/gifts/${giftId}/reservation`,
      session?.accessToken ?? null,
      {
        method: "PUT",
        body: { name },
        headers: { "x-guest-token": guestToken },
      },
    ),
  );
}

export async function cancelReservation(
  wishlistId: string,
  giftId: string,
  guestToken: string,
) {
  const session = await getOptionalSession();

  return toResult(() =>
    api<void>(
      `public/wishlists/${wishlistId}/gifts/${giftId}/reservation`,
      session?.accessToken ?? null,
      {
        method: "DELETE",
        headers: { "x-guest-token": guestToken },
      },
    ),
  );
}
