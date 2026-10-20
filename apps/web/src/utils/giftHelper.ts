/** Display string for a gift price, e.g. 149 -> "€ 149.00". */
export function formatPrice(price: number): string {
  return `€ ${price.toFixed(2)}`;
}

/** Parses free-text price input ("€ 49,90") into a number, or null if empty/invalid. */
export function parsePrice(input: string): number | null {
  const value = Number.parseFloat(input.replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isNaN(value) ? null : value;
}

/** Empty form fields are stored as null, like the API does. */
export function emptyToNull(input: string): string | null {
  return input.trim() === '' ? null : input.trim();
}
