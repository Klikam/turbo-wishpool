import { cookies } from "next/headers";

/**
 * Anonymous visitor identity, sent to the backend as `x-guest-token` so a
 * guest can see and undo their own reservations. Kept in an http-only cookie
 * (set by the proxy on wishlist pages) so wishlists can render on the server.
 */
export const GUEST_TOKEN_COOKIE = "wishpool_guest_token";

/** A year; the token is the only way a guest can undo their reservations. */
export const GUEST_TOKEN_MAX_AGE = 60 * 60 * 24 * 365;

/** 128 random bits as hex (backend accepts 16-128 chars). */
export function generateGuestToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Headers identifying this visitor to the backend's public endpoints. */
export async function guestTokenHeaders(): Promise<Record<string, string>> {
  const token = (await cookies()).get(GUEST_TOKEN_COOKIE)?.value;
  return token ? { "x-guest-token": token } : {};
}
