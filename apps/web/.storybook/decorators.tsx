import type { Decorator } from "@storybook/nextjs";
import { storageHelper } from "@/utils/storageHelper";
import type { Wishlist } from "@/types/wishlist";

export interface MockDataParams {
  /** Wishlists seeded into localStorage before the story mounts. */
  wishlists?: Wishlist[];
}

/**
 * Pre-populates localStorage with mock wishlists before every story.
 *
 * Configure per-story via `parameters.mockData`. The signed-in users is no
 * longer global state — pages receive it as a prop (`users` / `currentUserId`)
 * from their server component, so stories pass it through `args` instead.
 */
export const withMockData: Decorator = (Story, context) => {
  const { wishlists } = (context.parameters.mockData ?? {}) as MockDataParams;

  storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, wishlists ?? []);

  return <Story />;
};
