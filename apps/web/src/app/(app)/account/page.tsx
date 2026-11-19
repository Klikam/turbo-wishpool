import Account from '@/components/pages/Account';
import { verifySession } from '@/lib/dal';
import { api } from '@/utils/apiHelper';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your account' };

export default async function AccountPage() {
  const { user, accessToken } = await verifySession();

  // "credential" is better-auth's email-and-password sign-in.
  const accounts = await api<{ providerId: string }[]>(
    'api/auth/list-accounts',
    accessToken,
  );
  const hasPassword = accounts.some((a) => a.providerId === 'credential');

  return <Account user={user} hasPassword={hasPassword} />;
}
