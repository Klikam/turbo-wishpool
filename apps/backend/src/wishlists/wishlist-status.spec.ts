import { describe, expect, it } from 'vitest';
import { isPastWishlist, today } from './wishlist-status';

const NOW = new Date('2026-11-20T23:30:00Z');

describe('isPastWishlist', () => {
  it('is open on the day of the occasion, even late in the day', () => {
    expect(isPastWishlist({ date: '2026-11-20', closed: false }, NOW)).toBe(
      false,
    );
  });

  it('is past from the day after', () => {
    expect(isPastWishlist({ date: '2026-11-19', closed: false }, NOW)).toBe(
      true,
    );
    expect(
      isPastWishlist(
        { date: '2026-11-20', closed: false },
        new Date('2026-11-21T00:00:00Z'),
      ),
    ).toBe(true);
  });

  it('is open for future and undated lists', () => {
    expect(isPastWishlist({ date: '2027-01-01', closed: false }, NOW)).toBe(
      false,
    );
    expect(isPastWishlist({ date: null, closed: false }, NOW)).toBe(false);
  });

  it('is past when the owner closed it, whatever the date', () => {
    expect(isPastWishlist({ date: '2027-01-01', closed: true }, NOW)).toBe(
      true,
    );
    expect(isPastWishlist({ date: null, closed: true }, NOW)).toBe(true);
  });
});

describe('today', () => {
  it('is the UTC date', () => {
    expect(today(NOW)).toBe('2026-11-20');
  });
});
