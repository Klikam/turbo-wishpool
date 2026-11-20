import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
const auth = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth", () => auth);

import CredentialsPage from "./CredentialsPage";

beforeEach(() => vi.resetAllMocks());

function setup(callbackURL?: string) {
  const { container } = render(<CredentialsPage callbackURL={callbackURL} />);
  return {
    user: userEvent.setup(),
    // "Sign in" is also the name of the tab, so the submit button is found by type.
    submit: () =>
      container.querySelector<HTMLButtonElement>("button[type=submit]")!,
  };
}

describe("CredentialsPage", () => {
  it("signs in and goes to the callback page", async () => {
    auth.login.mockResolvedValue({ ok: true });
    const { user, submit } = setup("/wishlist/42");

    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(submit());

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/wishlist/42"),
    );
    expect(auth.login).toHaveBeenCalledWith(
      { email: "ann@example.com", password: "secret123" },
      "/wishlist/42",
    );
    expect(router.refresh).toHaveBeenCalled();
  });

  it("shows the error of a failed sign in and stays on the page", async () => {
    auth.login.mockResolvedValue({ ok: false, error: "Invalid credentials" });
    const { user, submit } = setup();

    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass1");
    await user.click(submit());

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
    expect(submit()).toBeEnabled();
  });

  it("validates before calling the backend", async () => {
    const { user, submit } = setup();

    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.click(submit());

    expect(
      await screen.findByText("Password must contain at least 8 characters"),
    ).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("registers, then asks the user to verify their email on the sign-in tab", async () => {
    auth.register.mockResolvedValue({ ok: true });
    const { user, submit } = setup();

    await user.click(screen.getByRole("button", { name: "Register" }));
    await user.type(screen.getByLabelText("Full name"), "Ann Lee");
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(submit());

    expect(await screen.findByRole("status")).toHaveTextContent(
      "We sent a verification link to ann@example.com",
    );
    expect(auth.register).toHaveBeenCalledWith(
      { name: "Ann Lee", email: "ann@example.com", password: "secret123" },
      "/dashboard",
    );
    expect(screen.queryByLabelText("Full name")).not.toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("requires a name only when registering", async () => {
    const { user, submit } = setup();

    await user.click(screen.getByRole("button", { name: "Register" }));
    await user.type(screen.getByLabelText("Full name"), "A");
    await user.type(screen.getByLabelText("Email"), "ann@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(submit());

    expect(
      await screen.findByText("Name must contain at least 2 characters"),
    ).toBeInTheDocument();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it("offers password recovery on the sign-in tab only", async () => {
    const { user } = setup();
    expect(
      screen.getByRole("link", { name: "Forgot password?" }),
    ).toHaveAttribute("href", "/forgot-password");

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(
      screen.queryByRole("link", { name: "Forgot password?" }),
    ).not.toBeInTheDocument();
  });
});
