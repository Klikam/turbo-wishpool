import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import {
  giftRequestsTable,
  giftReservationsTable,
  giftsTable,
  usersTable,
  wishlistsTable,
} from '../db/schema';
import { giftsOrder } from '../gifts/gift.columns';
import {
  giftRequestAnswerMail,
  giftRequestMail,
  type GiftRequestType,
} from '../mail/gift-request.mail';
import { MailService } from '../mail/mail.service';
import { isPastWishlist } from '../wishlists/wishlist-status';

type GiftRow = typeof giftsTable.$inferSelect;
type Tx = Parameters<Parameters<Database['transaction']>[0]>[0];

// How long after asking about a gift someone can ask about it again.
const REQUEST_COOLDOWN_MS = 60 * 60 * 1000;

interface Reserver {
  userId: number;
  name: string;
  email: string;
}

interface PendingRequest {
  id: string;
  giftId: string;
  type: GiftRequestType;
  requesterId: number;
  requesterName: string;
}

@Injectable()
export class PublicService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  /**
   * The wishlist without its gifts, for anyone with the link. Link-preview
   * bots and signed-out visitors see only this.
   */
  async getPreview(wishlistId: string) {
    const [wishlist] = await this.db
      .select({
        id: wishlistsTable.id,
        title: wishlistsTable.title,
        occasion: wishlistsTable.occasion,
        date: wishlistsTable.date,
        closed: wishlistsTable.closed,
        ownerName: usersTable.name,
      })
      .from(wishlistsTable)
      .innerJoin(usersTable, eq(usersTable.id, wishlistsTable.userId))
      .where(eq(wishlistsTable.id, wishlistId));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    // Only whether it has ended is public, not how (closed or by date).
    return {
      id: wishlist.id,
      title: wishlist.title,
      occasion: wishlist.occasion,
      date: wishlist.date,
      ownerName: wishlist.ownerName,
      isPast: isPastWishlist(wishlist),
    };
  }

  async getWishlist(wishlistId: string, userId: number) {
    const [wishlist] = await this.db
      .select({
        id: wishlistsTable.id,
        title: wishlistsTable.title,
        occasion: wishlistsTable.occasion,
        date: wishlistsTable.date,
        note: wishlistsTable.note,
        currency: wishlistsTable.currency,
        closed: wishlistsTable.closed,
        ownerName: usersTable.name,
        ownerId: wishlistsTable.userId,
      })
      .from(wishlistsTable)
      .innerJoin(usersTable, eq(usersTable.id, wishlistsTable.userId))
      .where(eq(wishlistsTable.id, wishlistId));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    const gifts = await this.db
      .select()
      .from(giftsTable)
      .where(eq(giftsTable.wishlistId, wishlistId))
      .orderBy(...giftsOrder);

    const { ownerId, ...publicWishlist } = wishlist;
    const isOwner = userId === ownerId;

    // Owners must not see reservations, requests or who made them (surprise),
    // so for them none of it is even loaded.
    const giftIds = gifts.map((gift) => gift.id);
    const reservers =
      isOwner || giftIds.length === 0
        ? new Map<string, Reserver[]>()
        : await this.findReservers(giftIds);
    const requests =
      isOwner || giftIds.length === 0
        ? new Map<string, PendingRequest[]>()
        : await this.findPendingRequests(giftIds);

    return {
      ...publicWishlist,
      isOwner,
      isPast: isPastWishlist(wishlist),
      gifts: gifts.map((gift) =>
        this.toPublicGift(
          gift,
          userId,
          reservers.get(gift.id) ?? [],
          requests.get(gift.id) ?? [],
        ),
      ),
    };
  }

  async reserve(wishlistId: string, giftId: string, userId: number) {
    await this.assertNotOwner(wishlistId, userId, 'reserve');

    await this.db.transaction(async (tx) => {
      await this.lockGift(tx, wishlistId, giftId);

      // The lock makes this atomic: of two concurrent requests the second
      // sees the first one's reservation.
      const taken = await tx
        .select({ id: giftReservationsTable.id })
        .from(giftReservationsTable)
        .where(eq(giftReservationsTable.giftId, giftId));

      if (taken.length > 0)
        throw new ConflictException('Gift is already reserved');

      await tx.insert(giftReservationsTable).values({ giftId, userId });
    });
  }

  async cancelReservation(wishlistId: string, giftId: string, userId: number) {
    await this.assertOpen(wishlistId);

    await this.db.transaction(async (tx) => {
      await this.lockGift(tx, wishlistId, giftId);

      const deleted = await tx
        .delete(giftReservationsTable)
        .where(
          and(
            eq(giftReservationsTable.giftId, giftId),
            eq(giftReservationsTable.userId, userId),
          ),
        )
        .returning({ id: giftReservationsTable.id });

      if (deleted.length === 0)
        throw new ForbiddenException('You have no reservation on this gift');

      // Once nobody holds the gift, asking its holders for anything is moot.
      const remaining = await tx
        .select({ id: giftReservationsTable.id })
        .from(giftReservationsTable)
        .where(eq(giftReservationsTable.giftId, giftId));

      if (remaining.length === 0) {
        await tx
          .delete(giftRequestsTable)
          .where(
            and(
              eq(giftRequestsTable.giftId, giftId),
              eq(giftRequestsTable.status, 'pending'),
            ),
          );
      }
    });
  }

  /**
   * Asks the holders of a reserved gift to give it up (`release`) or to let
   * the asker buy it together with them (`share`). They are emailed.
   */
  async createRequest(
    wishlistId: string,
    giftId: string,
    userId: number,
    type: GiftRequestType,
  ) {
    await this.assertNotOwner(wishlistId, userId, 'ask for');

    const { request, reservers, giftName, wishlistTitle, requesterName } =
      await this.db.transaction(async (tx) => {
        const gift = await this.lockGift(tx, wishlistId, giftId);
        const reservers = await this.findReservers([giftId], tx).then(
          (byGift) => byGift.get(giftId) ?? [],
        );

        if (reservers.length === 0)
          throw new ConflictException('Gift is not reserved, just claim it');
        if (reservers.some((r) => r.userId === userId))
          throw new ConflictException('You already reserved this gift');
        // With several holders there is nobody who could free it alone.
        if (type === 'release' && reservers.length > 1)
          throw new ConflictException(
            'This gift is shared; ask to share it instead',
          );

        const [latest] = await tx
          .select({
            status: giftRequestsTable.status,
            createdAt: giftRequestsTable.createdAt,
          })
          .from(giftRequestsTable)
          .where(
            and(
              eq(giftRequestsTable.giftId, giftId),
              eq(giftRequestsTable.requesterId, userId),
            ),
          )
          .orderBy(desc(giftRequestsTable.createdAt))
          .limit(1);
        if (latest?.status === 'pending')
          throw new ConflictException('You already have a pending request');
        // Each request emails the holders, so asking, taking back and asking
        // again can't be repeated at will.
        if (
          latest &&
          Date.now() - latest.createdAt.getTime() < REQUEST_COOLDOWN_MS
        )
          throw new ConflictException(
            'You asked about this gift recently; you can ask again in an hour',
          );

        const [request] = await tx
          .insert(giftRequestsTable)
          .values({ giftId, requesterId: userId, type })
          .returning({ id: giftRequestsTable.id });

        const [requester] = await tx
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, userId));
        const [wishlist] = await tx
          .select({ title: wishlistsTable.title })
          .from(wishlistsTable)
          .where(eq(wishlistsTable.id, wishlistId));

        return {
          request: request!,
          reservers,
          giftName: gift.name,
          wishlistTitle: wishlist!.title,
          requesterName: requester!.name,
        };
      });

    for (const reserver of reservers) {
      this.mail.sendInBackground(
        giftRequestMail({
          to: reserver.email,
          otherName: requesterName,
          type,
          giftName,
          wishlistTitle,
          wishlistUrl: this.wishlistUrl(wishlistId),
        }),
      );
    }

    return request;
  }

  /**
   * Takes back the asker's own pending request. It stays as a record, which
   * is what the cooldown on asking again is measured from.
   */
  async cancelRequest(
    wishlistId: string,
    giftId: string,
    requestId: string,
    userId: number,
  ) {
    await this.assertOpen(wishlistId);

    const deleted = await this.db
      .update(giftRequestsTable)
      .set({ status: 'cancelled', respondedAt: new Date() })
      .where(
        and(
          eq(giftRequestsTable.id, requestId),
          eq(giftRequestsTable.giftId, giftId),
          eq(giftRequestsTable.requesterId, userId),
          eq(giftRequestsTable.status, 'pending'),
        ),
      )
      .returning({ id: giftRequestsTable.id });

    if (deleted.length === 0) throw new NotFoundException('Request not found');
  }

  /**
   * A holder of the gift accepts or declines a request. Accepting a
   * `release` hands the holder's reservation to the asker; accepting a
   * `share` adds the asker to the holders. The asker is emailed the answer.
   */
  async respondToRequest(
    wishlistId: string,
    giftId: string,
    requestId: string,
    userId: number,
    accept: boolean,
  ) {
    await this.assertOpen(wishlistId);

    const answer = await this.db.transaction(async (tx) => {
      const gift = await this.lockGift(tx, wishlistId, giftId);

      // Conditional update: of two concurrent answers only one wins.
      const [request] = await tx
        .update(giftRequestsTable)
        .set({
          status: accept ? 'accepted' : 'declined',
          respondedAt: new Date(),
        })
        .where(
          and(
            eq(giftRequestsTable.id, requestId),
            eq(giftRequestsTable.giftId, giftId),
            eq(giftRequestsTable.status, 'pending'),
          ),
        )
        .returning();

      if (!request) throw new NotFoundException('Request not found');

      const [mine] = await tx
        .select({ id: giftReservationsTable.id })
        .from(giftReservationsTable)
        .where(
          and(
            eq(giftReservationsTable.giftId, giftId),
            eq(giftReservationsTable.userId, userId),
          ),
        );
      // Throwing rolls the status change back.
      if (!mine)
        throw new ForbiddenException('Only the people who reserved can answer');

      if (accept) {
        if (request.type === 'release') {
          await tx
            .delete(giftReservationsTable)
            .where(eq(giftReservationsTable.id, mine.id));
        }
        await tx
          .insert(giftReservationsTable)
          .values({ giftId, userId: request.requesterId })
          .onConflictDoNothing();

        // With several holders no one can free the gift alone any more, so
        // requests to free it can't be granted. They are turned down here
        // instead of staying open with an Accept that would hand the gift
        // to one asker while the other holders keep it.
        if (request.type === 'share') {
          await tx
            .update(giftRequestsTable)
            .set({ status: 'cancelled', respondedAt: new Date() })
            .where(
              and(
                eq(giftRequestsTable.giftId, giftId),
                eq(giftRequestsTable.type, 'release'),
                eq(giftRequestsTable.status, 'pending'),
              ),
            );
        }
      }

      const [[requester], [responder], [wishlist]] = await Promise.all([
        tx
          .select({ email: usersTable.email })
          .from(usersTable)
          .where(eq(usersTable.id, request.requesterId)),
        tx
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, userId)),
        tx
          .select({ title: wishlistsTable.title })
          .from(wishlistsTable)
          .where(eq(wishlistsTable.id, wishlistId)),
      ]);

      return {
        to: requester!.email,
        otherName: responder!.name,
        type: request.type,
        giftName: gift.name,
        wishlistTitle: wishlist!.title,
      };
    });

    this.mail.sendInBackground(
      giftRequestAnswerMail({
        ...answer,
        accepted: accept,
        wishlistUrl: this.wishlistUrl(wishlistId),
      }),
    );
  }

  private wishlistUrl(wishlistId: string) {
    const base = this.config.getOrThrow<string>('WEB_URL').replace(/\/$/, '');
    return `${base}/wishlist/${wishlistId}`;
  }

  /** For visitors: the list must exist, be open, and not be the visitor's own. */
  private async assertNotOwner(
    wishlistId: string,
    userId: number,
    verb: string,
  ) {
    const wishlist = await this.findWishlist(wishlistId);

    if (userId === wishlist.userId)
      throw new ForbiddenException(`You cannot ${verb} your own gifts`);

    this.assertNotPast(wishlist);
  }

  /** The list must exist and be open; for changes that are not about ownership. */
  private async assertOpen(wishlistId: string) {
    this.assertNotPast(await this.findWishlist(wishlistId));
  }

  private assertNotPast(wishlist: { date: string | null; closed: boolean }) {
    if (isPastWishlist(wishlist))
      throw new ForbiddenException(
        'This wishlist is in the past, so gifts can no longer be changed',
      );
  }

  private async findWishlist(wishlistId: string) {
    const [wishlist] = await this.db
      .select({
        userId: wishlistsTable.userId,
        date: wishlistsTable.date,
        closed: wishlistsTable.closed,
      })
      .from(wishlistsTable)
      .where(eq(wishlistsTable.id, wishlistId));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    return wishlist;
  }

  /** Locks the gift's row for the transaction, serializing changes to it. */
  private async lockGift(tx: Tx, wishlistId: string, giftId: string) {
    const [gift] = await tx
      .select()
      .from(giftsTable)
      .where(
        and(eq(giftsTable.id, giftId), eq(giftsTable.wishlistId, wishlistId)),
      )
      .for('update');

    if (!gift) throw new NotFoundException('Gift not found');

    return gift;
  }

  private async findReservers(giftIds: string[], db: Database | Tx = this.db) {
    const rows = await db
      .select({
        giftId: giftReservationsTable.giftId,
        userId: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
      })
      .from(giftReservationsTable)
      .innerJoin(usersTable, eq(usersTable.id, giftReservationsTable.userId))
      .where(inArray(giftReservationsTable.giftId, giftIds))
      .orderBy(
        asc(giftReservationsTable.createdAt),
        asc(giftReservationsTable.id),
      );

    return groupBy(rows, (row) => row.giftId);
  }

  private async findPendingRequests(giftIds: string[]) {
    const rows = await this.db
      .select({
        id: giftRequestsTable.id,
        giftId: giftRequestsTable.giftId,
        type: giftRequestsTable.type,
        requesterId: giftRequestsTable.requesterId,
        requesterName: usersTable.name,
      })
      .from(giftRequestsTable)
      .innerJoin(usersTable, eq(usersTable.id, giftRequestsTable.requesterId))
      .where(
        and(
          inArray(giftRequestsTable.giftId, giftIds),
          eq(giftRequestsTable.status, 'pending'),
        ),
      )
      .orderBy(asc(giftRequestsTable.createdAt));

    return groupBy(rows, (row) => row.giftId);
  }

  /**
   * The gift as one viewer sees it. `reservers` and `requests` are empty for
   * owners. Requests are shown to the holders (to answer) and to their own
   * asker (to take back), and to nobody else.
   */
  private toPublicGift(
    gift: GiftRow,
    userId: number,
    reservers: Reserver[],
    requests: PendingRequest[],
  ) {
    const reservedByMe = reservers.some((r) => r.userId === userId);
    const myRequest = requests.find((r) => r.requesterId === userId);

    return {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      price: gift.price,
      url: gift.url,
      imageUrl: gift.imageUrl,
      reserved: reservers.length > 0,
      reservedByMe,
      // Everyone but the owner sees who is buying a gift.
      reservers: reservers.map((r) => ({
        name: r.name,
        isMe: r.userId === userId,
      })),
      myRequest: myRequest ? { id: myRequest.id, type: myRequest.type } : null,
      incomingRequests: reservedByMe
        ? requests
            .filter((r) => r.requesterId !== userId)
            .map((r) => ({
              id: r.id,
              type: r.type,
              requesterName: r.requesterName,
            }))
        : [],
    };
  }
}

function groupBy<T, K>(items: T[], key: (item: T) => K) {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const group = groups.get(key(item));
    if (group) group.push(item);
    else groups.set(key(item), [item]);
  }
  return groups;
}
