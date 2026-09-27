"use client";

import { useEffect, useState } from "react";
import { AVAILABILITY, type ContactInfo } from "@/lib/availability";
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
