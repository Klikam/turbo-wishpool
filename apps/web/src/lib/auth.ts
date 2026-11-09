import type { RegisterCredentials, SignInCredentials } from "@repo/types";
import { authClient } from "@/lib/auth-client";

type LoginResult = { ok: true } | { ok: false; error: string };

const FORBIDDEN = 403;
const TOO_MANY_REQUESTS = 429;

// Where the link in the verification email sends the user, signed in.
const VERIFIED_CALLBACK_URL = "/dashboard";

/** Creates the account and emails a verification link; nobody is signed in yet. */
export const register = async (credentials: RegisterCredentials) => {
  const { error } = await authClient.signUp.email({
    name: credentials.name,
    email: credentials.email,
    password: credentials.password,
    callbackURL: VERIFIED_CALLBACK_URL,
  });

  if (error) throw new Error(error.message ?? "Registration failed");
};

export async function login(
  credentials: SignInCredentials,
): Promise<LoginResult> {
  const { error } = await authClient.signIn.email({
    email: credentials.email,
    password: credentials.password,
    callbackURL: VERIFIED_CALLBACK_URL,
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

export async function logout() {
  await authClient.signOut();
}
