import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { trustProxy } from './config/trust-proxy';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    // better-auth needs the raw request body; the auth module re-adds the
    // body parsers for every other route.
    { bodyParser: false },
  );

  // Which proxies may set X-Forwarded-For, i.e. where `req.ip` (used for rate
  // limiting) comes from. See TRUST_PROXY in .env.example.
  app.set('trust proxy', trustProxy(process.env.TRUST_PROXY));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
