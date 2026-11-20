import { getWishlistPreview } from "@/actions/wishlists";
import { notFound } from "next/navigation";

// Checks that the list exists before anything is sent. loading.tsx below this
// layout streams a skeleton, and once streaming has started a missing list
// could no longer answer 404. The preview needs no session, so this is cheap.
export default async function WishlistViewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  if (!(await getWishlistPreview((await params).id))) notFound();

  return children;
}
