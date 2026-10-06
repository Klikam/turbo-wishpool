"use server";

import { getCredentialsSchema, type SignInCredentials } from "@repo/types";
import { revokeBackendSession } from "@/lib/backend";
import { getBackendUrl } from "@/lib/config";
import {
  createSession,
  deleteSession,
  getSession,
  type BackendTokens,
} from "@/lib/session";

type BackendLoginResponse = {
  user: {
    id: number | string;
    email: string;
    name: string;
  };
  backendTokens: BackendTokens;
};

type LoginResult = { ok: true } | { ok: false; error: string };

export async function login(credentials: SignInCredentials): Promise<LoginResult> {
  const parsed = getCredentialsSchema("signin").safeParse(credentials);
  if (!parsed.success) return { ok: false, error: "Invalid credentials" };

  const response = await fetch(`${getBackendUrl()}/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      email: parsed.data.email,
      password: parsed.data.password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.status === 429) {
    return { ok: false, error: "Too many attempts, try again in a minute" };
  }

  if (!response.ok) return { ok: false, error: "Invalid credentials" };

  const data = (await response.json()) as BackendLoginResponse;

  await createSession({
    user: {
      id: String(data.user.id),
      email: data.user.email,
      name: data.user.name,
    },
    backendTokens: data.backendTokens,
  });

  return { ok: true };
}

export async function logout() {
  const session = await getSession();
  if (session) await revokeBackendSession(session);

  await deleteSession();
}
