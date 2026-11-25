import { getIP, getIPFromHeader } from '@better-auth/core/utils/ip';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AUTH_IP_OPTIONS } from '../auth/auth.config';
import { CLIENT_IP_HEADER, stampClientIp } from './client-ip';

/** What better-auth's rate limiter would key on for this request. */
function authVisitorIp(trust: boolean | number) {
  const app = express();
  app.set('trust proxy', trust);
  app.use(stampClientIp);
  app.get('/', (req, res) => {
    const ip = getIP(req as unknown as Request, {
      advanced: { ipAddress: AUTH_IP_OPTIONS },
    });
    res.json({ ip });
  });
  return request(app);
}

describe('stampClientIp', () => {
  it('gives better-auth the visitor IP Express resolved from TRUST_PROXY', async () => {
    // The edge proxy appended the real visitor; the visitor forged a first hop.
    const res = await authVisitorIp(1)
      .get('/')
      .set('x-forwarded-for', '10.0.0.1, 198.51.100.7');

    expect((res.body as { ip: string }).ip).toBe('198.51.100.7');
  });

  it('ignores an address the visitor sends in the header itself', async () => {
    const res = await authVisitorIp(1)
      .get('/')
      .set('x-forwarded-for', '198.51.100.7')
      .set(CLIENT_IP_HEADER, '10.9.9.9');

    expect((res.body as { ip: string }).ip).toBe('198.51.100.7');
  });

  it('is what keeps auth visitors apart: better-auth alone finds no IP in a multi-hop header', () => {
    // null means one shared bucket for every such visitor.
    expect(getIPFromHeader('10.0.0.1, 198.51.100.7')).toBeNull();
  });
});
