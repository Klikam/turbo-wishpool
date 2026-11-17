import type { RegisterCredentials, SignInCredentials } from "@repo/types";
import { authClient } from "@/lib/auth-client";

type LoginResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN = 403;
const TOO_MANY_REQUESTS = 429;

// Where the user lands signed in, unless a caller asks for somewhere else
// (e.g. back to a shared wishlist). Also the target of the verification email.
export const DEFAULT_CALLBACK_URL = "/dashboard";

/** Creates the account and emails a verification link; nobody is signed in yet. */
export const register = async (
  credentials: RegisterCredentials,
  callbackURL = DEFAULT_CALLBACK_URL,
) => {
  const { error } = await authClient.signUp.email({
    name: credentials.name,
    email: credentials.email,
    password: credentials.password,
    callbackURL,
  });

  if (error) throw new Error(error.message ?? "Registration failed");
};

export async function login(
  credentials: SignInCredentials,
  callbackURL = DEFAULT_CALLBACK_URL,
): Promise<LoginResult> {
  const { error } = await authClient.signIn.email({
    email: credentials.email,
    password: credentials.password,
    callbackURL,
  });

  if (!error) return { ok: true };

  // The backend has just sent a fresh verification link.
  if (error.status === FORBIDDEN) {
    return {
      ok: false,
      error: "Please verify your email first. We've sent you a new link.",
    };
  }

  if (error.status === TOO_MANY_REQUESTS) {
    return { ok: false, error: "Too many attempts, try again in a minute" };
  }

  return { ok: false, error: "Invalid credentials" };
}

export type SocialProvider = "google" | "facebook";

/**
 * Sends the browser to the provider's consent screen. On success the user
 * comes back signed in on `callbackURL`; on failure, on / with `?error=`.
 */
export async function socialSignIn(
  provider: SocialProvider,
  callbackURL = DEFAULT_CALLBACK_URL,
) {
  const { error } = await authClient.signIn.social({
    provider,
    callbackURL,
    errorCallbackURL: "/",
  });

  if (error) throw new Error(error.message ?? "Sign-in failed");
}

export async function logout() {
  await authClient.signOut();
}
