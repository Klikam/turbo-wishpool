import type { Page } from "@playwright/test";
import { expect, PASSWORD, test } from "./fixtures";

// Next's route announcer is a role=alert element too.
const pageAlert = (page: Page) =>
  page.locator('[role="alert"]:not(#__next-route-announcer__)');

test.describe("forgot password", () => {
  test("is offered on the sign-in form and confirms without revealing accounts", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);

    await page.getByLabel("Email").fill("anyone@example.com");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(page.getByRole("status")).toContainText(
      "If there's an account for anyone@example.com",
    );
  });

  test("rejects an invalid address in the browser", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.getByLabel("Email").fill("nope");
    await page.getByRole("button", { name: "Send reset link" }).click();

    await expect(pageAlert(page)).toContainText("Enter a valid email address");
  });
});

test.describe("reset password", () => {
  test("a valid link lets the user choose a new password and sign in", async ({
    page,
  }) => {
    await page.goto("/reset-password?token=valid-token");

    await page
      .getByLabel("New password", { exact: true })
      .fill("brand-new-pass-2");
    await page.getByLabel("Repeat new password").fill("brand-new-pass-2");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Your password has been changed",
    );
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("an expired link says so and offers a new one", async ({ page }) => {
    await page.goto("/reset-password?token=expired");

    await page
      .getByLabel("New password", { exact: true })
      .fill("brand-new-pass-2");
    await page.getByLabel("Repeat new password").fill("brand-new-pass-2");
    await page.getByRole("button", { name: "Change password" }).click();

    await expect(pageAlert(page)).toContainText("invalid or has expired");
  });

  test("a link without a token, or one better-auth already refused, offers a new link", async ({
    page,
  }) => {
    for (const url of [
      "/reset-password",
      "/reset-password?error=INVALID_TOKEN",
    ]) {
      await page.goto(url);

      await expect(pageAlert(page)).toContainText("invalid or has expired");
      await page.getByRole("link", { name: "Request a new link" }).click();
      await expect(page).toHaveURL(/\/forgot-password$/);
    }
  });

  test("the page stays out of search results", async ({ request }) => {
    const html = await (await request.get("/reset-password")).text();

    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });
});

test.describe("change password (account page)", () => {
  test("changes the password and confirms", async ({ page, signInAs }) => {
    await signInAs("tok-ann");
    await page.goto("/account");

    await page.getByRole("button", { name: "Change password" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Current password").fill(PASSWORD);
    await dialog
      .getByLabel("New password", { exact: true })
      .fill("brand-new-pass-2");
    await dialog.getByLabel("Repeat new password").fill("brand-new-pass-2");
    await dialog.getByRole("button", { name: "Change password" }).click();

    await expect(page.getByRole("status")).toContainText(
      "Your password has been changed.",
    );
    await expect(dialog).toBeHidden();
  });

  test("a wrong current password is explained and the dialog stays open", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-ann");
    await page.goto("/account");

    await page.getByRole("button", { name: "Change password" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Current password").fill("wrong-password");
    await dialog
      .getByLabel("New password", { exact: true })
      .fill("brand-new-pass-2");
    await dialog.getByLabel("Repeat new password").fill("brand-new-pass-2");
    await dialog.getByRole("button", { name: "Change password" }).click();

    await expect(dialog.getByRole("alert")).toContainText(
      "current password isn't right",
    );
  });

  test("signed-out visitors cannot reach the account page", async ({
    page,
  }) => {
    await page.goto("/account");

    await expect(page).toHaveURL(/\/\?next=%2Faccount$/);
  });
});
