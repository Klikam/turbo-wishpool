'use client';

import { storageHelper } from '@/utils/storageHelper';
import { useEffect, useState } from 'react';
import z from 'zod';

/** 128 random bits as hex (backend accepts 16-128 chars). */
function generateGuestToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Anonymous visitor identity, sent to the backend as `x-guest-token` so a
 * guest can see and undo their own reservations. Empty until mounted.
 */
export function useGuestToken(): string {
  const [guestToken, setGuestToken] = useState('');

  useEffect(() => {
    let t = storageHelper.load<string>(
      storageHelper.STORAGE_KEYS.guestToken,
      '',
      z.string(),
    );
    if (!t) {
      t = generateGuestToken();
      storageHelper.save(storageHelper.STORAGE_KEYS.guestToken, t);
    }
    setGuestToken(t);
  }, []);

  return guestToken;
}
