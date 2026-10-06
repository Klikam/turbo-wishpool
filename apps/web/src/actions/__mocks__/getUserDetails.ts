import { fn } from "storybook/test";
import { mockUser } from "@/mocks/fixtures";
import type * as actual from "../getUserDetails";

/**
 * Storybook replacement for the `getUserDetails` server action (registered
 * as a webpack alias in `.storybook/main.ts`). The real one verifies the
 * session cookie on the Next.js server, which doesn't exist in Storybook.
 */
export const getUserDetails = fn<typeof actual.getUserDetails>(() =>
  Promise.resolve(mockUser),
).mockName("getUserDetails");
