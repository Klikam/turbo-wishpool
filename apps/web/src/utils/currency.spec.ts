import { describe, expect, it } from "vitest";
import {
  CURRENCIES,
  currencyFromAcceptLanguage,
  currencyLabel,
} from "./currency";

describe("currencyFromAcceptLanguage", () => {
  it.each([
    ["pl-PL,pl;q=0.9,en;q=0.8", "PLN"],
    ["en-US,en;q=0.9", "USD"],
    ["en-GB", "GBP"],
    ["de-CH", "CHF"],
    ["uk-UA", "UAH"],
    ["fr-CA", "CAD"],
  ])("%s -> %s", (header, currency) => {
    expect(currencyFromAcceptLanguage(header)).toBe(currency);
  });

  it("guesses the region of a bare language", () => {
    expect(currencyFromAcceptLanguage("pl")).toBe("PLN");
    expect(currencyFromAcceptLanguage("cs")).toBe("CZK");
  });

  it("uses the euro for euro countries and unknown regions", () => {
    expect(currencyFromAcceptLanguage("de-DE")).toBe("EUR");
    expect(currencyFromAcceptLanguage("ja-JP")).toBe("EUR");
  });

  it.each([null, "", "*", "not a tag!!", ";q=0.5"])(
    "falls back to EUR for %j",
    (header) => {
      expect(currencyFromAcceptLanguage(header)).toBe("EUR");
    },
  );

  it("only suggests currencies the create form offers", () => {
    for (const header of [
      "pl",
      "en-US",
      "en-GB",
      "de-CH",
      "sv",
      "nb-NO",
      "da",
      "hu",
      "ro",
      "uk",
      "en-CA",
      "en-AU",
    ]) {
      expect(CURRENCIES).toContain(currencyFromAcceptLanguage(header));
    }
  });
});

describe("currencyLabel", () => {
  it("adds the English name", () => {
    expect(currencyLabel("PLN")).toBe("PLN — Polish Zloty");
    expect(currencyLabel("EUR")).toBe("EUR — Euro");
  });
});
