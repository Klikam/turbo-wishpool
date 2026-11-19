import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  GUEST_TOKEN_COOKIE,
  GUEST_TOKEN_MAX_AGE,
  generateGuestToken,
} from "@/lib/guestToken";
import { NEXT_PARAM } from "@/utils/redirectHelper";

const protectedRoutes = ["/dashboard", "/create"];

// Only checks that a session cookie exists; the session itself is validated
// against the backend by `verifySession` in the page.
export function proxy(req: NextRequest) {
  const isProtected = protectedRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );

  if (isProtected && !getSessionCookie(req)) {
    const home = new URL("/", req.nextUrl);
    // A failed email-verification link lands on /dashboard?error=...; keep
    // the error so the landing page can explain it.
    const error = req.nextUrl.searchParams.get("error");
    if (error) home.searchParams.set("error", error);
    // Come back here after signing in; the dashboard is the default anyway.
    if (req.nextUrl.pathname !== "/dashboard") {
      home.searchParams.set(
        NEXT_PARAM,
        req.nextUrl.pathname + req.nextUrl.search,
      );
    }
    return NextResponse.redirect(home);
  }

  if (
    req.nextUrl.pathname.startsWith("/wishlist/") &&
    !req.cookies.has(GUEST_TOKEN_COOKIE)
  ) {
    return withGuestToken(req);
  }

  return NextResponse.next();
}

/**
 * Gives a first-time visitor a guest token, visible to the page rendering
 * this same request as well as stored in the browser.
 */
function withGuestToken(req: NextRequest) {
  const token = generateGuestToken();
  req.cookies.set(GUEST_TOKEN_COOKIE, token);

  const res = NextResponse.next({ request: { headers: req.headers } });
  res.cookies.set(GUEST_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_TOKEN_MAX_AGE,
  });
  return res;
}

export const config = {
  matcher: ["/((?!api/|_next/static/|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
