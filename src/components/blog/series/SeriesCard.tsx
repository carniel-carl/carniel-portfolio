import Image from "next/image";
import Link from "next/link";
import { Layers } from "lucide-react";
import SeriesProgressChip from "@/components/blog/series/SeriesProgressChip";
import { formatMinutes } from "@/lib/blog/article";
import type { SeriesSummary } from "@/lib/blog/series";
import routes from "@/lib/routes";
import { cn } from "@/lib/utils";

export default function SeriesCard({
  series,
  className,
}: {
  series: SeriesSummary;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-foreground/10 bg-surface transition-colors hover:border-foreground/30",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b border-foreground/10">
        {series.coverImage ? (
          <Image
            src={series.coverImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.05]"
          />
        ) : (
          // Stacked sheets: a series is a pile of episodes
          <div aria-hidden="true" className="absolute inset-0 grid place-items-center">
            <div className="relative h-[52%] w-[46%]">
              <span className="absolute inset-0 translate-x-4 translate-y-[-1rem] rounded-xl border border-foreground/10 bg-background/40" />
              <span className="absolute inset-0 translate-x-2 translate-y-[-0.5rem] rounded-xl border border-foreground/15 bg-background/70" />
              <span className="absolute inset-0 flex items-end justify-between rounded-xl border border-foreground/20 bg-background p-3 transition-transform duration-700 ease-expo group-hover:-translate-y-1">
                <Layers className="size-5 text-accent-ink dark:text-accent" />
                <span className="font-display text-4xl font-semibold leading-none tracking-[-0.04em]">
                  {String(series.episodeCount).padStart(2, "0")}
                </span>
              </span>
            </div>
          </div>
        )}
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <SeriesProgressChip seriesSlug={series.slug} episodeSlugs={series.episodeSlugs} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5 md:p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-[0.12em] text-foreground/55">
          <span className="text-accent-ink dark:text-accent">Series</span>
          <span>{series.completed ? "Complete" : "Ongoing"}</span>
        </p>
        <h3 className="text-balance font-display text-2xl font-semibold leading-[1.1] tracking-[-0.025em]">
          <Link
            href={routes.public.series(series.slug)}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-[1.25rem] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {series.title}
          </Link>
        </h3>
        {series.description && (
          <p className="line-clamp-2 leading-relaxed text-foreground/70">{series.description}</p>
        )}
        <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-sm text-foreground/60">
          <span className="tnum">
            {series.episodeCount} {series.episodeCount === 1 ? "episode" : "episodes"}
          </span>
          <span className="size-1 rounded-full bg-foreground/30" aria-hidden="true" />
          <span className="tnum">{formatMinutes(series.totalMinutes)}</span>
          {series.levels && (
            <>
              <span className="size-1 rounded-full bg-foreground/30" aria-hidden="true" />
              <span>{series.levels}</span>
            </>
          )}
        </p>
      </div>
    </article>
  );
}
