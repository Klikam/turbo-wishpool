import WishlistView from '@/components/pages/WishlistView';

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WishlistView wishlistId={id} />;
}
