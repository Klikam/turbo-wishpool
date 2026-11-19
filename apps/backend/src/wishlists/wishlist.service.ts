import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, count, desc, eq, getColumns, sql } from 'drizzle-orm';
import type { Database } from '../drizzle/drizzle.provider';
import { DrizzleAsyncProvider } from '../drizzle/drizzle.provider';
import { giftsTable, wishlistsTable } from '../db/schema';
import { giftsOrder, ownerGiftColumns } from '../gifts/gift.columns';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private db: Database,
  ) {}

  async create(userId: number, dto: CreateWishlistDto) {
    const [wishlist] = await this.db
      .insert(wishlistsTable)
      .values({ ...dto, userId })
      .returning();

    return wishlist;
  }

  async findAll(userId: number) {
    // Lists without a date go last (Postgres puts nulls first in desc).
    return this.db
      .select({
        ...getColumns(wishlistsTable),
        giftsCount: count(giftsTable.id),
      })
      .from(wishlistsTable)
      .leftJoin(giftsTable, eq(giftsTable.wishlistId, wishlistsTable.id))
      .where(eq(wishlistsTable.userId, userId))
      .groupBy(wishlistsTable.id)
      .orderBy(
        sql`${wishlistsTable.date} desc nulls last`,
        desc(wishlistsTable.createdAt),
      );
  }

  async findOne(userId: number, id: string) {
    const [wishlist] = await this.db
      .select()
      .from(wishlistsTable)
      .where(and(eq(wishlistsTable.id, id), eq(wishlistsTable.userId, userId)));

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    const gifts = await this.db
      .select(ownerGiftColumns)
      .from(giftsTable)
      .where(eq(giftsTable.wishlistId, id))
      .orderBy(...giftsOrder);

    return { ...wishlist, gifts };
  }

  async update(userId: number, id: string, dto: UpdateWishlistDto) {
    if (Object.values(dto).every((value) => value === undefined))
      return this.findOne(userId, id);

    const [wishlist] = await this.db
      .update(wishlistsTable)
      .set(dto)
      .where(and(eq(wishlistsTable.id, id), eq(wishlistsTable.userId, userId)))
      .returning();

    if (!wishlist) throw new NotFoundException('Wishlist not found');

    return wishlist;
  }

  async remove(userId: number, id: string) {
    const deleted = await this.db
      .delete(wishlistsTable)
      .where(and(eq(wishlistsTable.id, id), eq(wishlistsTable.userId, userId)))
      .returning({ id: wishlistsTable.id });

    if (deleted.length === 0) throw new NotFoundException('Wishlist not found');
  }
}
