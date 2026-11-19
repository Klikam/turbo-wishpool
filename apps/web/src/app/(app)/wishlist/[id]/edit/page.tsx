import { getPublicWishlist } from '@/actions/wishlists';
import WishlistForm from '@/components/pages/WishlistForm';
import { verifySession } from '@/lib/dal';
import { notFound } from 'next/navigation';

export default async function EditWishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await verifySession();

  // Someone else's list is "not found" here, as it is for the backend.
  const wishlist = await getPublicWishlist(id);
  if (!wishlist?.isOwner) notFound();

  return <WishlistForm mode="edit" wishlist={wishlist} />;
}
