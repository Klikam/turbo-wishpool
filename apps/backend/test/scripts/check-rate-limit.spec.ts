import { getIP } from '@better-auth/core/utils/ip';
import express from 'express';
import { createServer, request as httpRequest, Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { AUTH_IP_OPTIONS } from '../../src/auth/auth.config';
import { stampClientIp } from '../../src/config/client-ip';
import {
  checkRateLimit,
  evaluate,
  SIGN_IN_LIMIT,
} from '../../scripts/check-rate-limit.mjs';

describe('evaluate', () => {
  it('passes when the limit kicks in after the allowed attempts', () => {
    const statuses = [401, 401, 401, 429, 429, 429, 429, 429];
    expect(evaluate(statuses).ok).toBe(true);
  });

  it('fails when nothing is ever limited', () => {
    const result = evaluate([401, 401, 401, 401, 401, 401, 401, 401]);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/NODE_ENV=production/);
  });

  it('fails when limited before the allowance is used (shared bucket)', () => {
    const result = evaluate([401, 429, 429, 429, 429, 429, 429, 429]);
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/share one allowance/);
  });
});

/**
 * The backend as main.ts sets it up, with a limiter like better-auth's
 * sign-in one: 3 attempts per visitor IP, read from the stamped header.
 */
function startBackend(trustProxy: boolean | number) {
  const hits = new Map<string, number>();
  const app = express();
  app.set('trust proxy', trustProxy);
  app.use(stampClientIp);
  app.post('/api/auth/sign-in/email', (req, res) => {
    const ip = getIP(req as unknown as Request, {
      advanced: { ipAddress: AUTH_IP_OPTIONS },
    });
    const count = (hits.get(String(ip)) ?? 0) + 1;
    hits.set(String(ip), count);
    res.status(count > SIGN_IN_LIMIT ? 429 : 401).end();
  });
  return listen(createServer(app));
}

/** An edge proxy that appends the address it saw, like a typical host does. */
function startEdge(backendPort: number) {
  return listen(
    createServer((req, res) => {
      const forwarded = [
        req.headers['x-forwarded-for'],
        req.socket.remoteAddress,
      ]
        .filter(Boolean)
        .join(', ');
      const upstream = httpRequest(
        {
          port: backendPort,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, 'x-forwarded-for': forwarded },
        },
        (response) => {
          res.writeHead(response.statusCode ?? 502);
          response.pipe(res);
        },
      );
      req.pipe(upstream);
    }),
  );
}

const servers: Server[] = [];
async function listen(server: Server) {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  servers.push(server);
  return (server.address() as AddressInfo).port;
}

afterEach(() => {
  for (const server of servers.splice(0)) server.close();
});

describe('checkRateLimit', () => {
  it('passes with an edge proxy that appends and TRUST_PROXY=1', async () => {
    const edge = await startEdge(await startBackend(1));

    const result = await checkRateLimit(`http://127.0.0.1:${edge}`);

    expect(result.ok).toBe(true);
  });

  it('fails when TRUST_PROXY=true believes the forged address', async () => {
    const edge = await startEdge(await startBackend(true));

    const result = await checkRateLimit(`http://127.0.0.1:${edge}`);

    expect(result.ok).toBe(false);
  });

  it('fails when nothing in front appends the visitor address', async () => {
    // Visitors reach the backend directly, so the forged header is the only
    // address there is, which is what a pass-through proxy looks like too.
    const backend = await startBackend(1);

    const result = await checkRateLimit(`http://127.0.0.1:${backend}`);

    expect(result.ok).toBe(false);
  });
});
