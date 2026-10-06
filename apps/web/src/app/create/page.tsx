import CreateWishlist from '@/components/pages/CreateWishlist';
import { verifySession } from '@/lib/dal';

export default async function CreatePage() {
  const { user } = await verifySession();

  return <CreateWishlist user={{ id: user.id, name: user.name }} />;
}
