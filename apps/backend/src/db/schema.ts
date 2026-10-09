import {
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const occasionEnum = pgEnum('occasion', [
  'birthday',
  'wedding',
  'baby_shower',
  'anniversary',
  'christmas',
  'graduation',
  'housewarming',
  'other',
]);

export const usersTable = pgTable.withRLS('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
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
  title: varchar({ length: 255 }).notNull(),
  occasion: occasionEnum(),
  date: date(),
  note: text(),
});

export const giftsTable = pgTable.withRLS('gifts', {
  id: uuid().primaryKey().defaultRandom(),
  wishlistId: uuid()
    .notNull()
    .references(() => wishlistsTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  price: numeric({ precision: 10, scale: 2, mode: 'number' }),
  url: varchar({ length: 2048 }),
  imageUrl: varchar({ length: 2048 }),
});
