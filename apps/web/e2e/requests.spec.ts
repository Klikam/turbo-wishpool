import { expect, test, WISHLIST_ID } from "./fixtures";

const LIST = `/wishlist/${WISHLIST_ID}`;

// Bob holds the desk lamp (EUR 35.50); Ann wants it.
const lampCard = (page: import("@playwright/test").Page) =>
  page.locator("div.rounded-2xl", {
    has: page.getByRole("heading", { name: "Desk lamp" }),
  });

test.describe("asking for a gift someone else reserved", () => {
  test("Ann asks Bob to free it, Bob accepts, and the gift moves to Ann", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-ann");
    await page.goto(LIST);

    await page.getByRole("button", { name: "Ask to free" }).click();
    await expect(page.getByText("Request sent.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Asked to free it · Cancel" }),
    ).toBeVisible();

    await signInAs("tok-bob");
    await page.goto(LIST);
    await expect(
      lampCard(page).getByText("asks you to free this gift"),
    ).toBeVisible();
    await expect(lampCard(page).getByText("Ann Guest")).toBeVisible();
    await lampCard(page).getByRole("button", { name: "Accept" }).click();
    await expect(page.getByText("Accepted. We've told them.")).toBeVisible();
    await expect(
      lampCard(page).getByText("Claimed by Ann Guest"),
    ).toBeVisible();

    await signInAs("tok-ann");
    await page.goto(LIST);
    await expect(lampCard(page).getByText("You're gifting this")).toBeVisible();
    await expect(
      lampCard(page).getByRole("button", { name: "Undo" }),
    ).toBeVisible();
  });

  test("Ann asks to share, Bob accepts, and they split the price", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-ann");
    await page.goto(LIST);
    await expect(
      page.getByRole("button", { name: /Ask to share · .*17\.75 each/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Ask to share/ }).click();
    await expect(page.getByText("Request sent.")).toBeVisible();

    await signInAs("tok-bob");
    await page.goto(LIST);
    await expect(
      lampCard(page).getByText("asks to share this gift with you"),
    ).toBeVisible();
    await lampCard(page).getByRole("button", { name: "Accept" }).click();
    await expect(page.getByText("Accepted. We've told them.")).toBeVisible();
    await expect(
      lampCard(page).getByText("You're gifting this with Ann Guest"),
    ).toBeVisible();
    await expect(
      lampCard(page).getByText(/Split 2 ways: .*17\.75 each/),
    ).toBeVisible();
  });

  test("Bob declines, and the gift stays with Bob", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-ann");
    await page.goto(LIST);
    await page.getByRole("button", { name: "Ask to free" }).click();
    await expect(page.getByText("Request sent.")).toBeVisible();

    await signInAs("tok-bob");
    await page.goto(LIST);
    await lampCard(page).getByRole("button", { name: "Decline" }).click();
    await expect(page.getByText("Declined.")).toBeVisible();
    await expect(lampCard(page).getByText("You're gifting this")).toBeVisible();
    await expect(lampCard(page).getByText("asks you to free")).toHaveCount(0);

    await signInAs("tok-ann");
    await page.goto(LIST);
    await expect(
      lampCard(page).getByText("Claimed by Bob Buyer"),
    ).toBeVisible();
    // The declined request is over, so Ann can ask again.
    await expect(
      page.getByRole("button", { name: "Ask to free" }),
    ).toBeVisible();
  });

  test("Ann takes her request back", async ({ page, signInAs }) => {
    await signInAs("tok-ann");
    await page.goto(LIST);
    await page.getByRole("button", { name: "Ask to share" }).click();

    await page.getByRole("button", { name: "Asked to share · Cancel" }).click();

    await expect(
      page.getByRole("button", { name: "Ask to share" }),
    ).toBeVisible();
    await signInAs("tok-bob");
    await page.goto(LIST);
    await expect(lampCard(page).getByText("asks to share")).toHaveCount(0);
  });

  test("the owner never sees requests or who made them", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-ann");
    await page.goto(LIST);
    await page.getByRole("button", { name: "Ask to free" }).click();
    await expect(page.getByText("Request sent.")).toBeVisible();

    // The owner must not see reservations or requests (the surprise).
    await signInAs("tok-olga");
    await page.goto(LIST);

    await expect(page.getByText("asks you to free")).toHaveCount(0);
    await expect(page.getByText("Ann Guest")).toHaveCount(0);
  });

  test("the owner cannot ask for their own gifts", async ({
    page,
    signInAs,
  }) => {
    await signInAs("tok-olga");
    await page.goto(LIST);

    await expect(page.getByRole("button", { name: /Ask to/ })).toHaveCount(0);
  });
});
