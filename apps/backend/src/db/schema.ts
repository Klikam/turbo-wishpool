import {
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable.withRLS('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }),
  password: varchar({ length: 255 }).notNull(),
});

export const sessionsTable = pgTable.withRLS('sessions', {
  id: uuid().primaryKey().defaultRandom(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});

export const wishlistsTable = pgTable.withRLS('wishlists', {
  id: uuid().primaryKey().defaultRandom(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export const giftsTable = pgTable.withRLS('gifts', {
  id: uuid().primaryKey().defaultRandom(),
  wishlistId: uuid()
    .notNull()
    .references(() => wishlistsTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  price: numeric({ precision: 10, scale: 2 }),
  url: varchar({ length: 255 }),
  imageUrl: varchar({ length: 255 }),
});
