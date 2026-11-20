import { PGlite } from '@electric-sql/pglite';
import { defineRelations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import {
  giftReservationsTable,
  giftRequestsTable,
  giftsTable,
  usersTable,
  wishlistsTable,
} from '../../src/db/schema';
import * as schema from '../../src/db/schema';
import type { Database } from '../../src/drizzle/drizzle.provider';

/**
 * A real Postgres (PGlite, in-process) with the project's own migrations
 * applied, so tests exercise the actual schema, constraints and row locks
 * without any external database.
 */
export async function createTestDb() {
  const client = new PGlite();
  const orm = drizzle({ client, relations: defineRelations(schema) });
  await migrate(orm, { migrationsFolder: './drizzle' });

  return {
    // The services only use the query builder API both drivers share.
    db: orm as unknown as Database,
    /** Empties every table; call between tests. */
    async reset() {
      await client.exec('TRUNCATE users RESTART IDENTITY CASCADE');
    },
    close: () => client.close(),
  };
}

let counter = 0;

export async function createUser(
  db: Database,
  overrides: Partial<typeof usersTable.$inferInsert> = {},
) {
  counter += 1;
  const [user] = await db
    .insert(usersTable)
    .values({
      name: `User ${counter}`,
      email: `user${counter}@example.com`,
      ...overrides,
    })
    .returning();
  return user!;
}

export async function createWishlist(
  db: Database,
  userId: number,
  overrides: Partial<typeof wishlistsTable.$inferInsert> = {},
) {
  const [wishlist] = await db
    .insert(wishlistsTable)
    .values({ title: 'Birthday', userId, ...overrides })
    .returning();
  return wishlist!;
}

export async function createGift(
  db: Database,
  wishlistId: string,
  overrides: Partial<typeof giftsTable.$inferInsert> = {},
) {
  const [gift] = await db
    .insert(giftsTable)
    .values({ name: 'Headphones', wishlistId, ...overrides })
    .returning();
  return gift!;
}

export async function reserveGift(
  db: Database,
  giftId: string,
  userId: number,
) {
  await db.insert(giftReservationsTable).values({ giftId, userId });
}

export const allReservations = (db: Database) =>
  db.select().from(giftReservationsTable);

export const allRequests = (db: Database) =>
  db.select().from(giftRequestsTable);
