import { ogCard, ogImageContentType, ogImageSize } from "@/lib/ogImage";

// Preview card for the site and any page without its own.
export const alt = "Wishpool — the wishlist they'll actually love to receive";
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function OpenGraphImage() {
  return ogCard({
    title: "The wishlist they'll actually love to receive.",
    subtitle: "Friends pick gifts anonymously — no duplicates.",
  });
}
