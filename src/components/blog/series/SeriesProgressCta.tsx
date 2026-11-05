"use client";

import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { resetSeriesProgress, useSeriesProgress } from "@/lib/blog/series-progress";
import routes from "@/lib/routes";

// Start / continue button for a series, with this reader's progress
export default function SeriesProgressCta({
  seriesSlug,
  episodes,
}: {
  seriesSlug: string;
  episodes: { slug: string; title: string; number: number }[];
}) {
  const progress = useSeriesProgress(
    seriesSlug,
    episodes.map((e) => e.slug),
  );
  const first = episodes[0];
  const resume = episodes.find((e) => e.slug === progress.resume);

  const target = progress.ready && progress.started && resume ? resume : first;
  const label =
    !progress.ready || !progress.started
      ? "Start with episode 1"
      : progress.finished
        ? "Read again from episode 1"
        : `Continue with episode ${target.number}`;
  const percent = progress.ready ? Math.round((progress.readCount / episodes.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 rounded-[1.25rem] border border-foreground/10 bg-surface p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">Your progress</span>
        <span className="tnum text-foreground/60">
          {progress.ready ? `${progress.readCount} of ${episodes.length} read` : " "}
        </span>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-foreground/10"
        role="progressbar"
        aria-label="Episodes read"
        aria-valuemin={0}
        aria-valuemax={episodes.length}
        aria-valuenow={progress.ready ? progress.readCount : 0}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-expo"
          style={{ width: `${percent}%` }}
        />
      </div>
      <Link
        href={routes.public.blogPost(progress.finished ? first.slug : target.slug)}
        className="group inline-flex min-h-12 items-center justify-between gap-3 rounded-full bg-foreground px-5 py-3 font-medium text-background transition-transform active:scale-[0.98]"
      >
        <span className="flex min-w-0 flex-col">
          <span>{label}</span>
          {progress.ready && progress.started && !progress.finished && (
            <span className="truncate text-xs font-normal text-background/70">{target.title}</span>
          )}
        </span>
        <ArrowRight className="size-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
      <p className="text-xs leading-relaxed text-foreground/55">
        Progress is saved in this browser. An episode counts as read once you reach its end.
        {progress.ready && progress.started && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => resetSeriesProgress(seriesSlug)}
              className="inline-flex items-center gap-1 font-medium text-foreground/75 underline-offset-4 hover:text-foreground hover:underline"
            >
              <RotateCcw className="size-3" aria-hidden="true" />
              Reset
            </button>
          </>
        )}
      </p>
    </div>
  );
}
