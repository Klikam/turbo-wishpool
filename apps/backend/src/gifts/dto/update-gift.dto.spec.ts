import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { UpdateGiftDto } from './update-gift.dto';
import { UpdateWishlistDto } from '../../wishlists/dto/update-wishlist.dto';

// Same options as the global pipe in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: true,
});

const validate = (metatype: new () => object, value: object) =>
  pipe.transform(value, { type: 'body', metatype });

describe('PATCH bodies', () => {
  it('clear optional gift fields with null', async () => {
    await expect(
      validate(UpdateGiftDto, { description: null, price: null, url: null }),
    ).resolves.toMatchObject({ description: null, price: null, url: null });
  });

  it('refuse to clear a gift name', async () => {
    await expect(validate(UpdateGiftDto, { name: null })).rejects.toThrow();
    await expect(validate(UpdateGiftDto, { name: '' })).rejects.toThrow();
  });

  it('explain invalid fields in words users understand', async () => {
    await expect(validate(UpdateGiftDto, { name: '' })).rejects.toMatchObject({
      response: { message: ['Enter a gift name'] },
    });
    await expect(
      validate(UpdateGiftDto, { url: 'not a link' }),
    ).rejects.toMatchObject({
      response: {
        message: ["The link isn't a web address, e.g. https://shop.com/item"],
      },
    });
  });

  it('leave out what is not sent', async () => {
    await expect(validate(UpdateGiftDto, {})).resolves.toEqual({});
  });

  it('reject fields that are not part of the body', async () => {
    await expect(
      validate(UpdateGiftDto, { wishlistId: 'other' }),
    ).rejects.toThrow();
  });

  it('refuse to clear a wishlist title or currency', async () => {
    await expect(
      validate(UpdateWishlistDto, { title: null }),
    ).rejects.toThrow();
    await expect(
      validate(UpdateWishlistDto, { currency: null }),
    ).rejects.toThrow();
  });

  it('store currency codes in upper case', async () => {
    await expect(
      validate(UpdateWishlistDto, { currency: 'pln' }),
    ).resolves.toMatchObject({ currency: 'PLN' });
    await expect(
      validate(UpdateWishlistDto, { currency: 'XYZ' }),
    ).rejects.toThrow();
  });
});
