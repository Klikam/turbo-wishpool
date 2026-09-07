import { config } from 'dotenv';

config({
  path: ['.env.local', '.env'],
});

export const getDbUrl = (): string => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set.');
  }
  return url;
};

export const getPort = (): string => {
  const url = process.env.PORT;
  if (!url) {
    throw new Error('PORT is not set.');
  }
  return url;
};
