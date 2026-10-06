import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { isAccessTokenExpired, refreshBackendTokens } from "@/lib/backend";
import { getSession } from "@/lib/session";

export const getOptionalSession = cache(async () => {
  let session = await getSession();

  if (!session || session.error) return null;

  if (isAccessTokenExpired(session)) {
    session = await refreshBackendTokens(session);
    if (session.error) return null;
  }

  return {
    user: session.user,
    accessToken: session.backendTokens.accessToken,
  };
});

export const verifySession = cache(async () => {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/");
  }

  return session;
});
