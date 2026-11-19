import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { NEXT_PARAM } from "@/utils/redirectHelper";

const protectedRoutes = ["/dashboard", "/create", "/account"];
// The wishlist page itself isn't redirected: link-preview bots must reach its
// metadata, and it asks signed-out visitors to sign in itself.
const EDIT_WISHLIST_ROUTE = /^\/wishlist\/[^/]+\/edit\/?$/;

// Only checks that a session cookie exists; the session itself is validated
// against the backend by `verifySession` in the page.
export function proxy(req: NextRequest) {
  const isProtected =
    protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route)) ||
    EDIT_WISHLIST_ROUTE.test(req.nextUrl.pathname);

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/static/|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
