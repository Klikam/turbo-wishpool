import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/config";

// The public pages; wishlists are shared by link and stay out.
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  return [
    { url: siteUrl },
    { url: `${siteUrl}/terms` },
    { url: `${siteUrl}/privacy` },
  ];
}
