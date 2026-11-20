import { describe, expect, it } from 'vitest';
import { messagesFor } from '../../../test/helpers/pipe';
import { CreateGiftDto } from './create-gift.dto';

describe('CreateGiftDto', () => {
  it('accepts a name alone and a fully filled gift', async () => {
    expect(await messagesFor(CreateGiftDto, { name: 'Book' })).toEqual([]);
    expect(
      await messagesFor(CreateGiftDto, {
        name: 'Book',
        description: 'Hardcover',
        price: 19.99,
        url: 'https://shop.test/book',
        imageUrl: 'http://shop.test/book.jpg',
      }),
    ).toEqual([]);
  });

  it.each([
    [{ name: '' }, 'Enter a gift name'],
    [{ name: 'x'.repeat(256) }, 'The gift name can be at most 255 characters'],
    [{ name: 'x', price: -0.01 }, "The price can't be negative"],
    [{ name: 'x', price: 1000000.01 }, 'The price can be at most 1,000,000'],
    [
      { name: 'x', price: 1.999 },
      'The price must be a number with at most 2 decimals',
    ],
    [
      { name: 'x', url: 'shop.test/book' },
      "The link isn't a web address, e.g. https://shop.com/item",
    ],
    [
      { name: 'x', url: 'ftp://shop.test/book' },
      "The link isn't a web address, e.g. https://shop.com/item",
    ],
    [
      { name: 'x', url: 'javascript:alert(1)' },
      "The link isn't a web address, e.g. https://shop.com/item",
    ],
    [
      { name: 'x', imageUrl: 'data:image/png;base64,AAAA' },
      "The image URL isn't a web address, e.g. https://shop.com/photo.jpg",
    ],
    [
      { name: 'x', url: `https://shop.test/${'a'.repeat(2048)}` },
      'The link can be at most 2048 characters',
    ],
  ])('rejects %j', async (body, message) => {
    expect(await messagesFor(CreateGiftDto, body)).toEqual([message]);
  });

  it.each([
    [{}, 'Enter a gift name'],
    [{ name: 42 }, 'Enter a gift name'],
    [
      { name: 'x', price: '10' },
      'The price must be a number with at most 2 decimals',
    ],
    [
      { name: 'x', url: 42 },
      "The link isn't a web address, e.g. https://shop.com/item",
    ],
  ])('explains a missing or wrongly typed field %j', async (body, message) => {
    expect(await messagesFor(CreateGiftDto, body)).toEqual([message]);
  });

  it('accepts the price boundaries', async () => {
    expect(await messagesFor(CreateGiftDto, { name: 'x', price: 0 })).toEqual(
      [],
    );
    expect(
      await messagesFor(CreateGiftDto, { name: 'x', price: 1000000 }),
    ).toEqual([]);
  });

  it('refuses a wishlistId in the body', async () => {
    expect(
      await messagesFor(CreateGiftDto, { name: 'x', wishlistId: 'abc' }),
    ).not.toEqual([]);
  });
});
