import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

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

// users, sessions, accounts and verifications are managed by better-auth.
// Property names must match the field names it expects.
export const usersTable = pgTable.withRLS('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  name: varchar({ length: 255 }).notNull(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const sessionsTable = pgTable.withRLS('sessions', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
  token: varchar({ length: 255 }).notNull().unique(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  ipAddress: varchar({ length: 255 }),
  userAgent: text(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// One row per sign-in method of a user: the email/password credential
// (providerId "credential") or a linked social account ("google", "facebook").
export const accountsTable = pgTable.withRLS(
  'accounts',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    accountId: varchar({ length: 255 }).notNull(),
    providerId: varchar({ length: 64 }).notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: varchar({ length: 255 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.providerId, table.accountId),
    index().on(table.userId),
  ],
);

export const verificationsTable = pgTable.withRLS('verifications', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  identifier: varchar({ length: 255 }).notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const wishlistsTable = pgTable.withRLS(
  'wishlists',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    title: varchar({ length: 255 }).notNull(),
    occasion: occasionEnum(),
    date: date(),
    note: text(),
    // ISO 4217 code that the list's gift prices are in.
    currency: varchar({ length: 3 }).notNull().default('EUR'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.userId)],
);

export const giftsTable = pgTable.withRLS(
  'gifts',
  {
    id: uuid().primaryKey().defaultRandom(),
    wishlistId: uuid()
      .notNull()
      .references(() => wishlistsTable.id, { onDelete: 'cascade' }),
    name: varchar({ length: 255 }).notNull(),
    description: text(),
    price: numeric({ precision: 10, scale: 2, mode: 'number' }),
    url: varchar({ length: 2048 }),
    imageUrl: varchar({ length: 2048 }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index().on(table.wishlistId)],
);

// A gift is reserved when it has at least one row here. Several rows mean
// the people are buying it together and split the price equally.
export const giftReservationsTable = pgTable.withRLS(
  'gift_reservations',
  {
    id: uuid().primaryKey().defaultRandom(),
    giftId: uuid()
      .notNull()
      .references(() => giftsTable.id, { onDelete: 'cascade' }),
    userId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique().on(table.giftId, table.userId),
    index().on(table.userId),
  ],
);

export const giftRequestTypeEnum = pgEnum('gift_request_type', [
  // "Please give this gift up so I can take it."
  'release',
  // "Let me chip in on this gift."
  'share',
]);

export const giftRequestStatusEnum = pgEnum('gift_request_status', [
  'pending',
  'accepted',
  'declined',
]);

// A request to the people holding a reservation. Answered requests stay as a
// record; only a pending one blocks the requester from asking again.
export const giftRequestsTable = pgTable.withRLS(
  'gift_requests',
  {
    id: uuid().primaryKey().defaultRandom(),
    giftId: uuid()
      .notNull()
      .references(() => giftsTable.id, { onDelete: 'cascade' }),
    requesterId: integer()
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
    type: giftRequestTypeEnum().notNull(),
    status: giftRequestStatusEnum().notNull().default('pending'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index().on(table.giftId),
    index().on(table.requesterId),
    uniqueIndex()
      .on(table.giftId, table.requesterId)
      .where(sql`${table.status} = 'pending'`),
  ],
);
