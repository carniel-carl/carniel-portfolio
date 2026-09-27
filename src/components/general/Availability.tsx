"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { AVAILABILITY, type ContactInfo } from "@/lib/availability";
import { trackEvent } from "@/lib/mixpanel";
import { cn } from "@/lib/utils";

// Surfaces: the page background, or the accent-filled footer
type Surface = "page" | "accent";

const formatTime = (timezone: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

// "Lagos" from "Africa/Lagos", "New York" from "America/New_York"
const cityOf = (timezone: string) =>
  timezone.split("/").pop()?.replace(/_/g, " ") ?? timezone;

// Client-only clock (the server can't know the right minute at view time).
// Ticks on the minute boundary so it never drifts.
export function LocalTime({ timezone }: { timezone: string }) {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setTime(formatTime(timezone));
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000));
    };
    tick();
    return () => clearTimeout(timer);
  }, [timezone]);

  return (
    <span className="tabular-nums">
      {cityOf(timezone)} <span aria-hidden="true">·</span>{" "}
      {/* Reserve the width so the line doesn't jump when the time arrives */}
      <time className="inline-block min-w-[5ch]">{time ?? " "}</time>
    </span>
  );
}

export function AvailabilityBadge({
  info,
  surface = "page",
  showTime = true,
  className,
}: {
  info: ContactInfo;
  surface?: Surface;
  showTime?: boolean;
  className?: string;
}) {
  if (!info.availability) return null;
  const status = AVAILABILITY[info.availability];

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm",
        surface === "page" ? "text-foreground/70" : "text-accent-on/80",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 font-medium">
        <span className="relative flex size-2">
          {status.pulse && (
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-0 animate-ping rounded-full opacity-60 motion-reduce:hidden",
                surface === "page" ? status.tone : "bg-accent-on",
              )}
            />
          )}
          <span
            aria-hidden="true"
            className={cn(
              "relative size-2 rounded-full",
              surface === "page" ? status.tone : "bg-accent-on",
            )}
          />
        </span>
        <span className={surface === "page" ? "text-foreground" : "text-accent-on"}>
          {status.label}
        </span>
      </span>
      {info.availabilityNote && <span>{info.availabilityNote}</span>}
      {showTime && info.timezone && <LocalTime timezone={info.timezone} />}
    </p>
  );
}

export function CopyEmail({
  email,
  source,
  surface = "page",
  className,
}: {
  email: string;
  source: string;
  surface?: Surface;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success("Email copied");
      trackEvent("Email Copied", { source_page: source });
    } catch {
      // Clipboard blocked (permissions, insecure context): open the mail app
      window.location.href = `mailto:${email}`;
    }
  };

  const Icon = copied ? Check : Copy;

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy email address ${email}`}
      className={cn(
        "group inline-flex h-11 max-w-full items-center gap-3 rounded-full border pl-4 pr-1.5 text-sm font-medium transition-[border-color,transform] duration-300 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        surface === "page"
          ? "border-foreground/20 text-foreground hover:border-foreground/60 focus-visible:ring-accent focus-visible:ring-offset-background"
          : "border-accent-on/30 text-accent-on hover:border-accent-on/70 focus-visible:ring-accent-on focus-visible:ring-offset-accent",
        className,
      )}
    >
      <span className="truncate">{email}</span>
      <span
        aria-hidden="true"
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:scale-105",
          surface === "page" ? "bg-foreground text-background" : "bg-accent-on text-accent",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
