/**
 * Display string for a gift price in the wishlist's currency, laid out the
 * viewer's way: 1299 PLN is "1 299,00 zł" in Polish, "PLN 1,299.00" in English.
 */
export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
    price,
  );
}

/**
 * Parses free-text price input into a number, or null if empty/invalid.
 * The last "." or "," followed by one or two digits is the decimal point and
 * any others group thousands, so "€ 49,90", "1.299,00", "1,299.00" and
 * "1 299" all work.
 */
export function parsePrice(input: string): number | null {
  const cleaned = input.replace(/[^\d.,]/g, '');
  const [, whole = cleaned, fraction = ''] =
    /^(.*)[.,](\d{1,2})$/.exec(cleaned) ?? [];
  const digits = whole.replace(/[.,]/g, '');
  if (!digits && !fraction) return null;

  return Number(`${digits || '0'}.${fraction || '0'}`);
}

/** Empty form fields are stored as null, like the API does. */
export function emptyToNull(input: string): string | null {
  return input.trim() === '' ? null : input.trim();
}

/**
 * Like emptyToNull, for links: "shop.com/item" is saved as
 * "https://shop.com/item". Anything else is left for the backend to check.
 */
export function normalizeUrl(input: string): string | null {
  const url = emptyToNull(input);
  if (url === null || /^[a-z][a-z\d+.-]*:\/\//i.test(url)) return url;
  return `https://${url}`;
}
