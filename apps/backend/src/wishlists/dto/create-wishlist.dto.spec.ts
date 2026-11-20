import { describe, expect, it } from 'vitest';
import { messagesFor, validate } from '../../../test/helpers/pipe';
import { CreateWishlistDto } from './create-wishlist.dto';
import { UpdateWishlistDto } from './update-wishlist.dto';

describe('CreateWishlistDto', () => {
  it('accepts a title alone', async () => {
    await expect(
      validate(CreateWishlistDto, { title: 'Birthday' }),
    ).resolves.toMatchObject({
      title: 'Birthday',
    });
  });

  it('accepts every optional field', async () => {
    expect(
      await messagesFor(CreateWishlistDto, {
        title: 'Wedding',
        occasion: 'wedding',
        date: '2027-06-01',
        note: 'Hi',
        currency: 'PLN',
      }),
    ).toEqual([]);
  });

  it.each([
    [{ title: '' }, 'Enter a title for the wishlist'],
    [{ title: 'x'.repeat(256) }, 'The title can be at most 255 characters'],
    [{ title: 'x', occasion: 'party' }, 'Choose one of the occasions'],
    [{ title: 'x', date: '2027-02-30' }, 'Choose a valid date'],
    [{ title: 'x', date: 'tomorrow' }, 'Choose a valid date'],
    [
      { title: 'x', note: 'n'.repeat(2001) },
      'The note can be at most 2000 characters',
    ],
    [{ title: 'x', currency: 'EURO' }, 'Choose a valid currency'],
  ])('rejects %j with a readable message', async (body, message) => {
    expect(await messagesFor(CreateWishlistDto, body)).toEqual([message]);
  });

  it.each([{}, { title: 42 }])(
    'asks for a title when it is missing or not text: %j',
    async (body) => {
      expect(await messagesFor(CreateWishlistDto, body)).toEqual([
        'Enter a title for the wishlist',
      ]);
    },
  );

  it('upper-cases the currency', async () => {
    await expect(
      validate(CreateWishlistDto, { title: 'x', currency: 'gbp' }),
    ).resolves.toMatchObject({ currency: 'GBP' });
  });

  it('refuses fields the client has no business setting', async () => {
    expect(
      await messagesFor(CreateWishlistDto, { title: 'x', userId: 1 }),
    ).not.toEqual([]);
    expect(
      await messagesFor(CreateWishlistDto, { title: 'x', id: 'abc' }),
    ).not.toEqual([]);
  });
});

describe('UpdateWishlistDto', () => {
  it('accepts an empty body', async () => {
    expect(await messagesFor(UpdateWishlistDto, {})).toEqual([]);
  });

  it('lets optional fields be cleared with null but not title or currency', async () => {
    expect(
      await messagesFor(UpdateWishlistDto, {
        occasion: null,
        date: null,
        note: null,
      }),
    ).toEqual([]);
    expect(await messagesFor(UpdateWishlistDto, { title: null })).not.toEqual(
      [],
    );
    expect(
      await messagesFor(UpdateWishlistDto, { currency: null }),
    ).not.toEqual([]);
  });
});
