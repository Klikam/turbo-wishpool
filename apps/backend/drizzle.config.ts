import { defineConfig } from 'drizzle-kit';
import { getDbUrl } from './src/config/config';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDbUrl(),
  },
});
