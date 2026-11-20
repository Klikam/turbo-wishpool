# Wishpool web

The Next.js frontend. See the [root README](../../README.md) for first-time
setup, and `AGENTS.md` here: this is a recent Next.js with breaking changes,
so read the guides in `node_modules/next/dist/docs/` before writing Next code.

## Running

```sh
pnpm dev                 # http://localhost:3000
pnpm test                # unit tests (vitest + Testing Library)
pnpm test:e2e            # browser tests (Playwright)
pnpm storybook           # component stories on :6006
pnpm lint && pnpm check-types
```

## Configuration

Copy `.env.example` to `.env`.

| Variable      | Notes                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `BACKEND_URL` | Origin of `apps/backend`, no trailing slash. Read at build time as well as at runtime: `/api/auth/*` is proxied there. |
| `SITE_URL`    | Public origin of this site, no trailing slash. Used for absolute URLs in link previews, the sitemap and robots.txt.    |

## How it's organised

- `src/app`: routes. Signed-in pages live in the `(app)` group, which marks
  them `noindex`. The shared wishlist page is in `(app)/wishlist/[id]/(view)`;
  its layout answers 404 for a missing list before the loading skeleton
  streams. The edit page sits outside that group on purpose.
- `src/actions`: server actions that call the backend with the visitor's
  session token. Failures come back as `{ ok: false, error }` so the UI can
  show the backend's message.
- `src/components`: `pages/` (whole screens), `sections/` (parts of screens,
  dialogs). Presentational pieces shared with Storybook live in
  `packages/ui`.
- `src/proxy.ts`: redirects signed-out visitors away from private pages. It
  only checks that a session cookie exists; the page validates the session.
- `src/mocks`, `.storybook`: fixtures and mocked server actions for Storybook.

Shared wishlist links are readable by anyone for the title, occasion, date and
owner's name (this is all link-preview bots get). The gifts need a signed-in
account.

## Tests

- **Unit**: `src/**/*.spec.ts(x)`, run with `pnpm test`.
- **Browser**: `e2e/`. Playwright starts a stub backend (`e2e/stub-backend.mjs`,
  port 4010) and its own Next server (port 3100, separate build folder), so
  it works while `pnpm dev` is running and needs no database. Install the
  browser once with `pnpm exec playwright install chromium`. When the real
  backend's behaviour changes, update the stub to match.
