import { NextResponse, type NextRequest } from "next/server";
import { isAccessTokenExpired, refreshBackendTokens } from "@/lib/backend";
import {
  decrypt,
  encrypt,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

const protectedRoutes = ["/dashboard", "/create"];

function signOut(req: NextRequest, isProtected: boolean) {
  const res = isProtected
    ? NextResponse.redirect(new URL("/", req.nextUrl))
    : NextResponse.next();
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export async function proxy(req: NextRequest) {
  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );
  const session = await decrypt(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    return isProtected
      ? NextResponse.redirect(new URL("/", req.nextUrl))
      : NextResponse.next();
  }

  if (session.error) return signOut(req, isProtected);

  if (!isAccessTokenExpired(session)) return NextResponse.next();

  const refreshed = await refreshBackendTokens(session);

  if (refreshed.error) return signOut(req, isProtected);

  const sessionToken = await encrypt(refreshed);

  req.cookies.set(SESSION_COOKIE, sessionToken);
  const res = NextResponse.next({ request: { headers: req.headers } });

  res.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);

  return res;
}

export const config = {
  matcher: ["/((?!api/|backend/|_next/static/|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
