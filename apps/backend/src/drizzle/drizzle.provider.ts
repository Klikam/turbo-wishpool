import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { defineRelations } from 'drizzle-orm';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import { ConfigService } from '@nestjs/config';

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';

const dbRelations = defineRelations(schema);

export type Database = NodePgDatabase<typeof dbRelations>;

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService): Promise<Database> => {
      const connectionString = configService.get<string>('DATABASE_URL')!;
      const pool = new Pool({
        connectionString,
      });
      return drizzle({ client: pool, relations: dbRelations });
    },
  },
];
