import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import EpisodeReadMarker from "@/components/blog/series/EpisodeReadMarker";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";

type PagerEpisode = { slug: string; title: string; number: number };

// Previous / next episode at the end of a post, so a series reads straight through
export default function EpisodePager({
  series,
  episodes,
  currentSlug,
  preview,
}: {
  series: { slug: string; title: string; completed: boolean };
  episodes: PagerEpisode[];
  currentSlug: string;
  preview?: boolean;
}) {
  const index = episodes.findIndex((e) => e.slug === currentSlug);
  if (index < 0) return null;
  const prev = episodes[index - 1];
  const next = episodes[index + 1];

  const card =
    "group flex min-h-[7.5rem] flex-col justify-between gap-4 rounded-[1.25rem] border border-foreground/10 p-5 transition-colors hover:border-foreground/35";

  return (
    <nav aria-label="Series episodes" className="mt-14 border-t border-foreground/10 pt-10">
      {!preview && <EpisodeReadMarker seriesSlug={series.slug} postSlug={currentSlug} />}
      <p className="mb-5 flex items-center gap-2 text-sm text-foreground/60">
        <Layers className="size-4 text-accent-ink dark:text-accent" aria-hidden="true" />
        Episode {episodes[index].number} of {episodes.length} in{" "}
        <Link
          href={routes.public.series(series.slug)}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {series.title}
        </Link>
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {prev ? (
          <Link href={routes.public.blogPost(prev.slug)} rel="prev" className={card}>
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">
              <ArrowLeft className="size-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
              Episode {prev.number}
            </span>
            <span className="text-balance font-display text-lg font-semibold leading-snug tracking-[-0.01em]">
              {prev.title}
            </span>
          </Link>
        ) : (
          <div className="hidden sm:block" />
        )}

        {next ? (
          <Link
            href={routes.public.blogPost(next.slug)}
            rel="next"
            className={cn(card, "bg-surface sm:text-right")}
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink dark:text-accent sm:justify-end">
              Next: episode {next.number}
              <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
            <span className="text-balance font-display text-lg font-semibold leading-snug tracking-[-0.01em]">
              {next.title}
            </span>
          </Link>
        ) : (
          <Link href={routes.public.series(series.slug)} className={cn(card, "bg-surface sm:text-right")}>
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-ink dark:text-accent">
              {series.completed ? "Series complete" : "You're up to date"}
            </span>
            <span className="text-balance text-base leading-snug text-foreground/75">
              {series.completed
                ? "That's the last episode. Back to the series overview."
                : "More episodes are on the way. See the series overview."}
            </span>
          </Link>
        )}
      </div>
    </nav>
  );
}
