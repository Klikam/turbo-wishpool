import { headers } from 'next/headers';
import CreateWishlist from '@/components/pages/CreateWishlist';
import { verifySession } from '@/lib/dal';
import { currencyFromAcceptLanguage } from '@/utils/currency';

export default async function CreatePage() {
  await verifySession();

  // Picked here rather than in the browser so the server-rendered form
  // already shows it.
  const defaultCurrency = currencyFromAcceptLanguage(
    (await headers()).get('accept-language'),
  );

  return <CreateWishlist defaultCurrency={defaultCurrency} />;
}
