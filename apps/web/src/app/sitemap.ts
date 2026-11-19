import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/config";

// Only the landing page is public; wishlists are shared by link.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: getSiteUrl() }];
}
