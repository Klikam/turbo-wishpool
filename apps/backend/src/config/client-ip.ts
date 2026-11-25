import type { NextFunction, Request, Response } from 'express';

/**
 * Header that carries the visitor IP to better-auth's rate limiter. It is
 * always set by `stampClientIp`, never by the client.
 */
export const CLIENT_IP_HEADER = 'x-wishpool-client-ip';

/**
 * Copies the visitor IP that Express resolved (so TRUST_PROXY applies) into
 * CLIENT_IP_HEADER, replacing anything the client sent under that name.
 *
 * better-auth would otherwise read `X-Forwarded-For` on its own: it ignores
 * TRUST_PROXY, takes no address at all from a multi-hop header, and so puts
 * every such visitor in one shared bucket. Reading one header that we set
 * keeps the auth routes and the reservation throttle on the same visitor IP.
 * See docs/adr/0003-rate-limit-visitor-ip.md.
 */
export function stampClientIp(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  delete req.headers[CLIENT_IP_HEADER];
  if (req.ip) req.headers[CLIENT_IP_HEADER] = req.ip;
  next();
}
