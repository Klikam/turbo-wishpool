import Wishlist from '@/components/pages/Wishlist';
import { getOptionalSession } from '@/lib/dal';

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getOptionalSession();

  return <Wishlist wishlistId={id} currentUserId={session?.user.id ?? null} />;
}
