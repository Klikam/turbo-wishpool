import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { getSessionSecret } from "@/lib/config";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type BackendTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type SessionPayload = {
  user: SessionUser;
  backendTokens: BackendTokens;
  error?: "RefreshTokenError";
};

export const SESSION_COOKIE = "session";

// 7 days
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE,
} as const;

async function getKey() {
  const secret = new TextEncoder().encode(getSessionSecret());
  return new Uint8Array(await crypto.subtle.digest("SHA-256", secret));
}

export async function encrypt(payload: SessionPayload) {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE.toString()}s`)
    .encrypt(await getKey());
}

export async function decrypt(token: string | undefined) {
  if (!token) return null;

  try {
    const { payload } = await jwtDecrypt<SessionPayload>(token, await getKey());
    return payload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await encrypt(payload), sessionCookieOptions);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
