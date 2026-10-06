import { fn } from "storybook/test";
import type * as actual from "../auth";

/**
 * Storybook replacement for the `login`/`logout` server actions (registered
 * as a webpack alias in `.storybook/main.ts`). The real ones read/write the
 * session cookie and call the backend from the Next.js server, which doesn't
 * exist in Storybook. Override per story with `mocked(login).mockResolvedValue(...)`.
 */
export const login = fn<typeof actual.login>(() =>
  Promise.resolve({ ok: true }),
).mockName("login");

export const logout = fn<typeof actual.logout>(() =>
  Promise.resolve(),
).mockName("logout");
