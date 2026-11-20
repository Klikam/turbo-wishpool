import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WishlistHero } from "./WishlistHero";

function setup(isPast?: boolean) {
  render(
    <WishlistHero
      occasion="Birthday"
      title="Olga turns 30"
      giftsCount={2}
      isOwner={false}
      isPast={isPast}
    />,
  );
}

describe("WishlistHero", () => {
  it("shows a Past badge for a list that has ended", () => {
    setup(true);

    expect(screen.getByText("Past")).toBeInTheDocument();
  });

  it("has no badge for a list that is still open", () => {
    setup(false);

    expect(screen.queryByText("Past")).not.toBeInTheDocument();
  });
});
