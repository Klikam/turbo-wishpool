import { expect, test } from "./fixtures";

test.describe("public pages", () => {
  test("the landing page invites people to sign in", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Wishpool/);
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /facebook/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("terms and privacy are reachable from the sign-in form", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "terms", exact: true }).click();
    await expect(page).toHaveURL(/\/terms$/);

    await page.goto("/");
    await page
      .getByRole("link", { name: "privacy policy", exact: true })
      .click();
    await expect(page).toHaveURL(/\/privacy$/);
  });

  test("unknown pages show the not-found page", async ({ page }) => {
    const response = await page.goto("/no-such-page");

    expect(response?.status()).toBe(404);
  });

  test("robots.txt and the sitemap are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBe(true);
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBe(true);
  });

  test("the forgot-password page asks for an email", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
