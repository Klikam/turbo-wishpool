import { adoptGuestReservations, getPublicWishlist } from '@/actions/wishlists';
import Wishlist from '@/components/pages/Wishlist';
import { getOptionalSession } from '@/lib/dal';
import { siteOpenGraph } from '@/lib/ogImage';
import { wishlistPreview } from '@/utils/wishlistPreview';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const wishlist = await getPublicWishlist((await params).id);
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
  const session = await getOptionalSession();

  // Claims made before signing in (e.g. via the sign-in dialog here) become
  // the account's, so they still show as "You're gifting this".
  if (session) {
    try {
      await adoptGuestReservations();
    } catch (e) {
      console.error(e);
    }
  }

  const wishlist = await getPublicWishlist(id);
  if (!wishlist) notFound();

  return <Wishlist wishlist={wishlist} isSignedIn={session !== null} />;
}
