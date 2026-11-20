import { NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { WishlistService } from '../../src/wishlists/wishlist.service';
import {
  createGift,
  createTestDb,
  createUser,
  createWishlist,
} from '../helpers/db';

/** A date `days` from today (UTC, like the service), as `YYYY-MM-DD`. */
const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

describe('WishlistService (real Postgres)', () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;
  let service: WishlistService;
  let owner: Awaited<ReturnType<typeof createUser>>;
  let stranger: Awaited<ReturnType<typeof createUser>>;

  beforeAll(async () => {
    ctx = await createTestDb();
    service = new WishlistService(ctx.db);
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await ctx.reset();
    owner = await createUser(ctx.db);
    stranger = await createUser(ctx.db);
  });

  it('creates a wishlist for the user with EUR as the default currency', async () => {
    const wishlist = await service.create(owner.id, { title: 'Wedding' });

    expect(wishlist).toMatchObject({
      title: 'Wedding',
      userId: owner.id,
      currency: 'EUR',
      closed: false,
      isPast: false,
    });
  });

  it('lists only my wishlists, with gift counts, dated ones newest first and undated last', async () => {
    const later = await createWishlist(ctx.db, owner.id, {
      title: 'Later',
      date: inDays(90),
    });
    const soon = await createWishlist(ctx.db, owner.id, {
      title: 'Soon',
      date: inDays(10),
    });
    const undated = await createWishlist(ctx.db, owner.id, {
      title: 'Undated',
    });
    await createWishlist(ctx.db, stranger.id, { title: 'Not mine' });
    await createGift(ctx.db, soon.id, { name: 'A' });
    await createGift(ctx.db, soon.id, { name: 'B' });

    const lists = await service.findAll(owner.id);

    expect(lists.map((l) => l.title)).toEqual(['Later', 'Soon', 'Undated']);
    expect(lists.map((l) => l.giftsCount)).toEqual([0, 2, 0]);
    expect([later.id, soon.id, undated.id].sort()).toEqual(
      lists.map((l) => l.id).sort(),
    );
  });

  describe('past wishlists', () => {
    it('are marked past once their date has passed, but not on the day itself', async () => {
      await createWishlist(ctx.db, owner.id, {
        title: 'Yesterday',
        date: inDays(-1),
      });
      await createWishlist(ctx.db, owner.id, {
        title: 'Today',
        date: inDays(0),
      });
      await createWishlist(ctx.db, owner.id, { title: 'Undated' });

      const lists = await service.findAll(owner.id);

      expect(Object.fromEntries(lists.map((l) => [l.title, l.isPast]))).toEqual(
        { Yesterday: true, Today: false, Undated: false },
      );
    });

    it('sink below the lists that are still open', async () => {
      await createWishlist(ctx.db, owner.id, {
        title: 'Gone',
        date: inDays(-30),
      });
      await createWishlist(ctx.db, owner.id, {
        title: 'Closed early',
        date: inDays(5),
        closed: true,
      });
      await createWishlist(ctx.db, owner.id, {
        title: 'Soon',
        date: inDays(20),
      });
      await createWishlist(ctx.db, owner.id, { title: 'Undated' });

      const lists = await service.findAll(owner.id);

      expect(lists.map((l) => l.title)).toEqual([
        'Soon',
        'Undated',
        'Closed early',
        'Gone',
      ]);
    });

    it('can be closed by the owner before their date, and reopened', async () => {
      const wishlist = await createWishlist(ctx.db, owner.id, {
        date: inDays(30),
      });

      const closed = await service.update(owner.id, wishlist.id, {
        closed: true,
      });
      expect(closed).toMatchObject({ closed: true, isPast: true });
      expect(await service.findOne(owner.id, wishlist.id)).toMatchObject({
        isPast: true,
      });

      const reopened = await service.update(owner.id, wishlist.id, {
        closed: false,
      });
      expect(reopened).toMatchObject({ closed: false, isPast: false });
    });

    it('stay past after a reopen when their date has passed, until the date moves', async () => {
      const wishlist = await createWishlist(ctx.db, owner.id, {
        date: inDays(-3),
        closed: true,
      });

      expect(
        await service.update(owner.id, wishlist.id, { closed: false }),
      ).toMatchObject({ isPast: true });
      expect(
        await service.update(owner.id, wishlist.id, { date: inDays(7) }),
      ).toMatchObject({ isPast: false });
    });

    it('cannot be closed by someone else', async () => {
      const wishlist = await createWishlist(ctx.db, owner.id);

      await expect(
        service.update(stranger.id, wishlist.id, { closed: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  it('returns a wishlist with its gifts in the order they were added', async () => {
    const wishlist = await createWishlist(ctx.db, owner.id);
    await createGift(ctx.db, wishlist.id, {
      name: 'Second',
      createdAt: new Date('2026-01-02'),
    });
    await createGift(ctx.db, wishlist.id, {
      name: 'First',
      createdAt: new Date('2026-01-01'),
    });

    const found = await service.findOne(owner.id, wishlist.id);

    expect(found.gifts.map((g) => g.name)).toEqual(['First', 'Second']);
  });

  it("does not reveal another user's wishlist", async () => {
    const wishlist = await createWishlist(ctx.db, owner.id);

    await expect(service.findOne(stranger.id, wishlist.id)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.update(stranger.id, wishlist.id, { title: 'Hacked' }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.remove(stranger.id, wishlist.id)).rejects.toThrow(
      NotFoundException,
    );
    expect((await service.findOne(owner.id, wishlist.id)).title).toBe(
      'Birthday',
    );
  });

  it('updates fields and can clear optional ones with null', async () => {
    const wishlist = await createWishlist(ctx.db, owner.id, {
      note: 'hello',
      occasion: 'birthday',
    });

    const updated = await service.update(owner.id, wishlist.id, {
      title: 'Renamed',
      note: null as unknown as undefined,
    });

    expect(updated).toMatchObject({
      title: 'Renamed',
      note: null,
      occasion: 'birthday',
    });
  });

  it('treats an empty update as a read', async () => {
    const wishlist = await createWishlist(ctx.db, owner.id);

    const result = await service.update(owner.id, wishlist.id, {});

    expect(result).toMatchObject({ id: wishlist.id, gifts: [] });
  });

  it('deletes the wishlist together with its gifts', async () => {
    const wishlist = await createWishlist(ctx.db, owner.id);
    await createGift(ctx.db, wishlist.id);

    await service.remove(owner.id, wishlist.id);

    await expect(service.findOne(owner.id, wishlist.id)).rejects.toThrow(
      NotFoundException,
    );
    expect(await ctx.db.query.giftsTable.findMany()).toHaveLength(0);
  });
});
