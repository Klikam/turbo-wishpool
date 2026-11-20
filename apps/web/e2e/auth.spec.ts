import { expect, PASSWORD, test } from "./fixtures";

test.describe("authentication", () => {
  for (const path of ["/dashboard", "/create", "/account"]) {
    test(`${path} sends signed-out visitors to the landing page`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveURL(
        new URL(
          `/${path === "/dashboard" ? "" : `?next=${encodeURIComponent(path)}`}`,
          "http://localhost:3100",
        ).href,
      );
      await expect(page.getByLabel("Email")).toBeVisible();
    });
  }

  test("signing in leads to the dashboard with my wishlists", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Email").fill("olga@example.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.locator("button[type=submit]").click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText("Olga turns 30")).toBeVisible();
  });

  test("wrong credentials show an error and keep the visitor on the page", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Email").fill("olga@example.com");
    await page.getByLabel("Password").fill("wrong-password");
    await page.locator("button[type=submit]").click();

    await expect(page.getByText("Invalid credentials")).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  });

  test("the form validates before talking to the backend", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Email").fill("olga@example.com");
    await page.getByLabel("Password").fill("short");
    await page.locator("button[type=submit]").click();

    await expect(
      page.getByText("Password must contain at least 8 characters"),
    ).toBeVisible();
  });

  test("a signed-in visitor is taken from the landing page to the dashboard", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-olga");

    await page.goto("/");

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("an expired session cookie lands on the landing page instead of looping", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-expired");

    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
