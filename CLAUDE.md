# Wishpool

Gift wishlists without duplicate gifts. Owners share one link; signed-in
visitors reserve gifts, and owners never see who reserved what (the surprise
is the product). pnpm + Turborepo monorepo.

## Layout

- `apps/backend`: NestJS, Drizzle ORM (Postgres), better-auth (mounted in the
  web origin via a Next rewrite), nodemailer over plain SMTP.
- `apps/web`: Next.js (see `apps/web/AGENTS.md`: read
  `node_modules/next/dist/docs/` before writing Next code), Tailwind v4,
  Playwright e2e, Storybook.
- `packages/ui`: shared components. `packages/types`: shared schemas.
  `packages/configs`: eslint/tsconfig.
- `docs/adr`: architecture decision records. Add one for decisions that look
  like bugs but are intended.

## Commands

From the root: `pnpm check-types`, `pnpm lint`, `pnpm test` (all with
`--max-warnings 0`; keep them clean). Backend tests run on in-memory Postgres
(PGlite) with the real migrations, no external DB needed. Web e2e:
`pnpm --filter web test:e2e`.

## Database

- Schema: `apps/backend/src/db/schema.ts`. Every table uses
  `pgTable.withRLS`; new tables need it too.
- Change the schema, then `pnpm exec drizzle-kit generate --name <name>` in
  `apps/backend`, then apply with `drizzle-kit migrate` (export
  `DATABASE_URL` from `apps/backend/.env`).
- `DATABASE_URL` is a hosted dev database that is wiped before deploy: test
  data and migrations are fine. Re-check this once a deploy has happened.

## Working agreements

- Make source changes with the Edit/Write tools so each edit can be reviewed.
  Running Python scripts and drizzle `generate`/`migrate` is explicitly
  allowed without asking.
- When asked "why" about a bug, explain and propose the fix rather than
  applying it.
- After moving UI between packages, check it visually: Tailwind v4 needs an
  `@source` entry for sibling workspace packages.
- User-facing validation messages are shown as written; keep them in plain
  language that names the form field.

## Deployment checklist (remind when preparing a deploy)

`SITE_URL` must be set (web) and `WEB_URL` (backend); check link previews;
set `TRUST_PROXY` (the reservation/request throttle and the auth throttle
trust `X-Forwarded-For`; see `apps/backend/README.md`, usually `1`, never
`true`, which the backend refuses in production); run the backend with
`NODE_ENV=production` (better-auth's limiter is off otherwise); after the
first deploy run `pnpm --filter backend check:rate-limit https://<site>` and
open the site from a second address to confirm it isn't limited too; wipe the
dev DB; pick an SMTP provider and a verified `MAIL_FROM`.
