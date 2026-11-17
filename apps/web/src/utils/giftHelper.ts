/** Display string for a gift price, e.g. 149 -> "€ 149.00". */
export function formatPrice(price: number): string {
  return `€ ${price.toFixed(2)}`;
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
