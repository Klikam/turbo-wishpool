import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { stampClientIp } from './config/client-ip';
import { trustProxy, trustProxyProblem } from './config/trust-proxy';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    // better-auth needs the raw request body; the auth module re-adds the
    // body parsers for every other route.
    { bodyParser: false },
  );

  // Which proxies may set X-Forwarded-For, i.e. where `req.ip` (used for rate
  // limiting) comes from. See TRUST_PROXY in .env.example.
  const production = process.env.NODE_ENV === 'production';
  const problem = trustProxyProblem(process.env.TRUST_PROXY, production);
  const logger = new Logger('Bootstrap');
  if (problem?.level === 'error') {
    // Refuse to start rather than run with a rate limit anyone can dodge.
    throw new Error(problem.message);
  }
  if (problem) logger.warn(problem.message);
  logger.log(
    `Rate limit trusts proxies: ${process.env.TRUST_PROXY ?? 'loopback'}`,
  );
  app.set('trust proxy', trustProxy(process.env.TRUST_PROXY));
  // Registered before the auth routes are mounted, so their rate limit sees
  // the same visitor IP.
  app.use(stampClientIp);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // One message per field: they are shown to users as they are.
      stopAtFirstError: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
