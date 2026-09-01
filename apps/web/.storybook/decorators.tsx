import type { Decorator } from '@storybook/nextjs';
import { UserContextProvider } from '@/context/UserContext';
import { storageHelper } from '@/utils/storageHelper';
import type { User } from '@/types/user';
import type { Wishlist } from '@/types/wishlist';

export interface MockDataParams {
  /** The signed-in user, or null/undefined to render as a logged-out visitor. */
  user?: User | null;
  /** Wishlists seeded into localStorage before the story mounts. */
  wishlists?: Wishlist[];
}

/**
 * Wraps every story in the real UserContextProvider, seeded with a mock user,
 * and pre-populates localStorage with mock wishlists. This runs synchronously
 * during render (not in an effect), so it lands before a component's own
 * mount-time `useEffect` reads from localStorage or `useUserContext`.
 *
 * Configure per-story via `parameters.mockData`.
 */
export const withMockData: Decorator = (Story, context) => {
  const { user = null, wishlists } = (context.parameters.mockData ??
    {}) as MockDataParams;

  storageHelper.save(storageHelper.STORAGE_KEYS.wishlists, wishlists ?? []);

  return (
    <UserContextProvider initialUser={user}>
      <Story />
    </UserContextProvider>
  );
};
