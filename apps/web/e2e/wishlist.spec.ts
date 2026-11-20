import { expect, PASSWORD, test, WISHLIST_ID } from "./fixtures";

const LIST = `/wishlist/${WISHLIST_ID}`;

test.describe("a shared wishlist link", () => {
  test("shows signed-out visitors who it is from, but not the gifts", async ({
    page,
  }) => {
    await page.goto(LIST);

    await expect(
      page.getByRole("heading", { name: "Olga turns 30" }),
    ).toBeVisible();
    await expect(
      page.getByText("Sign in to see Olga Owner's wishlist"),
    ).toBeVisible();
    await expect(page.getByText("Headphones")).toHaveCount(0);
    await expect(page.getByText("Surprise me")).toHaveCount(0);
  });

  test("gives link-preview bots the title and description without any gifts", async ({
    request,
  }) => {
    const html = await (await request.get(LIST)).text();

    expect(html).toMatch(/<meta property="og:title" content="Olga turns 30"/);
    expect(html).toContain("Olga Owner&#x27;s wishlist on Wishpool");
    expect(html).not.toContain("Headphones");
    expect(html).toMatch(/<meta name="robots" content="noindex/);
  });

  test("brings a visitor back to the list after signing in", async ({
    page,
  }) => {
    await page.goto(LIST);

    await page.getByLabel("Email").fill("ann@example.com");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.locator("button[type=submit]").click();

    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    await expect(
      page.getByRole("heading", { name: "Headphones" }),
    ).toBeVisible();
  });

  test("is a 404 for lists that do not exist", async ({ page }) => {
    const response = await page.goto(
      "/wishlist/99999999-9999-4999-8999-999999999999",
    );

    expect(response?.status()).toBe(404);
  });
});

test.describe("picking gifts", () => {
  test("a guest claims a gift and can undo it", async ({ page, signInAs }) => {
    await signInAs("tok-ann");
    await page.goto(LIST);

    await page.getByRole("button", { name: "I'll gift this" }).first().click();
    await expect(page.getByText("You're gifting this")).toBeVisible();

    await page.reload();
    await expect(page.getByText("You're gifting this")).toBeVisible();

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("You're gifting this")).toHaveCount(0);
    // Headphones is free again; the lamp stays with Bob.
    await expect(
      page.getByRole("button", { name: "I'll gift this" }),
    ).toHaveCount(1);
  });

  test("shows who already claimed a gift, and offers to ask for it", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-ann");
    await page.goto(LIST);

    await expect(page.getByText("Claimed by Bob Buyer")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ask to free" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ask to share" }),
    ).toBeVisible();
  });

  test("the owner sees the list without any claims (the surprise)", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-olga");
    await page.goto(LIST);

    await expect(
      page.getByRole("heading", { name: "Desk lamp" }),
    ).toBeVisible();
    await expect(page.getByText("Claimed by")).toHaveCount(0);
    await expect(page.getByText("I'll gift this")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Edit Desk lamp" }),
    ).toBeVisible();
  });
});
