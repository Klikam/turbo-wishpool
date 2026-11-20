import { expect, test, WISHLIST_ID } from "./fixtures";

const LIST = `/wishlist/${WISHLIST_ID}`;

test.describe("owner: wishlists", () => {
  test.beforeEach(async ({ signInAs }) => {
    await signInAs("tok-olga");
  });

  test("creates a wishlist from the dashboard and lands on it", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "New wishlist" }).click();
    await expect(page).toHaveURL(/\/create$/);
    await page.getByLabel("List title *").fill("Housewarming");
    await page.getByLabel("A note for your guests").fill("Bring snacks");
    await page.getByRole("button", { name: "Create wishlist" }).click();

    await expect(page).toHaveURL(/\/wishlist\/[0-9a-f-]{36}$/);
    await expect(
      page.getByRole("heading", { name: "Housewarming" }),
    ).toBeVisible();
    await expect(
      page.getByText("No gifts yet — add your first one!"),
    ).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByText("Housewarming")).toBeVisible();
    await expect(page.getByText("Olga turns 30")).toBeVisible();
  });

  test("needs a title before it can be created", async ({ page }) => {
    await page.goto("/create");

    await expect(
      page.getByRole("button", { name: "Create wishlist" }),
    ).toBeDisabled();
    await page.getByLabel("List title *").fill("   ");
    await expect(
      page.getByRole("button", { name: "Create wishlist" }),
    ).toBeDisabled();
    await page.getByLabel("List title *").fill("Wedding");
    await expect(
      page.getByRole("button", { name: "Create wishlist" }),
    ).toBeEnabled();
  });

  test("creates a wishlist when Enter is pressed in the title", async ({
    page,
  }) => {
    await page.goto("/create");

    await page.getByLabel("List title *").fill("Baby shower");
    await page.getByLabel("List title *").press("Enter");

    await expect(page).toHaveURL(/\/wishlist\/[0-9a-f-]{36}$/);
    await expect(
      page.getByRole("heading", { name: "Baby shower" }),
    ).toBeVisible();
  });

  test("does not submit with Enter while the title is empty", async ({
    page,
  }) => {
    await page.goto("/create");

    await page.getByLabel("List title *").press("Enter");

    await expect(page).toHaveURL(/\/create$/);
  });

  test("picking an occasion does not submit the form", async ({ page }) => {
    await page.goto("/create");

    await page.getByLabel("List title *").fill("Party");
    await page.getByRole("button", { name: "Wedding" }).click();

    await expect(page).toHaveURL(/\/create$/);
  });

  test("stops typing at the length the backend accepts", async ({ page }) => {
    await page.goto("/create");

    await page.getByLabel("List title *").fill("a".repeat(300));
    await page.getByLabel("A note for your guests").fill("b".repeat(2100));

    await expect(page.getByLabel("List title *")).toHaveValue(
      "a".repeat(255),
    );
    await expect(page.getByLabel("A note for your guests")).toHaveValue(
      "b".repeat(2000),
    );
  });

  test("suggests a currency from the browser language", async ({ browser }) => {
    const context = await browser.newContext({ locale: "pl-PL" });
    await context.addCookies([
      {
        name: "better-auth.session_token",
        value: "tok-olga",
        url: "http://localhost:3100",
      },
    ]);
    const page = await context.newPage();

    await page.goto("/create");

    await expect(page.getByLabel("Currency of gift prices")).toHaveValue("PLN");
    await context.close();
  });

  test("edits the title and note of a wishlist", async ({ page }) => {
    await page.goto(LIST);

    await page.getByRole("link", { name: "Edit list" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit wishlist" }),
    ).toBeVisible();
    await expect(page.getByLabel("List title *")).toHaveValue("Olga turns 30");
    await page.getByLabel("List title *").fill("Olga turns 31");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    await expect(
      page.getByRole("heading", { name: "Olga turns 31" }),
    ).toBeVisible();
  });

  test("warns that changing the currency does not convert prices", async ({
    page,
  }) => {
    await page.goto(`${LIST}/edit`);

    await page.getByLabel("Currency of gift prices").selectOption("USD");

    await expect(
      page.getByText("Prices keep their amounts and aren't converted."),
    ).toBeVisible();
  });

  test("deletes a wishlist from the dashboard after confirming", async ({
    page,
  }) => {
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "Delete Olga turns 30" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("its share link will stop working");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Olga turns 30", exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Delete Olga turns 30" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(
      page.getByText("No wishlists yet — create your first one!"),
    ).toBeVisible();
  });

  test("a deleted wishlist's link stops working", async ({ page, request }) => {
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "Delete Olga turns 30" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(
      page.getByText("No wishlists yet — create your first one!"),
    ).toBeVisible();

    const response = await request.get(LIST);

    expect(response.status()).toBe(404);
  });

  test("someone else's wishlist cannot be edited", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-ann");

    const response = await page.goto(`${LIST}/edit`);

    expect(response?.status()).toBe(404);
  });

  test("copies the share link", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(LIST);

    await page.getByRole("button", { name: "Share link" }).click();

    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      `http://localhost:3100${LIST}`,
    );
  });
});

