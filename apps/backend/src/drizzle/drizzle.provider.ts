import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Provider } from '@nestjs/common';
import { getDbUrl } from '../config/config';

export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDb = PostgresJsDatabase;

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  useFactory: (): DrizzleDb => {
    const client = postgres(getDbUrl());
    return drizzle({ client });
  },
};
