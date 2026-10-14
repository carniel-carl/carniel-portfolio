import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  FilePen,
  ImageUp,
  ShieldCheck,
} from "lucide-react";
import AuthShell, { AuthPortrait } from "@/components/admin/auth/AuthShell";
import { decideOAuthRequest } from "@/lib/actions/oauth";
import routes from "@/lib/routes";
import { parseAuthorizeRequest, type AuthorizeParams } from "@/lib/mcp/oauth";

// Consent screen for MCP connectors (Claude Cowork, Claude Desktop, ...).
// The proxy sends signed-out visitors to the login page first, then back here.

export const metadata: Metadata = { title: "Connect Claude" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const GRANTS = [
  {
    icon: FilePen,
    text: "Read your posts and categories, and write new drafts",
  },
  { icon: ImageUp, text: "Upload images for covers and post content" },
  { icon: ShieldCheck, text: "It can't publish anything or edit live posts" },
];

const heading =
  "mt-8 max-w-full text-balance break-words pb-1 font-display text-[clamp(2.75rem,8vw,4.75rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-foreground";

export default function AuthorizePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <AuthShell>
      <div className="flex w-full max-w-[34rem] flex-col items-center">
        <Suspense fallback={null}>
          <Consent searchParams={searchParams} />
        </Suspense>
      </div>
    </AuthShell>
  );
}

async function Consent({ searchParams }: { searchParams: SearchParams }) {
  // Repeated params would be ambiguous; keep only single values
  const params: AuthorizeParams = Object.fromEntries(
    Object.entries(await searchParams).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const parsed = await parseAuthorizeRequest(params);

  if (!parsed.ok) {
    return (
      <>
        <div className="auth-rise">
          <AuthPortrait />
        </div>
        <h1
          className={`auth-rise ${heading}`}
          style={{ animationDelay: "80ms" }}
        >
          Can&apos;t connect
        </h1>
        <p
          role="alert"
          className="auth-rise mt-6 inline-flex items-start gap-2 text-left text-[15px] leading-relaxed text-red-700 dark:text-red-400"
          style={{ animationDelay: "160ms" }}
        >
          <AlertCircle className="mt-1 size-4 shrink-0" />
          {parsed.error}
        </p>
        <p
          className="auth-rise mt-3 max-w-[40ch] text-[15px] leading-relaxed text-foreground/70 dark:text-muted-foreground"
          style={{ animationDelay: "200ms" }}
        >
          Nothing was shared. Remove the connector in Claude and add it again to
          start a fresh request.
        </p>
        <Link
          href={routes.admin.dashboard}
          className="auth-rise group mt-10 flex h-16 w-full max-w-[22rem] items-center justify-between rounded-full border border-foreground/15 bg-card pl-7 pr-2 text-[15px] font-semibold text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{ animationDelay: "260ms" }}
        >
          Back to the dashboard
          <span className="grid size-12 place-items-center rounded-full bg-accent text-[hsl(var(--on-accent))]">
            <ArrowRight className="size-5 transition-transform duration-300 ease-expo group-hover:translate-x-0.5" />
          </span>
        </Link>
      </>
    );
  }

  const { client, redirectUri } = parsed.request;

  return (
    <>
      {/* Owner on the left, the asking app on the right, joined by the request */}
      <div className="auth-rise flex items-center" aria-hidden="true">
        <AuthPortrait />
        <span className="mx-3 w-10 border-t-2 border-dashed border-[hsl(var(--accent)/0.6)] sm:w-14" />
        <span className="grid size-16 shrink-0 place-items-center rounded-full border border-foreground/15 bg-card font-display text-2xl font-semibold text-foreground">
          {client.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
      </div>

      <h1 className={`auth-rise ${heading}`} style={{ animationDelay: "80ms" }}>
        Connect {client.name}
      </h1>
      <p
        className="auth-rise mt-4 text-[15px] text-foreground/70 dark:text-muted-foreground sm:text-base"
        style={{ animationDelay: "140ms" }}
      >
        It&apos;s asking for access to your blog. If you allow it, it will be
        able to:
      </p>

      <ul
        className="auth-rise mt-9 w-full max-w-[26rem] space-y-3 text-left"
        style={{ animationDelay: "200ms" }}
      >
        {GRANTS.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3.5 text-[15px] leading-snug text-foreground"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-foreground/10 bg-card text-accent-ink">
              <Icon className="size-4" />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <form
        action={decideOAuthRequest}
        className="auth-rise mt-10 flex w-full flex-col items-center gap-3"
        style={{ animationDelay: "260ms" }}
      >
        {Object.entries(params)
          .filter(([name]) => name !== "decision")
          .map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        <button
          type="submit"
          name="decision"
          value="approve"
          className="group flex h-[4.5rem] w-full max-w-[26rem] items-center justify-between rounded-full bg-accent pl-7 pr-2 text-[17px] font-semibold text-[hsl(var(--on-accent))] shadow-[0_22px_60px_-28px_hsl(var(--accent)/0.6)] transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] sm:h-20"
        >
          Allow access
          <span className="grid size-14 place-items-center rounded-full bg-[hsl(var(--on-accent))] text-accent sm:size-16">
            <Check className="size-5 transition-transform duration-300 ease-expo group-hover:scale-110" />
          </span>
        </button>
        <button
          type="submit"
          name="decision"
          value="deny"
          className="h-14 w-full max-w-[22rem] rounded-full border border-dashed border-foreground/30 text-[15px] font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Deny
        </button>
      </form>

      <p
        className="auth-rise mt-8 max-w-[44ch] text-[13px] leading-relaxed text-foreground/70 dark:text-muted-foreground"
        style={{ animationDelay: "320ms" }}
      >
        You&apos;ll be sent back to {new URL(redirectUri).host}. To disconnect
        later, remove the connector in Claude, or change MCP_API_KEY to sign out
        every connection.
      </p>
    </>
  );
}
