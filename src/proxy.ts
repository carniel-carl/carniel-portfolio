import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

async function checkAuth(request: NextRequest) {
  try {
    const session = await auth();
    return { isAuthenticated: !!session, session };
  } catch {
    return { isAuthenticated: false, session: null };
  }
}

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
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
  matcher: ["/admin/:path*"],
};
