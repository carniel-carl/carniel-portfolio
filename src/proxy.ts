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
  matcher: [
    "/admin/:path*",
    // The proxy is a function invocation (billed as Fluid Active CPU) on every
    // match, <Link> prefetches included. Only kids need turning away, so the
    // pages kids mode closes match only when the audience cookie says "kid";
    // everyone else gets the cached page from the CDN without a function.
    // Must stay literal (read statically at build time): the cookie name is
    // AUDIENCE_COOKIE and the paths mirror isClosedToKids in lib/audience.ts.
    { source: "/", has: [{ type: "cookie", key: "audience", value: "kid" }] },
    { source: "/portfolio", has: [{ type: "cookie", key: "audience", value: "kid" }] },
    { source: "/resume", has: [{ type: "cookie", key: "audience", value: "kid" }] },
    { source: "/work", has: [{ type: "cookie", key: "audience", value: "kid" }] },
    { source: "/work/:path*", has: [{ type: "cookie", key: "audience", value: "kid" }] },
  ],
};
