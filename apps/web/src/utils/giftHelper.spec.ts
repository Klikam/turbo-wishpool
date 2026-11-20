import { describe, expect, it } from "vitest";
import {
  emptyToNull,
  formatPrice,
  normalizeUrl,
  parsePrice,
} from "./giftHelper";

describe("parsePrice", () => {
  it.each([
    ["49.90", 49.9],
    ["49,90", 49.9],
    ["€ 49,90", 49.9],
    ["1.299,00", 1299],
    ["1,299.00", 1299],
    ["1 299", 1299],
    ["1,299", 1299],
    ["12", 12],
    ["0,5", 0.5],
    [".5", 0.5],
    ["PLN 1 299,99 zł", 1299.99],
  ])("%j -> %d", (input, expected) => {
    expect(parsePrice(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "€"])("returns null for %j", (input) => {
    expect(parsePrice(input)).toBeNull();
  });
});

describe("emptyToNull", () => {
  it("stores blank input as null and trims the rest", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull("   ")).toBeNull();
    expect(emptyToNull("  hello ")).toBe("hello");
  });
});

describe("normalizeUrl", () => {
  it("adds https:// to a bare address", () => {
    expect(normalizeUrl("shop.com/item")).toBe("https://shop.com/item");
    expect(normalizeUrl("  shop.com ")).toBe("https://shop.com");
  });

  it("leaves addresses that have a scheme to the backend to judge", () => {
    expect(normalizeUrl("http://shop.com")).toBe("http://shop.com");
    expect(normalizeUrl("HTTPS://shop.com")).toBe("HTTPS://shop.com");
    expect(normalizeUrl("ftp://shop.com")).toBe("ftp://shop.com");
  });

  it("returns null for blank input", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("  ")).toBeNull();
  });
});

describe("formatPrice", () => {
  it("formats in the wishlist currency", () => {
    const text = formatPrice(1299, "PLN");

    expect(text).toContain("1,299.00");
    expect(text).toMatch(/PLN|zł/);
  });

  it("shows two decimals", () => {
    expect(formatPrice(5, "EUR")).toContain("5.00");
  });
});
