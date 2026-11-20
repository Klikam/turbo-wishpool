import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import request from 'supertest';
import { DrizzleAsyncProvider } from '../../src/drizzle/drizzle.provider';
import { GiftController } from '../../src/gifts/gift.controller';
import { GiftService } from '../../src/gifts/gift.service';
import { LinkPreviewService } from '../../src/gifts/link-preview.service';
import { MailService } from '../../src/mail/mail.service';
import { ReservationNoticeService } from '../../src/mail/reservation-notices.service';
import { PublicController } from '../../src/public/public.controller';
import { PublicService } from '../../src/public/public.service';
import { WishlistController } from '../../src/wishlists/wishlist.controller';
import { WishlistService } from '../../src/wishlists/wishlist.service';
import { ConfigService } from '@nestjs/config';
import { createTestDb, createUser } from '../helpers/db';

/**
 * Stands in for the better-auth guard: the user comes from an `x-user-id`
 * header, and routes marked @AllowAnonymous() stay open, like in production.
 */
@Injectable()
class HeaderAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const req = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const id = req.headers['x-user-id'];
    if (id) req.user = { id };
    const isPublic = this.reflector.get<boolean>(
      'PUBLIC',
      context.getHandler(),
    );
    if (!id && !isPublic) throw new UnauthorizedException();
    return true;
  }
}

