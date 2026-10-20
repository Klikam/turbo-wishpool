import z from 'zod';

/** Per-browser conveniences only; wishlist data lives in the backend. */
export const storageHelper = {
  STORAGE_KEYS: {
    guestToken: 'wishpool_guest_token',
    guestName: 'wishpool_guest_name',
  } as const,

  load<T>(key: string, fallback: T, schema: z.ZodType<T>): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;

      const result = schema.safeParse(JSON.parse(raw));
      return result.success ? result.data : fallback;
    } catch {
      return fallback;
    }
  },

  save(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(value));
  },
};
