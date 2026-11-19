import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { giftsTable, usersTable, wishlistsTable } from '../db/schema';
import { giftsOrder } from '../gifts/gift.columns';

type GiftRow = typeof giftsTable.$inferSelect;

@Injectable()
export class PublicService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
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
        ownerName: usersTable.name,
      })
      .from(wishlistsTable)
      .innerJoin(usersTable, eq(usersTable.id, wishlistsTable.userId))
      .where(eq(wishlistsTable.id, wishlistId));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    return wishlist;
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

    // Owners must not see reservations on their own list (surprise).
    return {
      ...publicWishlist,
      isOwner,
      gifts: gifts.map((gift) =>
        this.toPublicGift(
          isOwner ? this.withoutReservation(gift) : gift,
          userId,
        ),
      ),
    };
  }

  async reserve(wishlistId: string, giftId: string, userId: number) {
    const [wishlist] = await this.db
      .select({ userId: wishlistsTable.userId })
      .from(wishlistsTable)
      .where(eq(wishlistsTable.id, wishlistId));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    if (userId === wishlist.userId)
      throw new ForbiddenException('You cannot reserve your own gifts');

    // The isNull check makes the reservation atomic: of two concurrent
    // requests only one updates a row.
    const [gift] = await this.db
      .update(giftsTable)
      .set({ reservedByUserId: userId, reservedAt: new Date() })
      .where(
        and(
          eq(giftsTable.id, giftId),
          eq(giftsTable.wishlistId, wishlistId),
          isNull(giftsTable.reservedAt),
        ),
      )
      .returning();

    if (gift) return this.toPublicGift(gift, userId);

    await this.assertGiftExists(wishlistId, giftId);
    throw new ConflictException('Gift is already reserved');
  }

  async cancelReservation(wishlistId: string, giftId: string, userId: number) {
    const [gift] = await this.db
      .update(giftsTable)
      .set({ reservedByUserId: null, reservedAt: null })
      .where(
        and(
          eq(giftsTable.id, giftId),
          eq(giftsTable.wishlistId, wishlistId),
          eq(giftsTable.reservedByUserId, userId),
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
    return { ...gift, reservedByUserId: null, reservedAt: null };
  }

  private toPublicGift(gift: GiftRow, userId: number) {
    return {
      id: gift.id,
      name: gift.name,
      description: gift.description,
      price: gift.price,
      url: gift.url,
      imageUrl: gift.imageUrl,
      reserved: gift.reservedAt !== null,
      reservedByMe:
        gift.reservedAt !== null && gift.reservedByUserId === userId,
    };
  }
}
