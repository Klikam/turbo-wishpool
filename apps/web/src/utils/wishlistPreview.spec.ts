import { describe, expect, it } from "vitest";
import { wishlistPreview } from "./wishlistPreview";

const base = {
  id: "1",
  title: "Emma turns 30",
  occasion: "birthday" as const,
  date: "2026-11-14",
  ownerName: "Emma Thornton",
  isPast: false,
};

describe("wishlistPreview", () => {
  it("describes the list without revealing gifts", () => {
    const preview = wishlistPreview(base);

    expect(preview).toMatchObject({
      title: "Emma turns 30",
      occasion: "Birthday",
      details: "Emma Thornton · 14 November 2026",
    });
    expect(preview.description).toContain("Emma Thornton's wishlist");
  });

  it("formats a date-only string in UTC, whatever the server time zone", () => {
    expect(wishlistPreview({ ...base, date: "2026-01-01" }).details).toBe(
      "Emma Thornton · 1 January 2026",
    );
  });

  it('leaves out a missing date, and labels a missing occasion "Other"', () => {
    const preview = wishlistPreview({ ...base, date: null, occasion: null });

    expect(preview.details).toBe("Emma Thornton");
    expect(preview.occasion).toBe("Other");
  });
});
