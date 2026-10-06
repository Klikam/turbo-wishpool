import { getBackendUrl } from "@/lib/config";
import type { BackendTokens, SessionPayload } from "@/lib/session";

export function isAccessTokenExpired(session: SessionPayload) {
  return !(Date.now() < session.backendTokens.expiresAt);
}

export async function refreshBackendTokens(
  session: SessionPayload,
): Promise<SessionPayload> {
  try {
    const response = await fetch(`${getBackendUrl()}/auth/refresh`, {
      method: "POST",
      headers: {
        authorization: `Refresh ${session.backendTokens.refreshToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Refresh failed: ${response.status.toString()}`);
    }

    const refreshed = (await response.json()) as Pick<
      BackendTokens,
      "accessToken" | "expiresAt"
    >;

    return {
      ...session,
      backendTokens: { ...session.backendTokens, ...refreshed },
      error: undefined,
    };
  } catch (e) {
    console.error(e);
    return { ...session, error: "RefreshTokenError" };
  }
}

export async function revokeBackendSession(session: SessionPayload) {
  try {
    await fetch(`${getBackendUrl()}/auth/logout`, {
      method: "POST",
      headers: {
        authorization: `Refresh ${session.backendTokens.refreshToken}`,
      },
    });
  } catch (e) {
    console.error(e);
  }
}
