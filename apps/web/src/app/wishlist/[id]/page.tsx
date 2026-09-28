import Wishlist from '@/components/pages/Wishlist';

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Wishlist wishlistId={id} />;
}
