import type { Metadata } from "next";
import { Suspense } from "react";
import { AlertCircle, Check, FilePen, ImageUp, ShieldCheck } from "lucide-react";
import AuthShowcase from "@/components/admin/auth/AuthShowcase";
import { Button } from "@/components/ui/button";
import { decideOAuthRequest } from "@/lib/actions/oauth";
import { parseAuthorizeRequest, type AuthorizeParams } from "@/lib/mcp/oauth";

// Consent screen for MCP connectors (Claude Cowork, Claude Desktop, ...).
// The proxy sends signed-out visitors to the login page first, then back here.

export const metadata: Metadata = { title: "Connect Claude" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const GRANTS = [
  { icon: FilePen, text: "Read your posts and categories, and write new drafts" },
  { icon: ImageUp, text: "Upload images for covers and post content" },
  { icon: ShieldCheck, text: "It can't publish anything or edit live posts" },
];

export default function AuthorizePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="grid min-h-[100dvh] bg-background lg:h-[100dvh] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <AuthShowcase />
      <div className="flex min-h-[100dvh] flex-col px-5 sm:px-8 lg:min-h-0">
        <div className="mx-auto flex w-full max-w-[24rem] flex-1 flex-col justify-center py-16">
          <Suspense fallback={null}>
            <Consent searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
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
        <h1 className="pb-1 font-display text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground [font-stretch:75%]">
          Can&apos;t connect
        </h1>
        <p role="alert" className="mt-6 flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {parsed.error}
        </p>
      </>
    );
  }

  const { client, redirectUri } = parsed.request;

  return (
    <>
      <h1 className="pb-1 font-display text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.04em] text-foreground [font-stretch:75%]">
        Connect {client.name}
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        It&apos;s asking for access to your blog. If you allow it, it will be able to:
      </p>

      <ul className="mt-8 space-y-3">
        {GRANTS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-3 text-[15px] text-foreground">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            {text}
          </li>
        ))}
      </ul>

      <form action={decideOAuthRequest} className="mt-10 space-y-3">
        {Object.entries(params)
          .filter(([name]) => name !== "decision")
          .map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        <Button
          type="submit"
          name="decision"
          value="approve"
          className="group h-12 w-full rounded-full text-[15px] active:scale-[0.98]"
        >
          <Check />
          Allow access
        </Button>
        <Button
          type="submit"
          name="decision"
          value="deny"
          variant="ghost"
          className="h-12 w-full rounded-full text-[15px]"
        >
          Deny
        </Button>
      </form>

      <p className="mt-8 text-[13px] text-muted-foreground">
        You&apos;ll be sent back to {new URL(redirectUri).host}. To disconnect later, remove the connector in
        Claude, or change MCP_API_KEY to sign out every connection.
      </p>
    </>
  );
}
