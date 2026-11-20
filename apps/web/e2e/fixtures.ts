import { expect, test as base } from "@playwright/test";

export const WISHLIST_ID = "11111111-1111-4111-8111-111111111111";
export const PASSWORD = "secret123";

/** Every test starts from the stub backend's seed data. */
export const test = base.extend<{ signInAs: (token: string) => Promise<void> }>(
  {
    page: async ({ page, request }, provide) => {
      await request.post("http://127.0.0.1:4010/__reset");
      await provide(page);
    },
    // Skips the sign-in form where a test is about something else.
    signInAs: async ({ context }, provide) => {
      await provide(async (token) => {
        await context.addCookies([
          {
            name: "better-auth.session_token",
            value: token,
            url: "http://localhost:3100",
          },
        ]);
      });
    },
  },
);

export { expect };
