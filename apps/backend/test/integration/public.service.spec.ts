import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { eq } from 'drizzle-orm';
import { giftRequestsTable, wishlistsTable } from '../../src/db/schema';
import { PublicService } from '../../src/public/public.service';
import {
  allReservations,
  allRequests,
  createGift,
  createTestDb,
  createUser,
  createWishlist,
  reserveGift,
} from '../helpers/db';
import { fakeConfig, fakeMail } from '../helpers/fakes';

type User = Awaited<ReturnType<typeof createUser>>;
const MISSING = '00000000-0000-4000-8000-000000000000';

describe('PublicService (real Postgres)', () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;
  const mail = fakeMail();
  let service: PublicService;
  let owner: User;
  let ann: User;
  let bob: User;
  let cid: User;
  let wishlistId: string;
  let giftId: string;

  beforeAll(async () => {
    ctx = await createTestDb();
    service = new PublicService(ctx.db, mail.service, fakeConfig());
  });
  afterAll(() => ctx.close());
  beforeEach(async () => {
    await ctx.reset();
    vi.clearAllMocks();
    owner = await createUser(ctx.db, { name: 'Olga' });
    ann = await createUser(ctx.db, { name: 'Ann', email: 'ann@example.com' });
    bob = await createUser(ctx.db, { name: 'Bob', email: 'bob@example.com' });
    cid = await createUser(ctx.db, { name: 'Cid', email: 'cid@example.com' });
    wishlistId = (
      await createWishlist(ctx.db, owner.id, {
        title: 'Birthday',
        note: 'private note',
      })
    ).id;
    giftId = (await createGift(ctx.db, wishlistId, { name: 'Lamp' })).id;
  });

  describe('getPreview', () => {
    it('shows the wishlist without gifts or note', async () => {
      const preview = await service.getPreview(wishlistId);

      expect(preview).toMatchObject({ title: 'Birthday', ownerName: 'Olga' });
      expect(preview).not.toHaveProperty('gifts');
      expect(preview).not.toHaveProperty('note');
      expect(preview).not.toHaveProperty('closed');
      expect(preview.isPast).toBe(false);
    });

    it('404s for an unknown wishlist', async () => {
      await expect(service.getPreview(MISSING)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWishlist', () => {
    it('hides reservations and requests from the owner (the surprise)', async () => {
      await reserveGift(ctx.db, giftId, ann.id);
      await service.createRequest(wishlistId, giftId, bob.id, 'share');

      const view = await service.getWishlist(wishlistId, owner.id);

      expect(view.isOwner).toBe(true);
      expect(view).not.toHaveProperty('ownerId');
      expect(view.gifts[0]).toMatchObject({
        reserved: false,
        reservedByMe: false,
        reservers: [],
        myRequest: null,
        incomingRequests: [],
      });
    });

    it('shows other visitors who reserved, with isMe set only for themselves', async () => {
      await reserveGift(ctx.db, giftId, ann.id);

      const asAnn = await service.getWishlist(wishlistId, ann.id);
      const asBob = await service.getWishlist(wishlistId, bob.id);

      expect(asAnn.gifts[0]).toMatchObject({
        reserved: true,
        reservedByMe: true,
        reservers: [{ name: 'Ann', isMe: true }],
      });
      expect(asBob.gifts[0]).toMatchObject({
        reserved: true,
        reservedByMe: false,
        reservers: [{ name: 'Ann', isMe: false }],
      });
      expect(asBob.gifts[0]!.reservers[0]).not.toHaveProperty('email');
    });

    it('shows a request to its asker and to the holders, but to nobody else', async () => {
      await reserveGift(ctx.db, giftId, ann.id);
      const request = await service.createRequest(
        wishlistId,
        giftId,
        bob.id,
        'release',
      );

      const asBob = (await service.getWishlist(wishlistId, bob.id)).gifts[0]!;
      const asAnn = (await service.getWishlist(wishlistId, ann.id)).gifts[0]!;
      const asCid = (await service.getWishlist(wishlistId, cid.id)).gifts[0]!;

      expect(asBob.myRequest).toEqual({ id: request.id, type: 'release' });
      expect(asBob.incomingRequests).toEqual([]);
      expect(asAnn.incomingRequests).toEqual([
        { id: request.id, type: 'release', requesterName: 'Bob' },
      ]);
      expect(asCid.myRequest).toBeNull();
      expect(asCid.incomingRequests).toEqual([]);
    });

    it('handles a wishlist with no gifts and an unknown one', async () => {
      const empty = await createWishlist(ctx.db, owner.id);

      expect((await service.getWishlist(empty.id, ann.id)).gifts).toEqual([]);
      await expect(service.getWishlist(MISSING, ann.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reserve', () => {
    it('reserves a free gift', async () => {
      await service.reserve(wishlistId, giftId, ann.id);

      expect(await allReservations(ctx.db)).toMatchObject([
        { giftId, userId: ann.id },
      ]);
    });

    it('refuses a second reservation of the same gift', async () => {
      await service.reserve(wishlistId, giftId, ann.id);

      await expect(service.reserve(wishlistId, giftId, bob.id)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.reserve(wishlistId, giftId, ann.id)).rejects.toThrow(
        ConflictException,
      );
      expect(await allReservations(ctx.db)).toHaveLength(1);
    });

    it('lets only one of several simultaneous attempts win', async () => {
      const results = await Promise.allSettled(
        [ann, bob, cid].map((user) =>
          service.reserve(wishlistId, giftId, user.id),
        ),
      );

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(await allReservations(ctx.db)).toHaveLength(1);
    });

    it('does not let owners reserve their own gifts', async () => {
      await expect(
        service.reserve(wishlistId, giftId, owner.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('404s for unknown wishlists, and for gifts that belong to another wishlist', async () => {
      const otherList = await createWishlist(ctx.db, owner.id);

      await expect(service.reserve(MISSING, giftId, ann.id)).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.reserve(otherList.id, giftId, ann.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelReservation', () => {
    it('frees the gift', async () => {
      await reserveGift(ctx.db, giftId, ann.id);

      await service.cancelReservation(wishlistId, giftId, ann.id);

      expect(await allReservations(ctx.db)).toEqual([]);
    });

    it("cannot cancel someone else's reservation", async () => {
      await reserveGift(ctx.db, giftId, ann.id);

      await expect(
        service.cancelReservation(wishlistId, giftId, bob.id),
      ).rejects.toThrow(ForbiddenException);
      expect(await allReservations(ctx.db)).toHaveLength(1);
    });

    it('drops pending requests once nobody holds the gift, keeps them while someone does', async () => {
      await reserveGift(ctx.db, giftId, ann.id);
      await reserveGift(ctx.db, giftId, bob.id);
      await service.createRequest(wishlistId, giftId, cid.id, 'share');

      await service.cancelReservation(wishlistId, giftId, ann.id);
      expect(await allRequests(ctx.db)).toHaveLength(1);

      await service.cancelReservation(wishlistId, giftId, bob.id);
      expect(await allRequests(ctx.db)).toHaveLength(0);
    });
  });

  describe('createRequest', () => {
    beforeEach(async () => {
      await reserveGift(ctx.db, giftId, ann.id);
    });

    it('stores a pending request and emails the holder with a link to the wishlist', async () => {
      const request = await service.createRequest(
        wishlistId,
        giftId,
        bob.id,
        'share',
      );

      expect(await allRequests(ctx.db)).toMatchObject([
        {
          id: request.id,
          requesterId: bob.id,
          type: 'share',
          status: 'pending',
        },
      ]);
      expect(mail.sent).toHaveLength(1);
      expect(mail.sent[0]).toMatchObject({ to: 'ann@example.com' });
      expect(mail.sent[0]!.text).toContain('Bob');
      expect(mail.sent[0]!.text).toContain(
        `https://wishpool.test/wishlist/${wishlistId}`,
      );
    });

    it('emails every holder of a shared gift', async () => {
      await reserveGift(ctx.db, giftId, bob.id);

      await service.createRequest(wishlistId, giftId, cid.id, 'share');

      expect(mail.sent.map((m) => m.to).sort()).toEqual([
        'ann@example.com',
        'bob@example.com',
      ]);
    });

    it('does not double slashes when WEB_URL ends with one', async () => {
      const slashy = new PublicService(
        ctx.db,
        mail.service,
        fakeConfig({ WEB_URL: 'https://x.test/' }),
      );

      await slashy.createRequest(wishlistId, giftId, bob.id, 'share');

      expect(mail.sent[0]!.text).toContain(
        `https://x.test/wishlist/${wishlistId}`,
      );
    });

    it.each([
      ['the owner', () => owner, ForbiddenException],
      ['a holder asking for their own gift', () => ann, ConflictException],
    ])('is refused for %s', async (_label, who, error) => {
      await expect(
        service.createRequest(wishlistId, giftId, who().id, 'share'),
      ).rejects.toThrow(error);
      expect(mail.sent).toHaveLength(0);
    });

    it('is refused for a gift nobody reserved', async () => {
      const free = await createGift(ctx.db, wishlistId, { name: 'Free' });

      await expect(
        service.createRequest(wishlistId, free.id, bob.id, 'share'),
      ).rejects.toThrow(ConflictException);
    });

    it('refuses asking a shared gift to be released, since no single holder can free it', async () => {
      await reserveGift(ctx.db, giftId, bob.id);

      await expect(
        service.createRequest(wishlistId, giftId, cid.id, 'release'),
      ).rejects.toThrow(/shared/);
    });

    it('allows one pending request per asker', async () => {
      await service.createRequest(wishlistId, giftId, bob.id, 'share');

      await expect(
        service.createRequest(wishlistId, giftId, bob.id, 'release'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('cancelRequest', () => {
    let requestId: string;
    beforeEach(async () => {
      await reserveGift(ctx.db, giftId, ann.id);
      requestId = (
        await service.createRequest(wishlistId, giftId, bob.id, 'share')
      ).id;
    });

    it('lets the asker take it back, keeping it as a record', async () => {
      await service.cancelRequest(wishlistId, giftId, requestId, bob.id);

      expect(await allRequests(ctx.db)).toMatchObject([
        { id: requestId, status: 'cancelled' },
      ]);
      // A taken-back request can't be taken back again.
      await expect(
        service.cancelRequest(wishlistId, giftId, requestId, bob.id),
      ).rejects.toThrow(NotFoundException);
    });

    it('does not let the asker ask again right away, only after the cooldown', async () => {
      await service.cancelRequest(wishlistId, giftId, requestId, bob.id);

      await expect(
        service.createRequest(wishlistId, giftId, bob.id, 'share'),
      ).rejects.toThrow(/recently/);

      // As if the request had been made over an hour ago.
      await ctx.db
        .update(giftRequestsTable)
        .set({ createdAt: new Date(Date.now() - 61 * 60 * 1000) });
      await expect(
        service.createRequest(wishlistId, giftId, bob.id, 'share'),
      ).resolves.toBeDefined();
    });

    it('applies the cooldown after a decline too, and per gift', async () => {
      await service.respondToRequest(
        wishlistId,
        giftId,
        requestId,
        ann.id,
        false,
      );

      await expect(
        service.createRequest(wishlistId, giftId, bob.id, 'share'),
      ).rejects.toThrow(/recently/);
    });

    it('is not available to anyone else, nor for a wrong gift', async () => {
      await expect(
        service.cancelRequest(wishlistId, giftId, requestId, ann.id),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.cancelRequest(wishlistId, MISSING, requestId, bob.id),
      ).rejects.toThrow(NotFoundException);
      expect(await allRequests(ctx.db)).toHaveLength(1);
    });
  });

  describe('respondToRequest', () => {
    beforeEach(async () => {
      await reserveGift(ctx.db, giftId, ann.id);
    });

    const ask = async (type: 'release' | 'share') => {
      const request = await service.createRequest(
        wishlistId,
        giftId,
        bob.id,
        type,
      );
      vi.clearAllMocks();
      return request.id;
    };

    it('accepting a release hands the reservation to the asker', async () => {
      const requestId = await ask('release');

      await service.respondToRequest(
        wishlistId,
        giftId,
        requestId,
        ann.id,
        true,
      );

      expect(await allReservations(ctx.db)).toMatchObject([
        { userId: bob.id, giftId },
      ]);
      expect(await allRequests(ctx.db)).toMatchObject([{ status: 'accepted' }]);
      expect(mail.sent).toHaveLength(1);
      expect(mail.sent[0]).toMatchObject({ to: 'bob@example.com' });
      expect(mail.sent[0]!.subject).toContain('Ann accepted');
    });

    it('accepting a share adds the asker next to the holder', async () => {
      const requestId = await ask('share');

      await service.respondToRequest(
        wishlistId,
        giftId,
        requestId,
        ann.id,
        true,
      );

      expect(
        (await allReservations(ctx.db)).map((r) => r.userId).sort(),
      ).toEqual([ann.id, bob.id].sort());
    });

    it('accepting a share turns down open requests to free the gift', async () => {
      const shareId = await ask('share');
      const releaseId = (
        await service.createRequest(wishlistId, giftId, cid.id, 'release')
      ).id;

      await service.respondToRequest(wishlistId, giftId, shareId, ann.id, true);

      const statuses = Object.fromEntries(
        (await allRequests(ctx.db)).map((r) => [r.id, r.status]),
      );
      expect(statuses).toEqual({
        [shareId]: 'accepted',
        [releaseId]: 'cancelled',
      });
      // Gone from the holders' list, so there is nothing left to accept.
      const wishlist = await service.getWishlist(wishlistId, ann.id);
      expect(wishlist.gifts[0]!.incomingRequests).toEqual([]);
    });

    it('declining changes nothing but the status, and tells the asker', async () => {
      const requestId = await ask('release');

      await service.respondToRequest(
        wishlistId,
        giftId,
        requestId,
        ann.id,
        false,
      );

      expect(await allReservations(ctx.db)).toMatchObject([{ userId: ann.id }]);
      const [request] = await allRequests(ctx.db);
      expect(request).toMatchObject({ status: 'declined' });
      expect(request!.respondedAt).toBeInstanceOf(Date);
      expect(mail.sent[0]!.subject).toContain('Ann declined');
    });

    it('only a holder may answer, and a refused answer leaves the request pending', async () => {
      const requestId = await ask('release');

      await expect(
        service.respondToRequest(wishlistId, giftId, requestId, cid.id, true),
      ).rejects.toThrow(ForbiddenException);

      expect(await allRequests(ctx.db)).toMatchObject([{ status: 'pending' }]);
      expect(await allReservations(ctx.db)).toMatchObject([{ userId: ann.id }]);
      expect(mail.sent).toHaveLength(0);
    });

    it('a request can be answered only once', async () => {
      const requestId = await ask('share');
      await service.respondToRequest(
        wishlistId,
        giftId,
        requestId,
        ann.id,
        true,
      );

      await expect(
        service.respondToRequest(wishlistId, giftId, requestId, ann.id, false),
      ).rejects.toThrow(NotFoundException);
    });

    it('a requester who already holds the gift is not duplicated', async () => {
      const requestId = await ask('share');
      await reserveGift(ctx.db, giftId, bob.id).catch(() => undefined);

      await service.respondToRequest(
        wishlistId,
        giftId,
        requestId,
        ann.id,
        true,
      );

      expect(await allReservations(ctx.db)).toHaveLength(2);
    });
  });

  describe('a past wishlist', () => {
    const daysAgo = (days: number) =>
      new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

    const makePast = (how: 'closed' | 'date') =>
      ctx.db
        .update(wishlistsTable)
        .set(how === 'closed' ? { closed: true } : { date: daysAgo(1) })
        .where(eq(wishlistsTable.id, wishlistId));

    it.each(['closed', 'date'] as const)(
      'is shown as past to visitors and to the owner when it is %s',
      async (how) => {
        await makePast(how);

        expect((await service.getWishlist(wishlistId, ann.id)).isPast).toBe(
          true,
        );
        expect((await service.getWishlist(wishlistId, owner.id)).isPast).toBe(
          true,
        );
      },
    );

    it('is not past on the day of the occasion', async () => {
      await ctx.db
        .update(wishlistsTable)
        .set({ date: daysAgo(0) })
        .where(eq(wishlistsTable.id, wishlistId));

      expect((await service.getWishlist(wishlistId, ann.id)).isPast).toBe(
        false,
      );
      await expect(
        service.reserve(wishlistId, giftId, ann.id),
      ).resolves.toBeUndefined();
    });

    it.each(['closed', 'date'] as const)(
      'refuses new reservations and requests when it is %s',
      async (how) => {
        await reserveGift(ctx.db, giftId, ann.id);
        const other = (await createGift(ctx.db, wishlistId, { name: 'Pen' }))
          .id;
        await makePast(how);

        await expect(
          service.reserve(wishlistId, other, bob.id),
        ).rejects.toThrow(/in the past/);
        await expect(
          service.createRequest(wishlistId, giftId, bob.id, 'share'),
        ).rejects.toThrow(ForbiddenException);

        expect(await allReservations(ctx.db)).toHaveLength(1);
        expect(await allRequests(ctx.db)).toHaveLength(0);
        expect(mail.sent).toHaveLength(0);
      },
    );

    it('freezes what was already agreed: no undoing, taking back or answering', async () => {
      await reserveGift(ctx.db, giftId, ann.id);
      const requestId = (
        await service.createRequest(wishlistId, giftId, bob.id, 'share')
      ).id;
      await makePast('closed');

      await expect(
        service.cancelReservation(wishlistId, giftId, ann.id),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.cancelRequest(wishlistId, giftId, requestId, bob.id),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.respondToRequest(wishlistId, giftId, requestId, ann.id, true),
      ).rejects.toThrow(ForbiddenException);

      expect(await allReservations(ctx.db)).toHaveLength(1);
      expect(await allRequests(ctx.db)).toMatchObject([
        { id: requestId, status: 'pending' },
      ]);
    });

    it('works again once the owner reopens it', async () => {
      await makePast('closed');
      await expect(service.reserve(wishlistId, giftId, ann.id)).rejects.toThrow(
        ForbiddenException,
      );

      await ctx.db
        .update(wishlistsTable)
        .set({ closed: false })
        .where(eq(wishlistsTable.id, wishlistId));

      await expect(
        service.reserve(wishlistId, giftId, ann.id),
      ).resolves.toBeUndefined();
    });

    it.each(['closed', 'date'] as const)(
      'is reported as past in the signed-out preview when it is %s',
      async (how) => {
        await makePast(how);

        const preview = await service.getPreview(wishlistId);

        expect(preview.isPast).toBe(true);
        // Whether the owner closed it, or its date passed, is not public.
        expect(preview).not.toHaveProperty('closed');
      },
    );

    it('still reports a missing wishlist as not found', async () => {
      await expect(
        service.cancelReservation(MISSING, giftId, ann.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
