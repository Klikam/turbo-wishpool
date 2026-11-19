import { headers } from 'next/headers';
import WishlistForm from '@/components/pages/WishlistForm';
import { verifySession } from '@/lib/dal';
import { currencyFromAcceptLanguage } from '@/utils/currency';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New wishlist' };

export default async function CreatePage() {
  await verifySession();

  // Picked here rather than in the browser so the server-rendered form
  // already shows it.
  const defaultCurrency = currencyFromAcceptLanguage(
    (await headers()).get('accept-language'),
  );

  return <WishlistForm mode="create" defaultCurrency={defaultCurrency} />;
}