describe('HTTP API (controllers + services + real Postgres)', () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;
  let app: INestApplication;
  let owner: number;
  let guest: number;
  const sendInBackground = vi.fn();

  // Each test is a different visitor address, so the rate limit of one test
  // doesn't leak into the next.
  let visitorIp = 0;
  let ip = '';
  const as = (userId: number) => ({
    'x-user-id': String(userId),
    'x-forwarded-for': ip,
  });
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    ctx = await createTestDb();
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }])],
      controllers: [WishlistController, GiftController, PublicController],
      providers: [
        WishlistService,
        GiftService,
        PublicService,
        ReservationNoticeService,
        { provide: DrizzleAsyncProvider, useValue: ctx.db },
        { provide: MailService, useValue: { send: vi.fn(), sendInBackground } },
        {
          provide: LinkPreviewService,
          useValue: { findImageUrl: vi.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ConfigService,
          useValue: new ConfigService({ WEB_URL: 'https://wishpool.test' }),
        },
        { provide: 'APP_GUARD', useClass: HeaderAuthGuard },
      ],
    })
      .overrideProvider('APP_GUARD')
      .useClass(HeaderAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();
    // As in main.ts, the client address comes from X-Forwarded-For.
    (app as unknown as { set: (k: string, v: unknown) => void }).set(
      'trust proxy',
      true,
    );
    // Same options as main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        stopAtFirstError: true,
      }),
    );
    app.useGlobalGuards(new HeaderAuthGuard(app.get(Reflector)));
    await app.init();
  });
  afterAll(async () => {
    await app.close();
    await ctx.close();
  });
  beforeEach(async () => {
    await ctx.reset();
    vi.clearAllMocks();
    ip = `10.0.${Math.floor(++visitorIp / 250)}.${visitorIp % 250}`;
    owner = (await createUser(ctx.db, { name: 'Olga' })).id;
    guest = (
      await createUser(ctx.db, { name: 'Gus', email: 'gus@example.com' })
    ).id;
  });

  async function createWishlist(body: object = { title: 'Birthday' }) {
    const res = await api()
      .post('/wishlists')
      .set(as(owner))
      .send(body)
      .expect(201);
    return res.body as { id: string };
  }
  async function createGift(
    wishlistId: string,
    body: object = { name: 'Lamp' },
  ) {
    const res = await api()
      .post(`/wishlists/${wishlistId}/gifts`)
      .set(as(owner))
      .send(body)
      .expect(201);
    return res.body as { id: string };
  }

  describe('authentication', () => {
    it('rejects anonymous calls to private routes', async () => {
      await api().get('/wishlists').expect(401);
      await api().post('/wishlists').send({ title: 'x' }).expect(401);
    });

    it('serves only the preview to anonymous visitors', async () => {
      const { id } = await createWishlist();

      const preview = await api()
        .get(`/public/wishlists/${id}/preview`)
        .expect(200);
      expect(preview.body).toMatchObject({
        title: 'Birthday',
        ownerName: 'Olga',
      });
      expect(preview.body.gifts).toBeUndefined();
      await api().get(`/public/wishlists/${id}`).expect(401);
    });
  });

  describe('validation', () => {
    it('answers with a readable message per invalid field', async () => {
      const res = await api()
        .post('/wishlists')
        .set(as(owner))
        .send({ title: '' })
        .expect(400);

      expect(res.body.message).toEqual(['Enter a title for the wishlist']);
    });

    it('rejects unknown properties', async () => {
      await api()
        .post('/wishlists')
        .set(as(owner))
        .send({ title: 'x', userId: 99 })
        .expect(400);
    });

    it('rejects malformed ids before touching the database', async () => {
      await api().get('/wishlists/not-a-uuid').set(as(owner)).expect(400);
      await api().get('/public/wishlists/123').set(as(guest)).expect(400);
    });

    it('normalises the currency to upper case and rejects fake ones', async () => {
      const ok = await api()
        .post('/wishlists')
        .set(as(owner))
        .send({ title: 'x', currency: 'pln' })
        .expect(201);
      expect(ok.body.currency).toBe('PLN');
      await api()
        .post('/wishlists')
        .set(as(owner))
        .send({ title: 'x', currency: 'ZZZ' })
        .expect(400);
    });

    it('validates gift prices and links', async () => {
      const { id } = await createWishlist();
      const post = (body: object) =>
        api().post(`/wishlists/${id}/gifts`).set(as(owner)).send(body);

      await post({ name: 'x', price: -1 }).expect(400);
      await post({ name: 'x', price: 1.234 }).expect(400);
      await post({ name: 'x', url: 'javascript:alert(1)' }).expect(400);
      await post({ name: 'x', price: 9.99, url: 'https://shop.test/x' }).expect(
        201,
      );
    });
  });

  describe('owner flow', () => {
    it('creates, edits, lists and deletes a wishlist with gifts', async () => {
      const { id } = await createWishlist({
        title: 'Wedding',
        occasion: 'wedding',
        date: '2027-06-01',
      });
      const gift = await createGift(id, { name: 'Vase', price: 40 });

      await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ title: 'Our wedding' })
        .expect(200);
      const detail = await api()
        .get(`/wishlists/${id}`)
        .set(as(owner))
        .expect(200);
      expect(detail.body).toMatchObject({
        title: 'Our wedding',
        gifts: [{ id: gift.id, name: 'Vase', price: 40 }],
      });

      const list = await api().get('/wishlists').set(as(owner)).expect(200);
      expect(list.body).toMatchObject([{ id, giftsCount: 1 }]);

      await api().delete(`/wishlists/${id}`).set(as(owner)).expect(204);
      await api().get(`/wishlists/${id}`).set(as(owner)).expect(404);
    });

    it("keeps one user's data away from another", async () => {
      const { id } = await createWishlist();
      const gift = await createGift(id);

      await api().get(`/wishlists/${id}`).set(as(guest)).expect(404);
      await api()
        .patch(`/wishlists/${id}/gifts/${gift.id}`)
        .set(as(guest))
        .send({ name: 'x' })
        .expect(404);
      await api()
        .delete(`/wishlists/${id}/gifts/${gift.id}`)
        .set(as(guest))
        .expect(404);
    });
  });

  describe('visitor flow', () => {
    it('reserve → visible to others, hidden from the owner → cancel', async () => {
      const { id } = await createWishlist();
      const gift = await createGift(id);

      await api()
        .put(`/public/wishlists/${id}/gifts/${gift.id}/reservation`)
        .set(as(guest))
        .expect(204);

      const asGuest = await api()
        .get(`/public/wishlists/${id}`)
        .set(as(guest))
        .expect(200);
      expect(asGuest.body.gifts[0]).toMatchObject({
        reserved: true,
        reservedByMe: true,
      });
      const asOwner = await api()
        .get(`/public/wishlists/${id}`)
        .set(as(owner))
        .expect(200);
      expect(asOwner.body).toMatchObject({ isOwner: true });
      expect(asOwner.body.gifts[0]).toMatchObject({
        reserved: false,
        reservers: [],
      });

      await api()
        .delete(`/public/wishlists/${id}/gifts/${gift.id}/reservation`)
        .set(as(guest))
        .expect(204);
      const after = await api()
        .get(`/public/wishlists/${id}`)
        .set(as(guest))
        .expect(200);
      expect(after.body.gifts[0].reserved).toBe(false);
    });

    it('maps business rules to HTTP statuses', async () => {
      const { id } = await createWishlist();
      const gift = await createGift(id);
      const reservation = `/public/wishlists/${id}/gifts/${gift.id}/reservation`;
      const other = (await createUser(ctx.db)).id;

      await api().put(reservation).set(as(owner)).expect(403); // own gift
      await api().put(reservation).set(as(guest)).expect(204);
      await api().put(reservation).set(as(other)).expect(409); // taken
      await api().delete(reservation).set(as(other)).expect(403); // not theirs
      await api()
        .put(
          `/public/wishlists/${id}/gifts/${'0'.repeat(8)}-0000-4000-8000-000000000000/reservation`,
        )
        .set(as(guest))
        .expect(404);
    });

    it('request → holder accepts → asker gets the gift and the mail goes out', async () => {
      const { id } = await createWishlist();
      const gift = await createGift(id);
      const asker = (await createUser(ctx.db, { name: 'Asa' })).id;
      await api()
        .put(`/public/wishlists/${id}/gifts/${gift.id}/reservation`)
        .set(as(guest))
        .expect(204);

      const created = await api()
        .post(`/public/wishlists/${id}/gifts/${gift.id}/requests`)
        .set(as(asker))
        .send({ type: 'release' })
        .expect(201);
      expect(sendInBackground).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'gus@example.com' }),
      );

      await api()
        .put(
          `/public/wishlists/${id}/gifts/${gift.id}/requests/${created.body.id}`,
        )
        .set(as(guest))
        .send({ accept: true })
        .expect(204);

      const view = await api()
        .get(`/public/wishlists/${id}`)
        .set(as(asker))
        .expect(200);
      expect(view.body.gifts[0]).toMatchObject({
        reservedByMe: true,
        myRequest: null,
      });
    });

    it('validates request bodies', async () => {
      const { id } = await createWishlist();
      const gift = await createGift(id);
      const url = `/public/wishlists/${id}/gifts/${gift.id}/requests`;

      await api().post(url).set(as(guest)).send({ type: 'steal' }).expect(400);
      await api().post(url).set(as(guest)).send({}).expect(400);
    });

    it('throttles reservation changes per visitor after 20 per minute', async () => {
      const { id } = await createWishlist();
      const gift = await createGift(id);
      const url = `/public/wishlists/${id}/gifts/${gift.id}/reservation`;
      const statuses: number[] = [];

      for (let i = 0; i < 22; i++) {
        statuses.push((await api().delete(url).set(as(guest))).status);
      }

      expect(statuses.slice(0, 20)).not.toContain(429);
      expect(statuses.slice(20)).toEqual([429, 429]);
    });
  });

  describe('past wishlists', () => {
    const yesterday = () =>
      new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

    async function setup() {
      const { id } = await createWishlist();
      const gift = await createGift(id);
      const base = `/public/wishlists/${id}/gifts/${gift.id}`;
      const asker = (await createUser(ctx.db, { name: 'Asa' })).id;
      return { id, gift, base, asker };
    }

    it('lets the owner mark a list as past and reopen it', async () => {
      const { id } = await createWishlist();

      const closed = await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ closed: true })
        .expect(200);
      expect(closed.body).toMatchObject({ closed: true, isPast: true });

      const reopened = await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ closed: false })
        .expect(200);
      expect(reopened.body).toMatchObject({ closed: false, isPast: false });
    });

    it('rejects a closed value that is not a boolean, and closing on create', async () => {
      const { id } = await createWishlist();

      await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ closed: 'yes' })
        .expect(400);
      await api()
        .post('/wishlists')
        .set(as(owner))
        .send({ title: 'x', closed: true })
        .expect(400);
    });

    it('does not let someone else close the list', async () => {
      const { id } = await createWishlist();

      await api()
        .patch(`/wishlists/${id}`)
        .set(as(guest))
        .send({ closed: true })
        .expect(404);
    });

    it.each([
      ['closed by the owner', (id: string) => ({ id, body: { closed: true } })],
      ['past by date', (id: string) => ({ id, body: { date: yesterday() } })],
    ])('answers 403 to every visitor action when it is %s', async (_, how) => {
      const { id, base, asker, gift } = await setup();
      // Something already agreed before the list ended.
      await api().put(`${base}/reservation`).set(as(guest)).expect(204);
      const request = await api()
        .post(`${base}/requests`)
        .set(as(asker))
        .send({ type: 'share' })
        .expect(201);
      const requestPath = `${base}/requests/${request.body.id}`;
      const { body } = how(id);
      await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send(body)
        .expect(200);

      await api().put(`${base}/reservation`).set(as(asker)).expect(403);
      await api().delete(`${base}/reservation`).set(as(guest)).expect(403);
      await api()
        .post(`${base}/requests`)
        .set(as(asker))
        .send({ type: 'share' })
        .expect(403);
      await api().delete(requestPath).set(as(asker)).expect(403);
      await api()
        .put(requestPath)
        .set(as(guest))
        .send({ accept: true })
        .expect(403);

      // Nothing moved: the visitors still see what they had.
      const asGuest = await api()
        .get(`/public/wishlists/${id}`)
        .set(as(guest))
        .expect(200);
      expect(asGuest.body.isPast).toBe(true);
      expect(asGuest.body.gifts[0]).toMatchObject({
        id: gift.id,
        reservedByMe: true,
        incomingRequests: [{ id: request.body.id }],
      });
    });

    it('tells everyone it is past, even signed-out visitors, without saying why', async () => {
      const { id } = await createWishlist();
      await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ closed: true })
        .expect(200);

      const preview = await api()
        .get(`/public/wishlists/${id}/preview`)
        .expect(200);
      expect(preview.body).toMatchObject({ isPast: true });
      expect(preview.body).not.toHaveProperty('closed');
      expect(preview.body).not.toHaveProperty('gifts');

      const list = await api().get('/wishlists').set(as(owner)).expect(200);
      expect(list.body[0]).toMatchObject({ isPast: true, closed: true });
    });

    it('works again once the owner reopens it', async () => {
      const { id, base } = await setup();
      await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ closed: true })
        .expect(200);
      await api().put(`${base}/reservation`).set(as(guest)).expect(403);

      await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ closed: false })
        .expect(200);

      await api().put(`${base}/reservation`).set(as(guest)).expect(204);
    });

    it('still lets the owner manage the gifts of a past list', async () => {
      const { id } = await setup();
      await api()
        .patch(`/wishlists/${id}`)
        .set(as(owner))
        .send({ closed: true })
        .expect(200);

      await createGift(id, { name: 'Late addition' });
      const gifts = await api()
        .get(`/wishlists/${id}/gifts`)
        .set(as(owner))
        .expect(200);
      expect(gifts.body).toHaveLength(2);
    });
  });

  describe('gift requests', () => {
    it('takes back a request over HTTP, then makes the asker wait before asking again', async () => {
      const { id } = await createWishlist();
      const gift = await createGift(id);
      const asker = (await createUser(ctx.db, { name: 'Asa' })).id;
      const base = `/public/wishlists/${id}/gifts/${gift.id}`;
      await api().put(`${base}/reservation`).set(as(guest)).expect(204);
      const created = await api()
        .post(`${base}/requests`)
        .set(as(asker))
        .send({ type: 'share' })
        .expect(201);

      // Someone else's request can't be taken back, the asker's own can.
      await api()
        .delete(`${base}/requests/${created.body.id}`)
        .set(as(guest))
        .expect(404);
      await api()
        .delete(`${base}/requests/${created.body.id}`)
        .set(as(asker))
        .expect(204);

      const again = await api()
        .post(`${base}/requests`)
        .set(as(asker))
        .send({ type: 'share' })
        .expect(409);
      expect(again.body.message).toMatch(/recently/);
      expect(sendInBackground).toHaveBeenCalledTimes(1);
    });
  });
});