test.describe("owner: gifts", () => {
  test.beforeEach(async ({ signInAs }) => {
    await signInAs("tok-olga");
  });

  test("adds a gift with a price and a link", async ({ page }) => {
    await page.goto(LIST);

    await page.getByRole("button", { name: "Add gift" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Gift name *").fill("Coffee grinder");
    await dialog.getByLabel("Description").fill("Burr, manual");
    await dialog.getByLabel("Price (EUR)").fill("49,90");
    await dialog.getByLabel("Link (URL)").fill("shop.test/grinder");
    await dialog.getByRole("button", { name: "Add to wishlist" }).click();

    await expect(dialog).toBeHidden();
    const card = page.locator("div.rounded-2xl", {
      has: page.getByRole("heading", { name: "Coffee grinder" }),
    });
    await expect(card.getByText("Burr, manual")).toBeVisible();
    await expect(card.getByText(/49\.90/)).toBeVisible();
    // A link typed without a scheme is saved as https.
    await expect(card.getByRole("link", { name: /View item/ })).toHaveAttribute(
      "href",
      "https://shop.test/grinder",
    );
  });

  test("saves a gift with Enter, completing a link typed without https", async ({
    page,
  }) => {
    await page.goto(LIST);

    await page.getByRole("button", { name: "Add gift" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Gift name *").fill("Teapot");
    await dialog.getByLabel("Link (URL)").fill("shop.test/teapot");
    await dialog.getByLabel("Link (URL)").press("Enter");

    // No native "enter a URL" bubble in the way: the dialog closes.
    await expect(dialog).toBeHidden();
    const card = page.locator("div.rounded-2xl", {
      has: page.getByRole("heading", { name: "Teapot" }),
    });
    await expect(card.getByRole("link", { name: /View item/ })).toHaveAttribute(
      "href",
      "https://shop.test/teapot",
    );
  });

  test("cannot save a gift without a name", async ({ page }) => {
    await page.goto(LIST);

    await page.getByRole("button", { name: "Add gift" }).click();
    const save = page
      .getByRole("dialog")
      .getByRole("button", { name: "Add to wishlist" });

    await expect(save).toBeDisabled();
    await page.getByLabel("Gift name *").fill("Book");
    await expect(save).toBeEnabled();
  });

  test("edits a gift", async ({ page }) => {
    await page.goto(LIST);

    await page.getByRole("button", { name: "Edit Headphones" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit gift" });
    await expect(dialog.getByLabel("Gift name *")).toHaveValue("Headphones");
    await expect(dialog.getByLabel("Price (EUR)")).toHaveValue("99");
    await dialog.getByLabel("Gift name *").fill("Studio headphones");
    await dialog.getByLabel("Price (EUR)").fill("129");
    await dialog.getByRole("button", { name: "Save changes" }).click();

    await expect(
      page.getByRole("heading", { name: "Studio headphones" }),
    ).toBeVisible();
    await expect(page.getByText(/129\.00/)).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Headphones", exact: true }),
    ).toHaveCount(0);
  });

  test("deletes a gift only after confirming", async ({ page }) => {
    await page.goto(LIST);

    await page.getByRole("button", { name: "Delete Headphones" }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("they'll be emailed that it's gone");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("heading", { name: "Headphones" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Delete Headphones" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(page.getByRole("heading", { name: "Headphones" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("heading", { name: "Desk lamp" }),
    ).toBeVisible();
  });

  test("a deleted gift is gone for guests too", async ({ page, signInAs }) => {
    await page.goto(LIST);
    await page.getByRole("button", { name: "Delete Headphones" }).click();
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Delete" })
      .click();
    await expect(page.getByRole("heading", { name: "Headphones" })).toHaveCount(
      0,
    );

    await signInAs("tok-ann");
    await page.goto(LIST);

    await expect(
      page.getByRole("heading", { name: "Desk lamp" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Headphones" })).toHaveCount(
      0,
    );
  });
});
