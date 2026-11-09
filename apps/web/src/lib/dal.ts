import "server-only";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { cache } from "react";
import { getBackendUrl } from "@/lib/config";
import { SESSION_COOKIES, type SessionUser } from "@/lib/session";

type BackendSession = {
  user: { id: number | string; email: string; name: string };
} | null;

export const getOptionalSession = cache(async () => {
  const cookieStore = await cookies();
  const token = SESSION_COOKIES.map((name) => cookieStore.get(name)?.value).find(
    Boolean,
  );

  if (!token) return null;

  // The session token doubles as the bearer token for the backend API.
  const response = await fetch(`${getBackendUrl()}/api/auth/get-session`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return null;

  const session = (await response.json()) as BackendSession;
  if (!session) return null;

  const user: SessionUser = {
    id: String(session.user.id),
    email: session.user.email,
    name: session.user.name,
  };

  return { user, accessToken: token };
});

export const verifySession = cache(async () => {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/");
  }

  return session;
});
