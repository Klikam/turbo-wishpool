// Where the user lands signed in, unless a caller asks for somewhere else
// (e.g. back to a shared wishlist). Also the target of the verification email.
export const DEFAULT_CALLBACK_URL = "/dashboard";

/** Param the proxy puts on / to remember the protected page someone wanted. */
export const NEXT_PARAM = "next";

/**
 * The page to return to after signing in, if it's a path on this site.
 * Anything else (`https://evil.example`, `//evil.example`) is ignored so
 * the sign-in page can't be used to send people elsewhere.
 */
export function safeNextPath(
  value: string | string[] | null | undefined,
): string | undefined {
  if (typeof value !== "string") return undefined;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return undefined;
  }
  return value;
}
