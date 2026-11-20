import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Styles are imported for the real page; not needed to check the content.
vi.mock("./globals.css", () => ({}));

import GlobalError from "./global-error";

describe("GlobalError", () => {
  const markup = renderToStaticMarkup(
    <GlobalError error={new Error("boom")} retry={vi.fn()} />,
  );

  it("brings its own document, since it replaces the root layout", () => {
    expect(markup).toMatch(/^<html lang="en">/);
    expect(markup).toContain("<body");
  });

  it("says what happened without leaking the error", () => {
    expect(markup).toContain("Something went wrong");
    expect(markup).not.toContain("boom");
  });

  it("offers to try again, and a plain link home that works without the router", () => {
    expect(markup).toContain("Try again");
    expect(markup).toMatch(/<a [^>]*href="\/"[^>]*>Go to Wishpool<\/a>/);
  });
});
