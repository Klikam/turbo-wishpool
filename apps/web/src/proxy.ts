import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

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
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|backend/|_next/static/|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
