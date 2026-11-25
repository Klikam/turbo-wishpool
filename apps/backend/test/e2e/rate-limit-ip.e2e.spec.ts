import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { trustProxy } from '../../src/config/trust-proxy';

/** A route throttled like the reservation endpoints, with a small limit. */
@Controller('probe')
class ProbeController {
  @Get()
  @UseGuards(ThrottlerGuard)
  probe() {
    return 'ok';
  }
}

const LIMIT = 3;

/**
 * Checks what a TRUST_PROXY value means for the rate limit, the way main.ts
 * applies it. The test client connects from loopback, standing in for the web
 * server; `X-Forwarded-For` is what it forwards from the edge proxy.
 * See docs/adr/0003-rate-limit-visitor-ip.md.
 */
describe('rate limit visitor IP', () => {
  let app: INestApplication;

  async function start(trustProxyEnv: string | undefined) {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: LIMIT }])],
      controllers: [ProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    (app as unknown as { set: (k: string, v: unknown) => void }).set(
      'trust proxy',
      trustProxy(trustProxyEnv),
    );
    await app.init();
  }

  const hit = (forwardedFor: string) =>
    request(app.getHttpServer())
      .get('/probe')
      .set('x-forwarded-for', forwardedFor);

  async function statuses(forwardedFor: (i: number) => string, count: number) {
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push((await hit(forwardedFor(i))).status);
    }
    return result;
  }

  afterEach(() => app.close());

  it('with a hop count, a forged leftmost address does not dodge the limit', async () => {
    await start('1');

    // The edge proxy appends the real visitor (198.51.100.7); the visitor
    // prepended a new fake address on every request.
    const result = await statuses(
      (i) => `10.0.0.${i}, 198.51.100.7`,
      LIMIT + 2,
    );

    expect(result.slice(0, LIMIT)).not.toContain(429);
    expect(result.slice(LIMIT)).toEqual([429, 429]);
  });

  it('with a hop count, different visitors get their own allowance', async () => {
    await start('1');

    await statuses(() => '198.51.100.7', LIMIT + 1);

    expect((await hit('198.51.100.8')).status).toBe(200);
  });

  it('with TRUST_PROXY=true, a forged address dodges the limit (why it is refused in production)', async () => {
    await start('true');

    const result = await statuses(
      (i) => `10.0.0.${i}, 198.51.100.7`,
      LIMIT + 2,
    );

    expect(result).not.toContain(429);
  });

  it('without trusting the web server, all visitors share one allowance', async () => {
    await start('false');

    // Distinct visitors, but the backend only sees the web server's address.
    const result = await statuses((i) => `198.51.100.${i}`, LIMIT + 1);

    expect(result.slice(0, LIMIT)).not.toContain(429);
    expect(result[LIMIT]).toBe(429);
  });
});
