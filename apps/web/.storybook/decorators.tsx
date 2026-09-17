import type { Decorator } from "@storybook/nextjs";
import { SessionProvider } from "next-auth/react";
import { storageHelper } from "@/utils/storageHelper";
import type { User } from "@/types/user";
import type { Wishlist } from "@/types/wishlist";

export interface MockDataParams {
  /** The signed-in user, or null/undefined to render as a logged-out visitor. */
  user?: User | null;
  /** Wishlists seeded into localStorage before the story mounts. */
  wishlists?: Wishlist[];
}

/**
 * Wraps every story in NextAuth's SessionProvider and pre-populates localStorage
 * with mock wishlists.
 *
 * Configure per-story via `parameters.mockData`.
 */
export const withMockData: Decorator = (Story, context) => {
  const { user = null, wishlists } = (context.parameters.mockData ??
    {}) as MockDataParams;

  storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, wishlists ?? []);

  return (
    <SessionProvider
      session={
        user
          ? {
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
              },
              backendTokens: {
                accessToken: "storybook-access-token",
                refreshToken: "storybook-refresh-token",
              },
              expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            }
          : null
      }
    >
      <Story />
    </SessionProvider>
  );
};
