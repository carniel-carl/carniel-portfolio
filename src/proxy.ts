import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { AUDIENCE_COOKIE, isClosedToKids, KIDS_HOME } from "@/lib/audience";

// Session check only: the JWT-only config keeps Prisma out of the proxy bundle
const { auth } = NextAuth(authConfig);

async function checkAuth(request: NextRequest) {
  try {
    const session = await auth();
    // A signed-in non-admin is treated as signed out for /admin
    return { isAuthenticated: !!session?.user?.isAdmin, session };
  } catch {
    return { isAuthenticated: false, session: null };
  }
}

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Kids mode: the portfolio pages are matched only to turn kids away
  // before anything renders. Everyone else passes straight through.
  if (!nextUrl.pathname.startsWith("/admin")) {
    const isKid = request.cookies.get(AUDIENCE_COOKIE)?.value === "kid";
    if (isKid && isClosedToKids(nextUrl.pathname)) {
      return NextResponse.redirect(new URL(KIDS_HOME, nextUrl));
    }
    return NextResponse.next();
  }

  const { isAuthenticated } = await checkAuth(request);

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isLoginPage = nextUrl.pathname === "/admin/login";
  const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

  if (isAuthApi) return NextResponse.next();

  if (isLoginPage) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    return NextResponse.next();
  }

  if (isAdminRoute && !isAuthenticated) {
    // Remember deep links (e.g. the OAuth consent screen) for after sign-in
    const login = new URL("/admin/login", nextUrl);
    if (nextUrl.pathname !== "/admin") {
      login.searchParams.set("next", nextUrl.pathname + nextUrl.search);
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  // Keep in step with isClosedToKids in lib/audience.ts
  matcher: ["/admin/:path*", "/", "/portfolio", "/resume", "/work", "/work/:path*"],
};
