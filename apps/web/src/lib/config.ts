export function getBackendUrl() {
  const backendUrl = process.env.BACKEND_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_URL is not defined");
  }

  return backendUrl;
}

/** Public origin of this site, for absolute links in previews and the sitemap. */
export function getSiteUrl() {
  const siteUrl = process.env.SITE_URL;

  if (!siteUrl) {
    throw new Error("SITE_URL is not defined");
  }

  return siteUrl;
}
