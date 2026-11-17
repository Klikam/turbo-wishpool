import CreateWishlist from '@/components/pages/CreateWishlist';
import { verifySession } from '@/lib/dal';

export default async function CreatePage() {
  await verifySession();

  return <CreateWishlist />;
}
