import type { RegisterCredentials, SignInCredentials } from "@repo/types";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_CALLBACK_URL } from "@/utils/redirectHelper";

type AuthResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN = 403;
const TOO_MANY_REQUESTS = 429;

/**
 * Creates the account and emails a verification link; nobody is signed in yet.
 * An already registered email also succeeds (better-auth answers generically
 * so the form can't be used to find out who has an account).
 */
export async function register(
  credentials: RegisterCredentials,
  callbackURL = DEFAULT_CALLBACK_URL,
): Promise<AuthResult> {
  const { error } = await authClient.signUp.email({
    name: credentials.name,
    email: credentials.email,
    password: credentials.password,
    callbackURL,
  });

  if (!error) return { ok: true };

  if (error.status === TOO_MANY_REQUESTS) {
    return { ok: false, error: "Too many attempts, try again in a minute" };
  }

  return {
    ok: false,
    error: error.message ?? "Registration failed. Please try again.",
  };
}

export async function login(
  credentials: SignInCredentials,
  callbackURL = DEFAULT_CALLBACK_URL,
): Promise<AuthResult> {
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

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string; needsRecentSignIn?: boolean };

/**
 * Deletes the signed-in user's account and everything in it. The backend
 * wants the password, or for accounts without one a sign-in from the last
 * day (`needsRecentSignIn` otherwise).
 */
export async function deleteAccount(
  password?: string,
): Promise<DeleteAccountResult> {
  const { error } = await authClient.deleteUser(password ? { password } : {});

  if (!error) return { ok: true };

  if (error.code === "INVALID_PASSWORD") {
    return { ok: false, error: "That password isn't right." };
  }

  if (error.code === "SESSION_EXPIRED" || error.code === "SESSION_NOT_FRESH") {
    return {
      ok: false,
      needsRecentSignIn: true,
      error: "For your safety, sign in again, then delete your account.",
    };
  }

  if (error.status === TOO_MANY_REQUESTS) {
    return { ok: false, error: "Too many attempts, try again in a minute" };
  }

  return {
    ok: false,
    error: "Your account couldn't be deleted. Please try again.",
  };
}
