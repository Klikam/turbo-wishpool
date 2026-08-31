import { getBackendUrl } from '@/config/config';
import { createAuthClient } from 'better-auth/react';
export const authClient = createAuthClient({
  baseURL: getBackendUrl(),
});
