/** Currencies a wishlist can be in, offered in the create form. */
export const CURRENCIES = [
  'EUR',
  'PLN',
  'USD',
  'GBP',
  'CHF',
  'CZK',
  'SEK',
  'NOK',
  'DKK',
  'HUF',
  'RON',
  'UAH',
  'CAD',
  'AUD',
] as const;

const DEFAULT_CURRENCY = 'EUR';

// Regions whose currency is offered and isn't the euro; any other region,
// euro countries included, gets EUR.
const REGION_CURRENCIES: Record<string, string> = {
  PL: 'PLN',
  US: 'USD',
  GB: 'GBP',
  CH: 'CHF',
  LI: 'CHF',
  CZ: 'CZK',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  HU: 'HUF',
  RO: 'RON',
  UA: 'UAH',
  CA: 'CAD',
  AU: 'AUD',
};

/**
 * The currency a new wishlist starts in, guessed from the browser's
 * preferred language (e.g. "pl-PL,pl;q=0.9" -> PLN). A language without a
 * region gets its most likely one ("pl" -> PL).
 */
export function currencyFromAcceptLanguage(header: string | null): string {
  const tag = header?.split(',')[0]?.split(';')[0]?.trim();
  if (!tag) return DEFAULT_CURRENCY;

  try {
    const { region } = new Intl.Locale(tag).maximize();
    return (region && REGION_CURRENCIES[region]) ?? DEFAULT_CURRENCY;
  } catch {
    // "*" or a malformed tag
    return DEFAULT_CURRENCY;
  }
}

const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency' });

/** "PLN — Polish Zloty" */
export function currencyLabel(code: string): string {
  return `${code} — ${currencyNames.of(code) ?? code}`;
}
