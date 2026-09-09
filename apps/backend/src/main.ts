import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { getDbUrl, getPort } from './config/config';

async function bootstrap() {
  const db = drizzle(getDbUrl());
  const app = await NestFactory.create(AppModule);
  await app.listen(getPort() ?? 3001);
}
void bootstrap();
