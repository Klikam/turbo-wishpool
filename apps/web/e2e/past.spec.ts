import { expect, test, WISHLIST_ID } from "./fixtures";

const LIST = `/wishlist/${WISHLIST_ID}`;
const STUB = "http://127.0.0.1:4010";

/** Changes the seed wishlist as its owner, behind the UI's back. */
async function patchList(
  request: import("@playwright/test").APIRequestContext,
  body: Record<string, unknown>,
) {
  const response = await request.patch(`${STUB}/wishlists/${WISHLIST_ID}`, {
    headers: { Authorization: "Bearer tok-olga" },
    data: body,
  });
  expect(response.ok()).toBe(true);
}

test.describe("past wishlists: owner", () => {
  test.beforeEach(async ({ signInAs }) => {
    await signInAs("tok-olga");
  });

  test("marks a list as past, and reopens it", async ({ page }) => {
    await page.goto(LIST);
    await expect(page.getByRole("status")).toHaveCount(0);

    await page.getByRole("button", { name: "Mark as past" }).click();

    const banner = page.getByRole("status");
    await expect(banner).toContainText("You marked this list as past");
    await expect(page.getByText("Past", { exact: true })).toBeVisible();
    // Nothing to mark any more.
    await expect(
      page.getByRole("button", { name: "Mark as past" }),
    ).toHaveCount(0);

    await banner.getByRole("button", { name: "Reopen" }).click();

    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(page.getByText("Past", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Mark as past" }),
    ).toBeVisible();
  });

  test("can still add gifts to a past list", async ({ page, request }) => {
    await patchList(request, { closed: true });
    await page.goto(LIST);

    await page.getByRole("button", { name: "Add gift" }).click();
    await page.getByLabel("Gift name *").fill("Souvenir");
    await page.getByLabel("Gift name *").press("Enter");

    await expect(
      page.getByRole("heading", { name: "Souvenir" }),
    ).toBeVisible();
  });

  test("a list whose date has passed explains how to open it again", async ({
    page,
    request,
  }) => {
    await patchList(request, { date: "2020-05-01" });
    await page.goto(LIST);

    const banner = page.getByRole("status");
    await expect(banner).toContainText("The date of this list has passed");
    // Closing it was never done, so there is nothing to reopen.
    await expect(banner.getByRole("button", { name: "Reopen" })).toHaveCount(0);

    await banner.getByRole("link", { name: "Change date" }).click();
    await expect(page).toHaveURL(new RegExp(`${LIST}/edit$`));
  });

  test("moving the date to the future opens a list whose date had passed", async ({
    page,
    request,
  }) => {
    await patchList(request, { date: "2020-05-01" });
    await page.goto(`${LIST}/edit`);

    await page.getByLabel("Date of occasion").fill("2099-12-31");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    await expect(page.getByRole("status")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Mark as past" }),
    ).toBeVisible();
  });

  test("editing a closed list keeps it closed", async ({ page, request }) => {
    await patchList(request, { closed: true });
    await page.goto(`${LIST}/edit`);

    await page.getByLabel("List title *").fill("Olga turned 30");
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(new RegExp(`${LIST}$`));
    await expect(page.getByRole("status")).toContainText(
      "You marked this list as past",
    );
  });

  test("shows past lists last on the dashboard, marked as past", async ({
    page,
    request,
  }) => {
    await patchList(request, { closed: true });
    await request.post(`${STUB}/wishlists`, {
      headers: { Authorization: "Bearer tok-olga" },
      data: { title: "Upcoming party", occasion: "other" },
    });

    await page.goto("/dashboard");

    await expect(page.locator("h2")).toHaveText([
      "Upcoming party",
      "Olga turns 30",
    ]);
    const past = page.locator("div.rounded-2xl", {
      has: page.getByRole("heading", { name: "Olga turns 30" }),
    });
    await expect(past.getByText("Past", { exact: true })).toBeVisible();
    const open = page.locator("div.rounded-2xl", {
      has: page.getByRole("heading", { name: "Upcoming party" }),
    });
    await expect(open.getByText("Past", { exact: true })).toHaveCount(0);
  });
});

test.describe("past wishlists: visitors", () => {
  test.beforeEach(async ({ signInAs }) => {
    await signInAs("tok-ann");
  });

  test("see the list but cannot claim, ask or answer", async ({
    page,
    request,
  }) => {
    await patchList(request, { closed: true });
    await page.goto(LIST);

    await expect(page.getByRole("status")).toContainText(
      "This wishlist is in the past",
    );
    await expect(page.getByText("Past", { exact: true })).toBeVisible();
    // The gifts are still there, and who has claimed what is still shown...
    await expect(
      page.getByRole("heading", { name: "Headphones" }),
    ).toBeVisible();
    await expect(page.getByText("Claimed by Bob Buyer")).toBeVisible();
    // ...but every action is gone.
    await expect(
      page.getByRole("button", { name: "I'll gift this" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Ask to (free|share)/ }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Undo" })).toHaveCount(0);
  });

  test("cannot claim a gift on a list whose date has passed", async ({
    page,
    request,
  }) => {
    await patchList(request, { date: "2020-05-01" });
    await page.goto(LIST);

    await expect(page.getByRole("status")).toContainText(
      "This wishlist is in the past",
    );
    await expect(
      page.getByRole("button", { name: "I'll gift this" }),
    ).toHaveCount(0);
  });

  test("the backend refuses a claim even if the page is stale", async ({
    page,
    request,
  }) => {
    // The page was opened while the list was still open...
    await page.goto(LIST);
    const claim = page.getByRole("button", { name: "I'll gift this" });
    await expect(claim).toBeVisible();

    // ...and the owner closed it meanwhile.
    await patchList(request, { closed: true });
    await claim.click();

    await expect(
      page.getByText(/in the past, so gifts can no longer be changed/),
    ).toBeVisible();
  });

  test("can claim again once the owner reopens the list", async ({
    page,
    request,
  }) => {
    await patchList(request, { closed: true });
    await patchList(request, { closed: false });
    await page.goto(LIST);

    await page.getByRole("button", { name: "I'll gift this" }).click();

    await expect(page.getByRole("button", { name: "Undo" })).toBeVisible();
  });
});
