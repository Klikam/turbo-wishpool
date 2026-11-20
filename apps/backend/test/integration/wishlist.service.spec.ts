import { NotFoundException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { WishlistService } from '../../src/wishlists/wishlist.service';
import {
  createGift,
  createTestDb,
  createUser,
  createWishlist,
} from '../helpers/db';

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
    });
  });

  it('lists only my wishlists, with gift counts, dated ones newest first and undated last', async () => {
    const old = await createWishlist(ctx.db, owner.id, {
      title: 'Old',
      date: '2026-01-01',
    });
    const soon = await createWishlist(ctx.db, owner.id, {
      title: 'Soon',
      date: '2026-12-24',
    });
    const undated = await createWishlist(ctx.db, owner.id, {
      title: 'Undated',
    });
    await createWishlist(ctx.db, stranger.id, { title: 'Not mine' });
    await createGift(ctx.db, soon.id, { name: 'A' });
    await createGift(ctx.db, soon.id, { name: 'B' });

    const lists = await service.findAll(owner.id);

    expect(lists.map((l) => l.title)).toEqual(['Soon', 'Old', 'Undated']);
    expect(lists.map((l) => l.giftsCount)).toEqual([2, 0, 0]);
    expect([old.id, soon.id, undated.id].sort()).toEqual(
      lists.map((l) => l.id).sort(),
    );
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
