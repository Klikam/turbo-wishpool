import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({ getWishlistPreview: vi.fn() }));
vi.mock("@/actions/wishlists", () => actions);

// Like Next, notFound() throws to stop rendering.
const NOT_FOUND = new Error("NEXT_NOT_FOUND");
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw NOT_FOUND;
  },
}));

import WishlistViewLayout from "./layout";

beforeEach(() => vi.resetAllMocks());

const render = (id = "abc") =>
  WishlistViewLayout({
    children: "page",
    params: Promise.resolve({ id }),
  });

describe("WishlistViewLayout", () => {
  it("renders the page for a list that exists", async () => {
    actions.getWishlistPreview.mockResolvedValue({ id: "abc" });

    await expect(render()).resolves.toBe("page");
    expect(actions.getWishlistPreview).toHaveBeenCalledWith("abc");
  });

  it("answers not found before anything streams when the list is missing", async () => {
    actions.getWishlistPreview.mockResolvedValue(null);

    await expect(render("gone")).rejects.toBe(NOT_FOUND);
  });
});
