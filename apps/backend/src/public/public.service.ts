import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull, notInArray } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { giftsTable, usersTable, wishlistsTable } from '../db/schema';
import { giftsOrder } from '../gifts/gift.columns';

export type Viewer = { userId: number } | { guestTokenHash: string } | null;

type GiftRow = typeof giftsTable.$inferSelect;

const MIN_GUEST_TOKEN_LENGTH = 16;
const MAX_GUEST_TOKEN_LENGTH = 128;

@Injectable()
export class PublicService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
  ) {}

  resolveViewer(
    userId: number | undefined,
    guestToken: string | undefined,
  ): Viewer {
    if (userId !== undefined) return { userId };
    if (!guestToken) return null;

    return { guestTokenHash: this.hashGuestToken(guestToken) };
  }

  /**
   * Moves the reservations made in this browser as a guest onto the account
   * that just signed in, so they show as `reservedByMe` and can be undone.
   * Reservations on the user's own wishlists stay as they were: owners can't
   * reserve their own gifts.
   */
  async adoptGuestReservations(userId: number, guestToken: string) {
    const guestTokenHash = this.hashGuestToken(guestToken);

    const ownWishlists = this.db
      .select({ id: wishlistsTable.id })
      .from(wishlistsTable)
      .where(eq(wishlistsTable.userId, userId));

    const adopted = await this.db
      .update(giftsTable)
      .set({ reservedByUserId: userId, reservedByGuestTokenHash: null })
      .where(
        and(
          eq(giftsTable.reservedByGuestTokenHash, guestTokenHash),
          notInArray(giftsTable.wishlistId, ownWishlists),
        ),
      )
      .returning({ id: giftsTable.id });

    return { adopted: adopted.length };
  }

  async getWishlist(wishlistId: string, viewer: Viewer) {
    const [wishlist] = await this.db
      .select({
        id: wishlistsTable.id,
        title: wishlistsTable.title,
        occasion: wishlistsTable.occasion,
        date: wishlistsTable.date,
        note: wishlistsTable.note,
        currency: wishlistsTable.currency,
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
    const isOwner =
      viewer !== null && 'userId' in viewer && viewer.userId === ownerId;

    // Owners must not see reservations on their own list (surprise).
    return {
      ...publicWishlist,
      isOwner,
      gifts: gifts.map((gift) =>
        this.toPublicGift(
          isOwner ? this.withoutReservation(gift) : gift,
          viewer,
        ),
      ),
    };
  }

  async reserve(wishlistId: string, giftId: string, viewer: Viewer) {
    const [wishlist] = await this.db
      .select({ userId: wishlistsTable.userId })
      .from(wishlistsTable)
      .where(eq(wishlistsTable.id, wishlistId));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    // Reservations record only which browser or account holds them, so they
    // can be undone; nobody is told who reserved what.
    let values: Pick<GiftRow, 'reservedByUserId' | 'reservedByGuestTokenHash'>;

    if (viewer && 'userId' in viewer) {
      if (viewer.userId === wishlist.userId)
        throw new ForbiddenException('You cannot reserve your own gifts');

      values = {
        reservedByUserId: viewer.userId,
        reservedByGuestTokenHash: null,
      };
    } else if (viewer) {
      values = {
        reservedByUserId: null,
        reservedByGuestTokenHash: viewer.guestTokenHash,
      };
    } else {
      throw new BadRequestException('Guest token or authorization is required');
    }

    // The isNull check makes the reservation atomic: of two concurrent
    // requests only one updates a row.
    const [gift] = await this.db
      .update(giftsTable)
      .set({ ...values, reservedAt: new Date() })
      .where(
        and(
          eq(giftsTable.id, giftId),
          eq(giftsTable.wishlistId, wishlistId),
          isNull(giftsTable.reservedAt),
        ),
      )
      .returning();

    if (gift) return this.toPublicGift(gift, viewer);

    await this.assertGiftExists(wishlistId, giftId);
    throw new ConflictException('Gift is already reserved');
  }

  async cancelReservation(wishlistId: string, giftId: string, viewer: Viewer) {
    if (!viewer)
      throw new BadRequestException('Guest token or authorization is required');

    const [gift] = await this.db
      .update(giftsTable)
      .set({
        reservedByUserId: null,
        reservedByGuestTokenHash: null,
        reservedAt: null,
      })
      .where(
        and(
          eq(giftsTable.id, giftId),
          eq(giftsTable.wishlistId, wishlistId),
          'userId' in viewer
            ? eq(giftsTable.reservedByUserId, viewer.userId)
            : eq(giftsTable.reservedByGuestTokenHash, viewer.guestTokenHash),
        ),
      )
      .returning({ id: giftsTable.id });

    if (gift) return;

    await this.assertGiftExists(wishlistId, giftId);
    throw new ForbiddenException('You have no reservation on this gift');
  }

  private async assertGiftExists(wishlistId: string, giftId: string) {
    const [gift] = await this.db
      .select({ id: giftsTable.id })
      .from(giftsTable)
      .where(
        and(eq(giftsTable.id, giftId), eq(giftsTable.wishlistId, wishlistId)),
      );

    if (!gift) throw new NotFoundException('Gift not found');
  }

  private hashGuestToken(guestToken: string) {
    if (
      guestToken.length < MIN_GUEST_TOKEN_LENGTH ||
      guestToken.length > MAX_GUEST_TOKEN_LENGTH
    )
      throw new BadRequestException('Invalid guest token');

    return createHash('sha256').update(guestToken).digest('hex');
  }

  private withoutReservation(gift: GiftRow): GiftRow {
    return {
      ...gift,
      reservedByUserId: null,
      reservedByGuestTokenHash: null,
      reservedAt: null,
    };
  }

  private toPublicGift(gift: GiftRow, viewer: Viewer) {
    const reservedByMe =
      viewer !== null &&
      gift.reservedAt !== null &&
      ('userId' in viewer
        ? gift.reservedByUserId === viewer.userId
        : gift.reservedByGuestTokenHash === viewer.guestTokenHash);

    return {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      price: gift.price,
      url: gift.url,
      imageUrl: gift.imageUrl,
      reserved: gift.reservedAt !== null,
      reservedByMe,
    };
  }
}
