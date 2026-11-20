import { getPublicWishlist, getWishlistPreview } from '@/actions/wishlists';
import Wishlist from '@/components/pages/Wishlist';
import WishlistSignIn from '@/components/pages/WishlistSignIn';
import { getOptionalSession } from '@/lib/dal';
import { siteOpenGraph } from '@/lib/ogImage';
import { wishlistPreview } from '@/utils/wishlistPreview';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Link-preview bots can't sign in, so the metadata comes from the preview,
// which has no gifts.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const wishlist = await getWishlistPreview((await params).id);
  if (!wishlist) return {};

  const { title, description } = wishlistPreview(wishlist);
  // The preview image comes from the opengraph-image file next to this page.
  return {
    title,
    description,
    openGraph: { ...siteOpenGraph, title, description },
  };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Gifts are for signed-in users only. Not a redirect from the proxy: the
  // metadata above has to stay reachable for link-preview bots.
  if (!(await getOptionalSession())) {
    const preview = await getWishlistPreview(id);
    if (!preview) notFound();

    return <WishlistSignIn wishlist={preview} />;
  }

  const wishlist = await getPublicWishlist(id);
  if (!wishlist) notFound();

  return <Wishlist wishlist={wishlist} />;
}
