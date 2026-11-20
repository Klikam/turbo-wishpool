import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WishlistCard } from "./WishlistCard";

function setup(isPast?: boolean) {
  render(
    <WishlistCard
      occasion="Birthday"
      title="Olga turns 30"
      giftsCount={2}
      isPast={isPast}
      onOpen={vi.fn()}
      onDelete={vi.fn()}
    />,
  );
}

describe("WishlistCard", () => {
  it("marks a past list", () => {
    setup(true);

    expect(screen.getByText("Past")).toBeInTheDocument();
  });

  it("does not mark a list that is still open", () => {
    setup(false);

    expect(screen.queryByText("Past")).not.toBeInTheDocument();
  });

  it("does not mark a list by default", () => {
    setup();

    expect(screen.queryByText("Past")).not.toBeInTheDocument();
  });
});
