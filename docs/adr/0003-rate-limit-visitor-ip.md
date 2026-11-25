# 3. The rate limit trusts a configured number of proxies

Date: 2026-11-25
Status: Accepted

## Context

Reservations and requests are throttled per visitor (20 per minute, see
`PublicModule`), with no CAPTCHA. The visitor is identified by `req.ip`, which
Express derives from `X-Forwarded-For` according to `TRUST_PROXY`. The web
app forwards the header on every backend call (`apps/web/src/utils/apiHelper.ts`)
but does not add its own hop.

The setting is easy to get wrong, in two opposite ways:

- `true` trusts the leftmost entry, which the visitor controls: a fresh fake
  IP per request bypasses the limit completely.
- A value that does not trust the web server (the `loopback` default with the
  web app on another host, or `false`) makes `req.ip` the web server's
  address, so all visitors share one allowance and the site throttles itself.

## Decision

- Deploy with a hop count (usually `1`: the web server is the only trusted
  hop and the edge proxy appends the visitor IP) or an address list.
- The backend **refuses to start** with `TRUST_PROXY=true` when
  `NODE_ENV=production`, and logs a warning in development.
- In production it **warns** (but starts) when the value is the `loopback`
  default or `false`, since both are right for some single-host setups.
- At startup it logs the effective value, so a wrong setting is visible in
  the deploy logs.

## Consequences

- The check is on the setting, not the behaviour: a hop count that does not
  match the real topology is still not detected. After the first deploy, send
  more than 20 reservation requests from one machine (expect a 429), repeat
  with a forged `X-Forwarded-For` (still limited), and check that a second
  IP is not affected.
- A hosting provider that passes a client-supplied `X-Forwarded-For` through
  without appending the real address makes any hop count spoofable. Confirm
  that your edge proxy appends.
- The Next rewrite for `/api/auth/*` is not covered by this throttle.
