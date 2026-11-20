import { expect, test } from "./fixtures";

test.describe("session", () => {
  test("logging out ends the session", async ({ page, signInAs }) => {
    await signInAs("tok-olga");
    await page.goto("/dashboard");
    await expect(page.getByText("Olga turns 30")).toBeVisible();

    await page.getByTitle("Log out").click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByLabel("Email")).toBeVisible();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/$/);
  });

  test("the dashboard greets the user by first name and links to the account page", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-olga");
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: /Hello, Olga/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Your account" }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText("olga@example.com")).toBeVisible();
  });

  test("registering asks the user to verify their email, without signing them in", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Register" }).click();
    await page.getByLabel("Full name").fill("Nina New");
    await page.getByLabel("Email").fill("nina@example.com");
    await page.getByLabel("Password").fill("secret123");
    await page.locator("button[type=submit]").click();

    await expect(page.getByRole("status")).toContainText(
      "We sent a verification link to nina@example.com",
    );
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/$/);
  });

  test("an invalid verification link explains what happened", async ({
    page,
  }) => {
    await page.goto("/?error=TOKEN_EXPIRED");

    await expect(
      page.getByText(
        "This verification link has expired. Sign in to get a new one.",
      ),
    ).toBeVisible();
  });
});
