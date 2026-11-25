#!/usr/bin/env node
// Post-deploy check that the rate limit really follows the visitor IP, given
// the real proxy chain and TRUST_PROXY. Run it from any machine against the
// public address:
//
//   pnpm --filter backend check:rate-limit https://your-site.example
//
// It sends sign-in attempts (always rejected, nothing is created) to
// /api/auth/sign-in/email, each with a different forged X-Forwarded-For. The
// sign-in route is limited to 3 per 10 seconds per visitor by better-auth,
// which reads the same visitor IP as the reservation throttle. See
// docs/adr/0003-rate-limit-visitor-ip.md.

/** Sign-in attempts allowed per 10 seconds, per visitor (better-auth). */
export const SIGN_IN_LIMIT = 3;
const ATTEMPTS = SIGN_IN_LIMIT + 5;

/**
 * Reads the statuses of consecutive attempts, each sent with a different
 * forged address.
 *
 * @param {number[]} statuses
 * @returns {{ ok: boolean, message: string }}
 */
export function evaluate(statuses) {
  const firstBlocked = statuses.indexOf(429);

  if (firstBlocked === -1) {
    return {
      ok: false,
      message:
        `Never limited (${statuses.join(', ')}). Either a forged ` +
        'X-Forwarded-For lets visitors pick their own IP (TRUST_PROXY too ' +
        'permissive, or the edge proxy passes the header through instead of ' +
        'appending the real address), or the backend is not running with ' +
        'NODE_ENV=production (better-auth only limits in production).',
    };
  }

  if (firstBlocked < SIGN_IN_LIMIT) {
    return {
      ok: false,
      message:
        `Limited too early (${statuses.join(', ')}): the ${ordinal(firstBlocked + 1)} ` +
        `attempt was already refused, but ${SIGN_IN_LIMIT} are allowed. All ` +
        'visitors probably share one allowance (TRUST_PROXY does not trust ' +
        'the web server, so the backend sees only its address). If you ' +
        'signed in from this address in the last 10 seconds, wait and retry.',
    };
  }

  return {
    ok: true,
    message:
      `Limited after ${firstBlocked} attempts (${statuses.join(', ')}) ` +
      'although every attempt claimed a different address: forged ' +
      'X-Forwarded-For does not dodge the limit.',
  };
}

function ordinal(n) {
  return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;
}

/**
 * @param {string} siteUrl Public address of the web app.
 * @param {typeof fetch} [fetchImpl]
 */
export async function checkRateLimit(siteUrl, fetchImpl = fetch) {
  const origin = new URL(siteUrl).origin;
  const statuses = [];

  for (let i = 0; i < ATTEMPTS; i++) {
    const response = await fetchImpl(`${origin}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // better-auth refuses requests from other origins.
        Origin: origin,
        // A different made-up visitor every time.
        'X-Forwarded-For': `203.0.113.${i + 10}`,
      },
      body: JSON.stringify({
        email: 'rate-limit-check@example.invalid',
        password: 'not-a-real-password',
      }),
    });
    statuses.push(response.status);
  }

  return evaluate(statuses);
}

// Only when run directly, not when imported by the tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  const siteUrl = process.argv[2];
  if (!siteUrl) {
    console.error('Usage: check-rate-limit.mjs https://your-site.example');
    process.exit(2);
  }
  checkRateLimit(siteUrl)
    .then(({ ok, message }) => {
      console.log(`${ok ? 'OK' : 'FAIL'}: ${message}`);
      if (ok) {
        console.log(
          'Still to check by hand: open the site from a second address (e.g. ' +
            'your phone on mobile data) and confirm it is not limited by this run.',
        );
      }
      process.exit(ok ? 0 : 1);
    })
    .catch((error) => {
      console.error(`Could not reach ${siteUrl}:`, error);
      process.exit(2);
    });
}
