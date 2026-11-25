# Wishpool

### The wishlist they'll actually love to receive.

Create a wishlist for any occasion and share it with one link. Friends sign
in, pick a gift and see what is already taken, so nobody buys the same thing
twice. The owner never sees who reserved what, so the gifts stay a surprise.

## What's inside

A pnpm + [Turborepo](https://turborepo.dev) monorepo:

| Path               | What it is                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| `apps/web`         | Next.js frontend (Tailwind v4, Playwright e2e, Storybook)                         |
| `apps/backend`     | NestJS API, Drizzle ORM on Postgres, [better-auth](https://better-auth.com)       |
| `packages/ui`      | Shared React components                                                           |
| `packages/types`   | Shared validation schemas                                                         |
| `packages/configs` | Shared ESLint and TypeScript configs                                              |
| `docs/adr`         | Architecture decision records, including decisions that look like bugs but aren't |

## Getting started

You need Node.js (18 or newer), [pnpm](https://pnpm.io) 9 (`corepack enable`
installs the right one) and a Postgres database. Any Postgres works; a free
hosted one such as Supabase is fine.

1. **Install**

   ```sh
   pnpm install
   ```

2. **Configure the backend.** Copy `apps/backend/.env.example` to
   `apps/backend/.env` and set at least:
   - `DATABASE_URL`: your Postgres connection string.
   - `BETTER_AUTH_SECRET`: generate one with `openssl rand -base64 32`.

   Leave `SMTP_HOST` empty while developing: emails (verification links,
   password resets, notifications) are printed in the backend's console
   instead of sent. Google and Facebook sign-in stay off until their ids and
   secrets are filled in. Every variable is explained in the file.

3. **Configure the web app.** Copy `apps/web/.env.example` to
   `apps/web/.env`. The defaults match a local setup.

4. **Create the tables**

   ```sh
   cd apps/backend
   set -a && . ./.env && set +a   # drizzle-kit reads DATABASE_URL from the environment
   pnpm exec drizzle-kit migrate
   ```

5. **Run everything**

   ```sh
   pnpm dev
   ```

   The web app is at <http://localhost:3000> and the API at
   <http://localhost:3001>. Sign up, then open the verification link from the
   backend's console to sign in.

## Everyday commands

Run from the repository root:

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `pnpm dev`         | Web and backend with hot reload               |
| `pnpm check-types` | TypeScript in every package                   |
| `pnpm lint`        | ESLint in every package (no warnings allowed) |
| `pnpm test`        | Unit and integration tests in every package   |
| `pnpm build`       | Production build                              |
| `pnpm format`      | Prettier                                      |

The backend tests run against an in-memory Postgres (PGlite) with the real
migrations, so they need no database or `.env`.

Browser tests (Playwright) drive the real web app against a small stub
backend, so they need no database either. Install the browser once, then run:

```sh
pnpm --filter web exec playwright install chromium
pnpm --filter web test:e2e
```

Component stories: `pnpm --filter web storybook` (port 6006).

## Changing the database

Edit `apps/backend/src/db/schema.ts`, then in `apps/backend`:

```sh
pnpm exec drizzle-kit generate --name <what_changed>
pnpm exec drizzle-kit migrate
```

Commit the generated folder in `apps/backend/drizzle/`. New tables should be
created with `pgTable.withRLS`.

## Deploying

Before the first deploy, set `SITE_URL` (web) and `WEB_URL` (backend) to the
public address, set `TRUST_PROXY` to match your proxy setup, and configure a
real SMTP provider with a verified `MAIL_FROM`. See `apps/backend/README.md`
and `apps/web/README.md` for the details of each app.

After the first deploy, check that the rate limit follows the visitor IP
(the backend must run with `NODE_ENV=production`):

```sh
pnpm --filter backend check:rate-limit https://your-site.example
```

It fails if a forged `X-Forwarded-For` lets a visitor dodge the limit. Then
open the site from a second address (e.g. your phone on mobile data) and
confirm it isn't limited by that run. See
[ADR 3](docs/adr/0003-rate-limit-visitor-ip.md).
