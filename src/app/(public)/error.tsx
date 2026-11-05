"use client";

import { useEffect } from "react";
import { ArrowUpRight, RotateCw } from "lucide-react";
import PillLink, {
  PillIcon,
  RollingLabel,
  pillClasses,
} from "@/components/motion/PillLink";
import StatusPage from "@/components/layout/StatusPage";
import { trackEvent } from "@/lib/mixpanel";
import routes from "@/lib/routes";

// Error boundary for public pages. The header and footer stay in place,
// and retry re-fetches the page instead of forcing a full reload.
export default function PublicError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // The digest matches the server log entry for errors thrown on the server
    trackEvent("Page Error", {
      message: error.message,
      digest: error.digest,
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <StatusPage
      code="500"
      eyebrow="Something broke"
      title="This page didn't load"
      description={
        <>
          It&apos;s a problem on my side, not yours. Try again, and if it keeps
          happening, the rest of the site should still work.
          {error.digest && (
            <span className="mt-3 block font-mono text-sm text-foreground/45">
              Ref: {error.digest}
            </span>
          )}
        </>
      }
      actions={
        <>
          <button
            type="button"
            onClick={() => unstable_retry()}
            className={pillClasses("solid")}
          >
            <RollingLabel>Try again</RollingLabel>
            <PillIcon>
              <RotateCw />
            </PillIcon>
          </button>
          <PillLink href={routes.public.home} variant="ghost" icon={<ArrowUpRight />}>
            Back home
          </PillLink>
        </>
      }
    />
  );
}
