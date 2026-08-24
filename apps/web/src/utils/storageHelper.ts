import z from 'zod';

export const storageHelper = {
  STORAGE_KEYS: {
    users: 'wishpool_users',
    wishlists: 'wishpool_wishlists',
    currentUser: 'wishpool_current_user',
    guestToken: 'wishpool_guest_token',
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

  genId() {
    return Math.random().toString(36).slice(2, 10);
  },

  hashToken(token: string): string {
    let h = 0;
    for (let i = 0; i < token.length; i++) {
      h = (Math.imul(31, h) + token.charCodeAt(i)) | 0;
    }
    return Math.abs(h).toString(16);
  },
};
