import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
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
import { createTestDb, createUser } from '../helpers/db';

/** The user comes from an `x-user-id` header; see api.e2e.spec.ts. */
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

/**
 * The product is a surprise: an owner must never learn, in any way the API
 * allows, that a gift is reserved, by whom, or that anyone asked about it.
 * Rather than checking a few fields, this takes every response an owner can
 * get, before and after the reservations, and requires them to be identical,
 * and to contain nothing about the people involved.
 */
describe('owner privacy (the surprise)', () => {
  let ctx: Awaited<ReturnType<typeof createTestDb>>;
  let app: INestApplication;
  const sendInBackground = vi.fn();

  let ip = 0;
  let owner: { id: number; email: string };
  let gus: { id: number; email: string };
  let gina: { id: number; email: string };
  let asa: { id: number; email: string };

  const api = () => request(app.getHttpServer());
  // Each test is its own visitor address, so the throttle never gets in the way.
  const as = (userId: number) => ({
    'x-user-id': String(userId),
    'x-forwarded-for': `10.1.0.${ip}`,
  });

  beforeAll(async () => {
    ctx = await createTestDb();
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 1000 }])],
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
    (app as unknown as { set: (k: string, v: unknown) => void }).set(
      'trust proxy',
      true,
    );
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
    ip += 1;
    // Names and addresses that cannot show up in a response by accident.
    owner = await createUser(ctx.db, {
      name: 'Olga Ownerson',
      email: 'olga.ownerson@example.com',
    });
    gus = await createUser(ctx.db, {
      name: 'Gustavo Reserverez',
      email: 'gustavo.reserverez@example.com',
    });
    gina = await createUser(ctx.db, {
      name: 'Ginevra Sharerova',
      email: 'ginevra.sharerova@example.com',
    });
    asa = await createUser(ctx.db, {
      name: 'Asanti Askerman',
      email: 'asanti.askerman@example.com',
    });
  });

  /** A list with four gifts: A reserved, B shared, C declined request, D free. */
  async function setUpList() {
    const list = (
      await api()
        .post('/wishlists')
        .set(as(owner.id))
        .send({ title: 'Birthday' })
        .expect(201)
    ).body as { id: string };
    const gift = async (name: string) =>
      (
        await api()
          .post(`/wishlists/${list.id}/gifts`)
          .set(as(owner.id))
          .send({ name })
          .expect(201)
      ).body as { id: string };
    const [a, b, c, d] = [
      await gift('Lamp'),
      await gift('Kettle'),
      await gift('Rug'),
      await gift('Vase'),
    ] as [{ id: string }, { id: string }, { id: string }, { id: string }];
    return { listId: list.id, a, b, c, d };
  }

  const gifts = (listId: string, giftId: string) =>
    `/public/wishlists/${listId}/gifts/${giftId}`;

  /** Everything the guests do that an owner might notice. */
  async function reserveAndAsk(s: Awaited<ReturnType<typeof setUpList>>) {
    const ids: string[] = [];

    // A: Gus reserves, Asa asks him to free it (pending).
    await api()
      .put(`${gifts(s.listId, s.a.id)}/reservation`)
      .set(as(gus.id))
      .expect(204);
    const askA = await api()
      .post(`${gifts(s.listId, s.a.id)}/requests`)
      .set(as(asa.id))
      .send({ type: 'release' })
      .expect(201);
    ids.push(askA.body.id);

    // B: Gus reserves, Gina asks to share, Gus accepts: two holders.
    await api()
      .put(`${gifts(s.listId, s.b.id)}/reservation`)
      .set(as(gus.id))
      .expect(204);
    const askB = await api()
      .post(`${gifts(s.listId, s.b.id)}/requests`)
      .set(as(gina.id))
      .send({ type: 'share' })
      .expect(201);
    ids.push(askB.body.id);
    await api()
      .put(`${gifts(s.listId, s.b.id)}/requests/${askB.body.id}`)
      .set(as(gus.id))
      .send({ accept: true })
      .expect(204);

    // C: Gina reserves, Asa asks, Gina declines (a record that stays).
    await api()
      .put(`${gifts(s.listId, s.c.id)}/reservation`)
      .set(as(gina.id))
      .expect(204);
    const askC = await api()
      .post(`${gifts(s.listId, s.c.id)}/requests`)
      .set(as(asa.id))
      .send({ type: 'release' })
      .expect(201);
    ids.push(askC.body.id);
    await api()
      .put(`${gifts(s.listId, s.c.id)}/requests/${askC.body.id}`)
      .set(as(gina.id))
      .send({ accept: false })
      .expect(204);

    return ids;
  }

  /** Every GET an owner can make about their own list and gifts. */
  async function ownerReads(s: Awaited<ReturnType<typeof setUpList>>) {
    const paths = [
      '/wishlists',
      `/wishlists/${s.listId}`,
      `/wishlists/${s.listId}/gifts`,
      ...[s.a, s.b, s.c, s.d].map(
        (g) => `/wishlists/${s.listId}/gifts/${g.id}`,
      ),
      // The owner opening their own share link.
      `/public/wishlists/${s.listId}`,
      `/public/wishlists/${s.listId}/preview`,
    ];
    const reads: Record<string, { status: number; body: unknown }> = {};
    for (const path of paths) {
      const res = await api().get(path).set(as(owner.id));
      reads[path] = { status: res.status, body: res.body };
    }
    return reads;
  }

  /** What would give the guests away: names, addresses, record ids. */
  function secrets(recordIds: string[]) {
    return [
      ...[gus, gina, asa].flatMap((u) => [u.email]),
      'Gustavo',
      'Reserverez',
      'Ginevra',
      'Sharerova',
      'Asanti',
      'Askerman',
      ...recordIds,
    ];
  }

  it('gives the owner exactly the same responses with and without reservations', async () => {
    const s = await setUpList();
    const before = await ownerReads(s);

    await reserveAndAsk(s);
    const after = await ownerReads(s);

    expect(after).toEqual(before);
  });

  it('shows the owner no reserved gift, holder or request on their own link', async () => {
    const s = await setUpList();
    await reserveAndAsk(s);

    const view = (
      await api()
        .get(`/public/wishlists/${s.listId}`)
        .set(as(owner.id))
        .expect(200)
    ).body as { isOwner: boolean; gifts: Record<string, unknown>[] };

    expect(view.isOwner).toBe(true);
    for (const gift of view.gifts) {
      expect(gift).toMatchObject({
        reserved: false,
        reservedByMe: false,
        reservers: [],
        myRequest: null,
        incomingRequests: [],
      });
    }
  });

  it('puts nothing about the guests in anything an owner can read', async () => {
    const s = await setUpList();
    const ids = await reserveAndAsk(s);

    const everything = JSON.stringify(await ownerReads(s));

    for (const secret of secrets(ids)) {
      expect(everything, `leaked ${secret}`).not.toContain(secret);
    }
  });

  it('answers an owner editing or deleting a reserved gift without a trace of the reservation', async () => {
    const s = await setUpList();
    const ids = await reserveAndAsk(s);
    const responses: unknown[] = [];

    const patchGift = await api()
      .patch(`/wishlists/${s.listId}/gifts/${s.a.id}`)
      .set(as(owner.id))
      .send({ name: 'Better lamp', price: 30 })
      .expect(200);
    const patchList = await api()
      .patch(`/wishlists/${s.listId}`)
      .set(as(owner.id))
      .send({ title: 'Birthday 2' })
      .expect(200);
    const delGift = await api()
      .delete(`/wishlists/${s.listId}/gifts/${s.b.id}`)
      .set(as(owner.id));
    responses.push(
      patchGift.body,
      patchList.body,
      delGift.body,
      delGift.status,
    );

    // The same edit on an unreserved gift has the same shape of answer.
    const patchFree = await api()
      .patch(`/wishlists/${s.listId}/gifts/${s.d.id}`)
      .set(as(owner.id))
      .send({ name: 'Better vase', price: 30 })
      .expect(200);
    expect(Object.keys(patchGift.body).sort()).toEqual(
      Object.keys(patchFree.body).sort(),
    );

    const text = JSON.stringify(responses);
    for (const secret of secrets(ids)) {
      expect(text, `leaked ${secret}`).not.toContain(secret);
    }
  });

  it('sends the owner no email about the reservations', async () => {
    const s = await setUpList();
    await reserveAndAsk(s);
    await api()
      .patch(`/wishlists/${s.listId}/gifts/${s.a.id}`)
      .set(as(owner.id))
      .send({ name: 'Better lamp' })
      .expect(200);
    await api()
      .delete(`/wishlists/${s.listId}/gifts/${s.b.id}`)
      .set(as(owner.id));

    const toOwner = sendInBackground.mock.calls
      .map(([message]) => message as { to: string })
      .filter((message) => message.to === owner.email);

    expect(toOwner).toEqual([]);
  });

  it('cannot tell a reserved gift from a free one by trying the visitor actions', async () => {
    const s = await setUpList();
    await reserveAndAsk(s);
    const attempt = async (giftId: string) => {
      const reserve = await api()
        .put(`${gifts(s.listId, giftId)}/reservation`)
        .set(as(owner.id));
      const cancel = await api()
        .delete(`${gifts(s.listId, giftId)}/reservation`)
        .set(as(owner.id));
      const ask = await api()
        .post(`${gifts(s.listId, giftId)}/requests`)
        .set(as(owner.id))
        .send({ type: 'share' });
      return [reserve, cancel, ask].map((r) => ({
        status: r.status,
        message: (r.body as { message?: string }).message,
      }));
    };

    // A is reserved (with a pending request), B is shared, D is free.
    const free = await attempt(s.d.id);
    expect(await attempt(s.a.id)).toEqual(free);
    expect(await attempt(s.b.id)).toEqual(free);
  });
});
