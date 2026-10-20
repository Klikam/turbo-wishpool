import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { giftsTable, wishlistsTable } from '../db/schema';
import { CreateGiftDto } from './dto/create-gift.dto';
import { UpdateGiftDto } from './dto/update-gift.dto';
import { ownerGiftColumns } from './gift.columns';

@Injectable()
export class GiftService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
  ) {}

  async create(userId: number, wishlistId: string, dto: CreateGiftDto) {
    await this.assertWishlistOwner(userId, wishlistId);

    const [gift] = await this.db
      .insert(giftsTable)
      .values({ ...dto, wishlistId })
      .returning(ownerGiftColumns);

    return gift;
  }

  async findAll(userId: number, wishlistId: string) {
    await this.assertWishlistOwner(userId, wishlistId);

    return this.db
      .select(ownerGiftColumns)
      .from(giftsTable)
      .where(eq(giftsTable.wishlistId, wishlistId));
  }

  async findOne(userId: number, wishlistId: string, id: string) {
    await this.assertWishlistOwner(userId, wishlistId);

    const [gift] = await this.db
      .select(ownerGiftColumns)
      .from(giftsTable)
      .where(and(eq(giftsTable.id, id), eq(giftsTable.wishlistId, wishlistId)));

    if (!gift) throw new NotFoundException('Gift not found');

    return gift;
  }

  async update(
    userId: number,
    wishlistId: string,
    id: string,
    dto: UpdateGiftDto,
  ) {
    if (Object.values(dto).every((value) => value === undefined))
      return this.findOne(userId, wishlistId, id);

    await this.assertWishlistOwner(userId, wishlistId);

    const [gift] = await this.db
      .update(giftsTable)
      .set(dto)
      .where(and(eq(giftsTable.id, id), eq(giftsTable.wishlistId, wishlistId)))
      .returning(ownerGiftColumns);

    if (!gift) throw new NotFoundException('Gift not found');

    return gift;
  }

  async remove(userId: number, wishlistId: string, id: string) {
    await this.assertWishlistOwner(userId, wishlistId);

    const deleted = await this.db
      .delete(giftsTable)
      .where(and(eq(giftsTable.id, id), eq(giftsTable.wishlistId, wishlistId)))
      .returning({ id: giftsTable.id });

    if (deleted.length === 0) throw new NotFoundException('Gift not found');
  }

  private async assertWishlistOwner(userId: number, wishlistId: string) {
    const [wishlist] = await this.db
      .select({ id: wishlistsTable.id })
      .from(wishlistsTable)
      .where(
        and(
          eq(wishlistsTable.id, wishlistId),
          eq(wishlistsTable.userId, userId),
        ),
      );

    if (!wishlist) throw new NotFoundException('Wishlist not found');
  }
}
