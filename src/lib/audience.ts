// Kids mode: shared by the proxy (server), the pre-paint script in the root
// layout and the client components, so it stays free of Prisma and React.
//
// A reader of a kids series picks "kid" or "grown-up" once per browser
// session. The answer lives in a session cookie (no Max-Age, so it ends when
// the browser closes) rather than sessionStorage: a cookie is shared by every
// tab and reaches the proxy, which turns kids away from the portfolio pages
// before anything renders.
import routes from "@/lib/routes";

export const AUDIENCE_COOKIE = "audience";
export type Audience = "kid" | "adult";

export const isAudience = (value: unknown): value is Audience =>
  value === "kid" || value === "adult";

/** Where a kid lands when they reach a page kids mode closes */
export const KIDS_HOME = routes.public.blogSeries;

/**
 * Pages kids mode closes: the portfolio (home, /portfolio, case studies with
 * their live and code links) and the resume download. Contact lives on the
 * portfolio page, so it closes with it.
 */
export function isClosedToKids(pathname: string) {
  return (
    pathname === routes.public.home ||
    pathname === routes.public.portfolio ||
    pathname === "/resume" ||
    pathname === "/work" ||
    pathname.startsWith("/work/")
  );
}

/**
 * Runs inline at the top of <body>, before anything paints: mirrors the cookie onto
 * <html data-audience>, so CSS hides adult-only links before React hydrates.
 */
export const AUDIENCE_SCRIPT = `try{var m=document.cookie.match(/(?:^|; )${AUDIENCE_COOKIE}=(kid|adult)(?:;|$)/);if(m)document.documentElement.dataset.audience=m[1]}catch(e){}`;
