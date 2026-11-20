import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// The sign-in form talks to the auth client; it is not what is tested here.
vi.mock("@/components/sections/SignInForm", () => ({
  SignInForm: () => <form aria-label="Sign in" />,
}));

import WishlistSignIn from "./WishlistSignIn";

const wishlist = {
  id: "1",
  title: "Olga turns 30",
  occasion: "birthday" as const,
  date: null,
  ownerName: "Olga Owner",
  isPast: false,
};

describe("WishlistSignIn", () => {
  it("invites a visitor to sign in and pick a gift", () => {
    render(<WishlistSignIn wishlist={wishlist} />);

    expect(
      screen.getByText(/Sign in to see Olga Owner's wishlist and pick a gift/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("says up front that a past list can no longer be claimed from", () => {
    render(<WishlistSignIn wishlist={{ ...wishlist, isPast: true }} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "This wishlist is in the past, so gifts can no longer be claimed.",
    );
    expect(
      screen.getByText(/Sign in to see Olga Owner's wishlist\./),
    ).toBeInTheDocument();
    expect(screen.queryByText(/pick a gift/)).not.toBeInTheDocument();
  });
});
