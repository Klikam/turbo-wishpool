import { NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { giftsTable } from '../../src/db/schema';
import { GiftService } from '../../src/gifts/gift.service';
import type { LinkPreviewService } from '../../src/gifts/link-preview.service';
import { ReservationNoticeService } from '../../src/mail/reservation-notices.service';
import {
  createGift,
  createTestDb,
  createUser,
  createWishlist,
  reserveGift,
} from '../helpers/db';
import { fakeMail } from '../helpers/fakes';

describe('GiftService (real Postgres)', () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;
  const mail = fakeMail();
  const findImageUrl = vi.fn<(url: string) => Promise<string | undefined>>();
  let service: GiftService;
  let owner: Awaited<ReturnType<typeof createUser>>;
  let wishlistId: string;

  beforeAll(async () => {
    ctx = await createTestDb();
    service = new GiftService(
      ctx.db,
      { findImageUrl } as unknown as LinkPreviewService,
      new ReservationNoticeService(ctx.db, mail.service),
    );
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await ctx.reset();
    vi.clearAllMocks();
    findImageUrl.mockResolvedValue(undefined);
    owner = await createUser(ctx.db, { name: 'Olga' });
    wishlistId = (await createWishlist(ctx.db, owner.id, { title: 'Birthday' }))
      .id;
  });

  const imageOf = async (id: string) =>
    (await ctx.db.select().from(giftsTable).where(eq(giftsTable.id, id)))[0]!
      .imageUrl;

  describe('create', () => {
    it('stores the gift on my wishlist', async () => {
      const gift = await service.create(owner.id, wishlistId, {
        name: 'Book',
        price: 12.5,
      });

      expect(gift).toMatchObject({ name: 'Book', price: 12.5, wishlistId });
    });

    it("refuses to add to someone else's wishlist", async () => {
      const other = await createUser(ctx.db);

      await expect(
        service.create(other.id, wishlistId, { name: 'Book' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('fills the image from the link in the background', async () => {
      findImageUrl.mockResolvedValue('https://shop.test/img.jpg');

      const gift = await service.create(owner.id, wishlistId, {
        name: 'Lamp',
        url: 'https://shop.test/lamp',
      });

      expect(gift!.imageUrl).toBeNull();
      await vi.waitFor(async () =>
        expect(await imageOf(gift!.id)).toBe('https://shop.test/img.jpg'),
      );
    });

    it('does not look up a preview when an image was given', async () => {
      await service.create(owner.id, wishlistId, {
        name: 'Lamp',
        url: 'https://shop.test/lamp',
        imageUrl: 'https://shop.test/mine.jpg',
      });

      expect(findImageUrl).not.toHaveBeenCalled();
    });
  });

  describe('read', () => {
    it('lists and fetches gifts of my wishlist only', async () => {
      const gift = await createGift(ctx.db, wishlistId);
      const other = await createUser(ctx.db);

      expect(await service.findAll(owner.id, wishlistId)).toHaveLength(1);
      expect(
        await service.findOne(owner.id, wishlistId, gift.id),
      ).toMatchObject({ id: gift.id });
      await expect(service.findAll(other.id, wishlistId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.findOne(
          owner.id,
          wishlistId,
          '00000000-0000-4000-8000-000000000000',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('never exposes who reserved a gift to its owner', async () => {
      const gift = await createGift(ctx.db, wishlistId);
      await reserveGift(ctx.db, gift.id, (await createUser(ctx.db)).id);

      const [seen] = await service.findAll(owner.id, wishlistId);

      expect(Object.keys(seen!).sort()).toEqual(
        [
          'description',
          'id',
          'imageUrl',
          'name',
          'price',
          'url',
          'wishlistId',
        ].sort(),
      );
    });
  });

  describe('update', () => {
    it('changes fields and clears them with null', async () => {
      const gift = await createGift(ctx.db, wishlistId, {
        description: 'old',
        price: 10,
      });

      const updated = await service.update(owner.id, wishlistId, gift.id, {
        name: 'New',
        description: null as unknown as undefined,
      });

      expect(updated).toMatchObject({
        name: 'New',
        description: null,
        price: 10,
      });
    });

    it('tells the reservers what changed, and only what changed', async () => {
      const gift = await createGift(ctx.db, wishlistId, {
        name: 'Lamp',
        price: 10,
      });
      const buyer = await createUser(ctx.db, { email: 'buyer@example.com' });
      await reserveGift(ctx.db, gift.id, buyer.id);

      await service.update(owner.id, wishlistId, gift.id, {
        price: 20,
        name: 'Lamp',
      });

      expect(mail.sent).toHaveLength(1);
      expect(mail.sent[0]).toMatchObject({ to: 'buyer@example.com' });
      expect(mail.sent[0]!.text).toContain('What changed: price.');
    });

    it('sends no email when nothing changed or nobody reserved', async () => {
      const gift = await createGift(ctx.db, wishlistId, { name: 'Lamp' });
      await service.update(owner.id, wishlistId, gift.id, { name: 'Renamed' });
      await reserveGift(ctx.db, gift.id, (await createUser(ctx.db)).id);
      await service.update(owner.id, wishlistId, gift.id, { name: 'Renamed' });

      expect(mail.sent).toHaveLength(0);
    });

    it('treats an empty update as a read', async () => {
      const gift = await createGift(ctx.db, wishlistId);

      expect(
        await service.update(owner.id, wishlistId, gift.id, {}),
      ).toMatchObject({ id: gift.id });
    });

    it('takes the image from a new link when the image is cleared', async () => {
      findImageUrl.mockResolvedValue('https://shop.test/new.jpg');
      const gift = await createGift(ctx.db, wishlistId, {
        imageUrl: 'https://old.test/x.jpg',
      });

      await service.update(owner.id, wishlistId, gift.id, {
        url: 'https://shop.test/item',
        imageUrl: null as unknown as undefined,
      });

      await vi.waitFor(async () =>
        expect(await imageOf(gift.id)).toBe('https://shop.test/new.jpg'),
      );
    });

    it('keeps an image the owner set while the preview was loading', async () => {
      let resolve!: (url: string) => void;
      findImageUrl.mockReturnValue(new Promise((r) => (resolve = r)));
      const gift = await service.create(owner.id, wishlistId, {
        name: 'Lamp',
        url: 'https://shop.test/lamp',
      });
      await ctx.db
        .update(giftsTable)
        .set({ imageUrl: 'https://mine.test/pic.jpg' })
        .where(eq(giftsTable.id, gift!.id));

      resolve('https://shop.test/preview.jpg');
      await new Promise((r) => setTimeout(r, 50));

      expect(await imageOf(gift!.id)).toBe('https://mine.test/pic.jpg');
    });

    it('404s for a gift that is not there', async () => {
      await expect(
        service.update(
          owner.id,
          wishlistId,
          '00000000-0000-4000-8000-000000000000',
          { name: 'x' },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes the gift and its reservations, and emails the reserver', async () => {
      const gift = await createGift(ctx.db, wishlistId, { name: 'Lamp' });
      const buyer = await createUser(ctx.db, { email: 'buyer@example.com' });
      await reserveGift(ctx.db, gift.id, buyer.id);

      await service.remove(owner.id, wishlistId, gift.id);

      expect(await ctx.db.query.giftsTable.findMany()).toHaveLength(0);
      expect(await ctx.db.query.giftReservationsTable.findMany()).toHaveLength(
        0,
      );
      expect(mail.sent).toHaveLength(1);
      expect(mail.sent[0]).toMatchObject({ to: 'buyer@example.com' });
      expect(mail.sent[0]!.text).toContain('Olga removed "Lamp"');
    });

    it('does not let another user delete it', async () => {
      const gift = await createGift(ctx.db, wishlistId);
      const other = await createUser(ctx.db);

      await expect(
        service.remove(other.id, wishlistId, gift.id),
      ).rejects.toThrow(NotFoundException);
      expect(await ctx.db.query.giftsTable.findMany()).toHaveLength(1);
    });
  });
});
