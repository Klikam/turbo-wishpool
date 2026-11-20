import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "./loading";

describe("wishlist loading skeleton", () => {
  it("tells screen readers that the wishlist is loading", () => {
    render(<Loading />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading wishlist…");
  });

  it("shows placeholders for the gifts, hidden from screen readers", () => {
    const { container } = render(<Loading />);

    const placeholders = container.querySelectorAll(
      "[aria-hidden] .animate-pulse",
    );
    expect(placeholders.length).toBeGreaterThan(3);
  });
});
