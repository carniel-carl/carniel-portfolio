"use client";

import "./globals.css";
import { useEffect } from "react";
import { trackEvent } from "@/lib/mixpanel";

// Last-resort fallback when the root layout itself fails. It replaces the
// whole document, so it keeps to plain markup and the global styles.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    trackEvent("Global Error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="grid min-h-[100dvh] place-items-center bg-background px-6 font-sans text-foreground antialiased">
        <title>Something went wrong</title>
        <main className="flex max-w-xl flex-col gap-6">
          <p className="font-mono text-sm uppercase tracking-[0.14em] text-foreground/60">
            Something broke
          </p>
          <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
            The site didn&apos;t load
          </h1>
          <p className="text-lg text-foreground/70">
            Try again in a moment. If it keeps happening, the problem is on my
            side, not yours.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="h-12 rounded-full bg-accent px-6 font-medium text-accent-on transition-transform active:scale-[0.97]"
            >
              Try again
            </button>
            {/* Plain <a>: a full reload is the point when the app shell failed */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="grid h-12 place-items-center rounded-full border border-foreground/20 px-6 font-medium"
            >
              Back home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
