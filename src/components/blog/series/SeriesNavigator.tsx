"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Check, ChevronDown, Layers } from "lucide-react";
import { markEpisodeOpened, useSeriesProgress } from "@/lib/blog/series-progress";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";

export type NavigatorEpisode = {
  slug: string;
  title: string;
  number: number;
  readingMinutes: number;
};

// The series this post belongs to, at the top of an episode: where you are,
// what you've finished, and every other episode one tap away.
export default function SeriesNavigator({
  series,
  episodes,
  currentSlug,
  preview,
}: {
  series: { slug: string; title: string; completed: boolean };
  episodes: NavigatorEpisode[];
  currentSlug: string;
  /** Admin preview: don't record progress */
  preview?: boolean;
}) {
  const slugs = episodes.map((e) => e.slug);
  const progress = useSeriesProgress(series.slug, slugs);
  const current = episodes.find((e) => e.slug === currentSlug);

  useEffect(() => {
    if (!preview) markEpisodeOpened(series.slug, currentSlug);
  }, [preview, series.slug, currentSlug]);

  const percent = progress.ready ? Math.round((progress.readCount / episodes.length) * 100) : 0;

  return (
    <details className="group mb-10 rounded-[1.25rem] border border-foreground/10 bg-surface">
      <summary className="flex cursor-pointer list-none flex-col gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-start justify-between gap-4">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">
              <Layers className="size-3.5 text-accent-ink dark:text-accent" aria-hidden="true" />
              Series
            </span>
            <span className="text-balance font-display text-lg font-semibold leading-snug tracking-[-0.01em]">
              {series.title}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2 pt-0.5 text-sm text-foreground/60">
            <span className="tnum">
              {current ? `${current.number} of ${episodes.length}` : `${episodes.length} episodes`}
            </span>
            <ChevronDown
              className="size-4 transition-transform duration-300 group-open:rotate-180"
              aria-hidden="true"
            />
          </span>
        </span>
        <span className="flex items-center gap-3">
          <span
            className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10"
            role="progressbar"
            aria-label="Episodes finished"
            aria-valuemin={0}
            aria-valuemax={episodes.length}
            aria-valuenow={progress.ready ? progress.readCount : 0}
          >
            <span
              className="block h-full rounded-full bg-accent transition-[width] duration-700 ease-expo"
              style={{ width: `${percent}%` }}
            />
          </span>
          <span className="tnum min-w-[4.5rem] text-right text-xs text-foreground/55">
            {progress.ready ? `${progress.readCount} done` : " "}
          </span>
        </span>
      </summary>

      <nav aria-label={`Episodes in ${series.title}`} className="border-t border-foreground/10 px-2 py-2">
        <ol className="flex flex-col">
          {episodes.map((ep) => {
            const isCurrent = ep.slug === currentSlug;
            const done = progress.ready && progress.read.has(ep.slug);
            return (
              <li key={ep.slug}>
                <Link
                  href={routes.public.blogPost(ep.slug)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={cn(
                    "grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                    isCurrent ? "bg-foreground/[0.06] text-foreground" : "text-foreground/70 hover:bg-foreground/[0.04] hover:text-foreground",
                  )}
                >
                  <span className={cn("tnum font-mono text-xs", isCurrent ? "text-accent-ink dark:text-accent" : "text-foreground/45")}>
                    {String(ep.number).padStart(2, "0")}
                  </span>
                  <span className={cn("leading-snug", isCurrent && "font-medium")}>
                    {ep.title}
                    {isCurrent && <span className="sr-only"> (current episode)</span>}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-foreground/50">
                    {done ? (
                      <Check className="size-3.5 text-accent-ink dark:text-accent" aria-label="Finished" />
                    ) : (
                      <span className="tnum">{ep.readingMinutes} min</span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-between gap-3 px-3 pb-2 pt-3 text-xs text-foreground/55">
          <span>{series.completed ? "Complete series" : "More episodes coming"}</span>
          <Link
            href={routes.public.series(series.slug)}
            className="font-medium text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
          >
            Series overview
          </Link>
        </div>
      </nav>
    </details>
  );
}
