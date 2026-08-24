'use client';

import { storageHelper } from '@/utils/storageHelper';
import { useEffect, useState } from 'react';
import z from 'zod';

export function useGuestToken(): string {
  const [guestToken, setGuestToken] = useState('');

  useEffect(() => {
    let t = storageHelper.load<string>(
      storageHelper.STORAGE_KEYS.guestToken,
      '',
      z.string(),
    );
    if (!t) {
      t = storageHelper.genId() + storageHelper.genId();
      storageHelper.save(storageHelper.STORAGE_KEYS.guestToken, t);
    }
    setGuestToken(t);
  }, []);

  return guestToken;
}
