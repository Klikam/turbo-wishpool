import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { giftsTable, usersTable, wishlistsTable } from '../db/schema';

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

    if (
      guestToken.length < MIN_GUEST_TOKEN_LENGTH ||
      guestToken.length > MAX_GUEST_TOKEN_LENGTH
    )
      throw new BadRequestException('Invalid guest token');

    return {
      guestTokenHash: createHash('sha256').update(guestToken).digest('hex'),
    };
  }

  async getWishlist(wishlistId: string, viewer: Viewer) {
    const [wishlist] = await this.db
      .select({
        id: wishlistsTable.id,
        title: wishlistsTable.title,
        occasion: wishlistsTable.occasion,
        date: wishlistsTable.date,
        note: wishlistsTable.note,
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
      .where(eq(giftsTable.wishlistId, wishlistId));

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

  async reserve(
    wishlistId: string,
    giftId: string,
    viewer: Viewer,
    name: string | undefined,
  ) {
    const [wishlist] = await this.db
      .select({ userId: wishlistsTable.userId })
      .from(wishlistsTable)
      .where(eq(wishlistsTable.id, wishlistId));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    let values: Pick<
      GiftRow,
      'reservedByUserId' | 'reservedByName' | 'reservedByGuestTokenHash'
    >;

    if (viewer && 'userId' in viewer) {
      if (viewer.userId === wishlist.userId)
        throw new ForbiddenException('You cannot reserve your own gifts');

      const [user] = await this.db
        .select({ name: usersTable.name })
        .from(usersTable)
        .where(eq(usersTable.id, viewer.userId));
      if (!user) throw new UnauthorizedException();

      values = {
        reservedByUserId: viewer.userId,
        reservedByName: user.name,
        reservedByGuestTokenHash: null,
      };
    } else if (viewer) {
      const guestName = name?.trim();
      if (!guestName) throw new BadRequestException('Name is required');

      values = {
        reservedByUserId: null,
        reservedByName: guestName,
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
        reservedByName: null,
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

  private withoutReservation(gift: GiftRow): GiftRow {
    return {
      ...gift,
      reservedByUserId: null,
      reservedByName: null,
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
      reservedByName: gift.reservedByName,
      reservedByMe,
    };
  }
}
