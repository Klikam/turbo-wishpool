import {
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
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
