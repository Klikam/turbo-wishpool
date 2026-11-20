# Wishpool backend

NestJS API for Wishpool. Postgres through Drizzle ORM, authentication through
better-auth, email through any SMTP provider. See the
[root README](../../README.md) for first-time setup.

## Running

```sh
pnpm dev          # nest start --watch, on PORT (default 3001)
pnpm test         # vitest, no external services needed
pnpm lint
pnpm check-types
```

## Configuration

Everything is read from `.env` (see `.env.example`, which documents each
variable). The app refuses to start, listing every problem, if a required
one is missing or malformed.

| Variable                 | Notes                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`           | Required. `postgres://` connection string.                                                       |
| `WEB_URL`                | Required. Public origin of the web app. Used for links in emails and as the only trusted origin. |
| `BETTER_AUTH_SECRET`     | Required, at least 32 characters.                                                                |
| `TRUST_PROXY`            | Which proxies may set `X-Forwarded-For`; decides the visitor IP the rate limit uses.             |
| `SMTP_*`, `MAIL_FROM`    | Email. Without `SMTP_HOST` messages are logged instead of sent.                                  |
| `GOOGLE_*`, `FACEBOOK_*` | Social sign-in; a provider is off while its id or secret is empty.                               |

Authentication is served from the web app's origin (the web app proxies
`/api/auth/*` to this backend), so the session cookie belongs to the site's
domain. Register the redirect URIs `{WEB_URL}/api/auth/callback/google` and
`.../callback/facebook` with the providers.

## Database

The schema is `src/db/schema.ts`; migrations live in `drizzle/`.

```sh
set -a && . ./.env && set +a
pnpm exec drizzle-kit generate --name <what_changed>   # after editing the schema
pnpm exec drizzle-kit migrate                          # apply to DATABASE_URL
```

Tables use row-level security (`pgTable.withRLS`) so that Supabase's data API
cannot expose them; the backend connects with a role that bypasses it.

## How it's organised

| Folder          | Responsibility                                                                      |
| --------------- | ----------------------------------------------------------------------------------- |
| `src/auth`      | better-auth setup: email verification, password reset, change email, social sign-in |
| `src/wishlists` | Owner's wishlists, and the definition of a past wishlist (`wishlist-status.ts`)     |
| `src/gifts`     | Owner's gifts, and fetching a gift link's preview image (SSRF-safe)                 |
| `src/public`    | What visitors do: view a list, reserve gifts, ask to free or share a gift           |
| `src/mail`      | One mail service and the email templates                                            |
| `test`          | Integration tests on in-memory Postgres (`integration/`), HTTP tests (`e2e/`)       |

Rules worth knowing before changing behaviour:

- Owners never see reservations, requests or who made them. `PublicService`
  does not even load them for the owner.
- Visitors can't act on a past wishlist; see
  [ADR 2](../../docs/adr/0002-past-wishlists.md).
- Asking about a gift has a one-hour cooldown per user and gift, since each
  request emails the people who reserved it.

## Trying the API by hand

`bruno/` is a [Bruno](https://www.usebruno.com) collection covering every
endpoint: `auth`, `wishlists`, `gifts` (the owner) and `public` (visitors).
Open the folder in Bruno, pick an environment and fill in a test account's
email and password (they are left blank on purpose, so don't commit them).

1. `auth` → **sign up**, open the verification link from the backend console,
   then **sign in**. It stores the session token for the other folders.
2. `wishlists` → **create**, then `gifts` → **create**. They remember
   `wishlistId` and `giftId` for the following requests.
3. For the visitor side, switch to the `local-visitor` environment (a second
   account), sign in again, and use the `public` folder with the same ids.
