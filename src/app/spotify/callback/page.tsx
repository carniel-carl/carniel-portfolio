"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiSpotify } from "react-icons/si";
import { completeSpotifySignIn } from "@/lib/spotify";

// Spotify redirects here after sign-in; exchange the code, then go back to
// the page the visitor came from (client-side, so the intro does not replay).
export default function SpotifyCallbackPage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    completeSpotifySignIn()
      .then(({ ok, returnTo }) => {
        if (ok) router.replace(returnTo);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [router]);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 text-foreground">
      <div className="flex flex-col items-center gap-5 text-center">
        <SiSpotify className="size-12 text-[#1DB954]" aria-hidden="true" />
        {failed ? (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">
              Couldn&apos;t connect to Spotify
            </h1>
            <p className="max-w-[40ch] text-foreground/70">
              The sign-in was cancelled or expired. You can try again from the
              music player.
            </p>
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="h-11 rounded-full bg-accent px-6 text-sm font-medium text-accent-on active:scale-[0.97]"
            >
              Back to the site
            </button>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-semibold tracking-[-0.02em]">
              Connecting to Spotify
            </h1>
            <p className="text-foreground/70">Taking you back in a moment.</p>
          </>
        )}
      </div>
    </main>
  );
}
